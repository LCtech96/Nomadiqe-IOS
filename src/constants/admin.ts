/**
 * Admin – solo questa email può vedere il pannello Admin (e usare funzioni admin).
 * Nessun altro utente vede il link "Pagina Admin" in Profilo.
 */

export const ADMIN_EMAILS: string[] = [
  'facevoiceai@gmail.com',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}
