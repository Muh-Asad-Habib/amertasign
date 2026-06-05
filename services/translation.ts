export interface TextToSignResult {
  visualUrl: string;
  description: string;
}

const wait = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration));

export async function detectSign(isActive: boolean): Promise<string> {
  if (!isActive) {
    await wait(300);
    return 'Menunggu deteksi gerakan...';
  }

  await wait(2000);
  return 'Halo, apa kabar?';
}

export async function textToSign(text: string): Promise<TextToSignResult> {
  const cleanText = text.trim();

  await wait(1400);

  return {
    visualUrl: cleanText ? `mock://sign-visual/${encodeURIComponent(cleanText)}` : 'mock://sign-visual/placeholder',
    description: cleanText
      ? `Visual placeholder siap untuk kalimat: “${cleanText}”`
      : 'Visual bahasa isyarat akan tampil di sini.',
  };
}
