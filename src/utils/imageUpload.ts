/**
 * Normalizza immagini galleria (es. HEIC da iPhone) in JPEG per upload Storage.
 */
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Converte l'URI in JPEG (necessario per HEIC e coerenza con bucket Supabase).
 */
export async function ensureJpegUriForUpload(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG }
  );
  return result.uri;
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

/**
 * Converte un URI locale in JPEG e restituisce ArrayBuffer per upload Storage (affidabile su RN).
 */
export async function prepareJpegUploadBody(uri: string): Promise<ArrayBuffer> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [],
    { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (result.base64) {
    return base64ToArrayBuffer(result.base64);
  }
  const response = await fetch(result.uri);
  return response.arrayBuffer();
}
