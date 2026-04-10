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
