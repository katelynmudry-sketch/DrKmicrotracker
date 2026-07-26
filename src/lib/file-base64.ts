// Shared by any flow that sends a File directly to a server fn as base64
// (no Storage upload) — rubric PDF extraction and pantry photo scanning.
// Chunked to avoid a call-stack overflow from String.fromCharCode(...bytes)
// on large files.
export async function fileToBase64(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
