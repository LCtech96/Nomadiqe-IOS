/**
 * Loads .env and exposes EXPO_PUBLIC_* to the runtime bundle through expo.extra.
 * Fixes missing env on the device (Supabase fetch → "Network request failed").
 *
 * If values are still empty, ensure `.env` is saved to disk (not only open in the editor).
 */
const fs = require('fs');
const path = require('path');
const { loadProjectEnv } = require('@expo/env');

const projectRoot = path.resolve(__dirname);
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
loadProjectEnv(projectRoot, { silent: true, force: true });

/** Minimal KEY=VALUE parser when dotenv / @expo/env see an empty or odd file. */
function parseEnvFile(filePath) {
  const out = {};
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return out;
    for (const line of raw.split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith('#')) continue;
      const eq = s.indexOf('=');
      if (eq === -1) continue;
      const key = s.slice(0, eq).trim();
      let val = s.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key) out[key] = val;
    }
  } catch (_) {
    // missing .env is fine
  }
  return out;
}

const trim = (v) => (typeof v === 'string' ? v.trim() : '');

const fromFile = parseEnvFile(path.join(projectRoot, '.env'));

const supabaseUrl = trim(
  process.env.EXPO_PUBLIC_SUPABASE_URL || fromFile.EXPO_PUBLIC_SUPABASE_URL
);
const supabaseAnonKey = trim(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || fromFile.EXPO_PUBLIC_SUPABASE_ANON_KEY
);
const calendarExportBaseUrl = trim(
  process.env.EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL ||
    fromFile.EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL ||
    ''
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '\n[app.config] Supabase env missing: save `.env` in the project root with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Expo with -c.\n'
  );
}

module.exports = ({ config }) => ({
  ...config,
  updates: {
    url: "https://u.expo.dev/f8760479-d3b7-4660-a96d-b5a081ba294d",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  extra: {
    ...(config.extra || {}),
    EXPO_PUBLIC_SUPABASE_URL: supabaseUrl,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    EXPO_PUBLIC_CALENDAR_EXPORT_BASE_URL: calendarExportBaseUrl,
  },
});
