import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message, Role, Attachment } from "../types";

const SYSTEM_INSTRUCTION = `
Anda adalah "SiPangkat", asisten virtual cerdas yang bekerja untuk Dinas Kesehatan Kota Samarinda (Dinkes Samarinda).
Tugas utama Anda adalah membantu Aparatur Sipil Negara (ASN) dan tenaga kesehatan memahami proses, syarat, dan alur Kenaikan Pangkat (KP).

Konteks & Knowledge Base (RAG):
1.  **Sumber Utama**: Pengguna memiliki akses ke Google Drive yang berisi dokumen resmi (Juknis, Surat Edaran Dinkes, PDF Regulasi).
2.  **Strategi**: Jika pengguna bertanya tentang hal spesifik (misal: "Apa syarat KP periode Oktober tahun ini?"), arahkan mereka untuk **mengunduh dokumen dari link Google Drive di aplikasi** dan **mengunggahnya ke chat** agar Anda bisa menganalisisnya.
3.  **Prioritas**: Jika pengguna melampirkan dokumen, JANGAN gunakan pengetahuan umum. Analisis isi dokumen tersebut secara mendalam.

Gaya Komunikasi:
-   Ramah, profesional, birokratis namun melayani.
-   Gunakan format Markdown (Bold, Lists) agar mudah dibaca di HP.
-   Jika informasi tidak ada, sarankan menghubungi "Sub Bagian Umum & Kepegawaian Dinkes Samarinda".

Topik Umum:
-   KP Reguler (4 tahunan).
-   KP Pilihan (Jabatan Fungsional/Struktural).
-   Syarat Administrasi (SKP 2 tahun terakhir, PAK, SK Jabatan).
-   Jadwal/Periode KP (12 bulan, setiap bulan tiap tanggal 1).
`;

export class GeminiService {
  private modelName = "gemini-2.5-flash";

  constructor() {}

  async sendMessage(
    history: Message[],
    newMessage: string,
    attachments: Attachment[] = []
  ): Promise<string> {
    try {
      const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Convert internal Message format to Gemini Content format
      const contents: Content[] = history
        .filter((msg) => msg.role !== Role.SYSTEM && !msg.isError)
        .map((msg) => {
          const parts: Part[] = [{ text: msg.text }];

          if (msg.attachments && msg.attachments.length > 0) {
            msg.attachments.forEach((att) => {
              parts.push({
                inlineData: {
                  mimeType: att.type,
                  data: att.data,
                },
              });
            });
          }

          return {
            role: msg.role === Role.USER ? "user" : "model",
            parts: parts,
          };
        });

      // Add the new message
      const newParts: Part[] = [{ text: newMessage }];
      if (attachments.length > 0) {
        attachments.forEach((att) => {
          newParts.push({
            inlineData: {
              mimeType: att.type,
              data: att.data,
            },
          });
        });
      }
      contents.push({ role: "user", parts: newParts });

      const response = await client.models.generateContent({
        model: this.modelName,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.3, // Lower temperature for more factual responses
        },
      });

      return (
        response.text ||
        "Maaf, saya tidak dapat memproses permintaan Anda saat ini."
      );
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Pass through specific errors for App.tsx to handle (e.g. resetting key)
      if (
        error.message?.includes("API key") ||
        error.message?.includes("Requested entity was not found")
      ) {
        throw new Error("INVALID_API_KEY");
      }
      throw new Error(
        "Terjadi kesalahan saat menghubungi layanan AI. Silakan coba lagi."
      );
    }
  }
}
