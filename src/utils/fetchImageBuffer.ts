// utils/fetchImageBuffer.ts
export async function fetchImageAsBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${url}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
