import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing
app.use(express.json({ limit: '10mb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/analyze-canvas", async (req, res) => {
  try {
    const { image } = req.body; // base64 image data
    if (!image) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const prompt = `
      Anda adalah pakar psikologi seni dan pendamping kesehatan Zen. 
      Analisis goresan kuas pada gambar (kanvas emosi) ini. 
      Interpretasikan perasaan, energi, dan kondisi mental yang terpancar dari abstraksi ini.
      
      Berikan respon dalam format JSON murni:
      {
        "state": "Nama kondisi emosional (Bahasa Indonesia)",
        "confidence": 0.XX (angka 0-1),
        "metrics": [
          { "label": "Energi Kinetik", "value": "Rendah/Sedang/Tinggi" },
          { "label": "Ritme Goresan", "value": "Tegang/Mengalir/Acak" },
          { "label": "Ketegangan Spasial", "value": "Rendah/Sedang/Tinggi" }
        ],
        "recommendation": "Saran pemulihan atau apresiasi puitis singkat (Bahasa Indonesia)"
      }
    `;

    // Remove the data aspect of the base64 string
    const base64Data = image.split(",")[1];

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/png",
            },
          },
        ]
      }
    });

    const text = result.text;
    
    // Attempt to parse JSON from the potential markdown block
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    res.json(analysis);
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({ error: "Gagal menganalisis kanvas" });
  }
});

// Proxy routes for existing gemini logic if needed
app.post("/api/gemini/reflection", async (req, res) => {
  try {
    const { text, temperature } = req.body;
    const prompt = `Anda adalah seorang sahabat sekaligus pendamping harian yang sangat hangat, ramah, periang, dan penuh semangat. Bacalah cerita hari ini berikut ini. Berikan tanggapan yang sangat suportif, membesarkan hati, mengapresiasi setiap tindakan mereka hari ini, dan memberikan dorongan semangat yang tulus serta penuh energi positif agar mereka bahagia serta termotivasi menyambut hari esok. Gunakan bahasa Indonesia yang santun, ekspresif, puitis namun tetap komunikatif, seolah-olah berbicara dengan sahabat karib. Cerita: "${text}"`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 500,
        temperature: temperature || 0.8,
      }
    });

    res.json({ text: result.text });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate reflection" });
  }
});

app.post("/api/gemini/sentiment", async (req, res) => {
  try {
    const { text } = req.body;
    const prompt = `Analisis kisah harian berikut. Berikan ringkasan super singkat (maksimal 30 kata) dalam Bahasa Indonesia yang berisi: 1. Aura/energi dominan hari ini (misal: Semangat, Damai, Berjuang). 2. Satu kalimat apresiasi hangat untuk usaha mereka hari ini. Kisah: "${text}"`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 150,
        temperature: 0.5,
        }
      });

    res.json({ text: result.text });
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

app.post("/api/analyze-weekly-emotions", async (req, res) => {
  try {
    const { entries, last7Dates } = req.body;
    if (!last7Dates || !Array.isArray(last7Dates)) {
      return res.status(400).json({ error: "last7Dates array is required" });
    }

    const prompt = `
      Anda adalah seorang pendamping kesehatan psikologis dan analis emosi Zen yang bijaksana dan sangat hangat.
      Tugas Anda adalah menganalisis jurnal harian pengguna dalam 7 hari terakhir dan memetakan kepribadian/suara hati mereka menjadi garis tren emosi mingguan.

      Berikut adalah tanggal-tanggal dalam 7 hari terakhir:
      ${JSON.stringify(last7Dates)}

      Berikut adalah entri jurnal yang ditulis pengguna pada tanggal-tanggal tersebut (jika ada):
      ${JSON.stringify(entries || [])}

      Petunjuk Analisis:
      1. Untuk tanggal yang memiliki entri jurnal, analisis sentimen dan emosi pengguna berdasarkan teks asli maupun 'sentimentSummary'. Berikan 'score' emosional antara 0 (sangat sedih/emas/terpuruk) hingga 100 (sangat bahagia/damai/bersemangat). Berikan satu kata 'emotion' dalam Bahasa Indonesia yang dominan (misal: "Gelisah", "Semangat", "Tenang", "Sedih", "Damai").
      2. Untuk tanggal yang TIDAK memiliki entri jurnal, buat perkiraan emosi yang rasional berdasarkan tren emosi hari sebelum/sesudahnya, dengan 'score' berporos di sekitar 50 (netral/hening) jika tidak ada indikasi lain, gambarkan kondisi 'emotion' sebagai "Hening" atau "Stabil" atau transisi lembut.
      3. Berikan 'summary' berupa ringkasan naratif emosi mingguan dalam Bahasa Indonesia yang sangat hangat, puitis, penuh empati, dan membesarkan hati (sekitar 60-80 kata). Gambarkan pola emosi mereka minggu ini, akui bagian-bagian yang sulit dengan welas asih, dan rayakan momen kegembiraan mereka.

      Format respon harus berupa JSON murni sesuai dengan skema yang dideklarasikan.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A warm, poetic analysis/summary of user's feelings over the week in Indonesian (60-80 words)."
            },
            points: {
              type: Type.ARRAY,
              description: "Array of exactly 7 items corresponding to each of the last 7 dates ordered chronologically from oldest to newest.",
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING, description: "YYYY-MM-DD date matching the list of last 7 dates" },
                  score: { type: Type.INTEGER, description: "Emotional score between 0 and 100" },
                  emotion: { type: Type.STRING, description: "One-word dominant emotion in Indonesian (e.g. Cemas, Bahagia, Tenang, Hebat, Sedih, Damai, Hening, Berjuang)" },
                  explanation: { type: Type.STRING, description: "Very short explanation (max 10 words) of why this score/emotion was chosen" }
                },
                required: ["date", "score", "emotion", "explanation"]
              }
            }
          },
          required: ["summary", "points"]
        }
      }
    });

    const text = result.text;
    const analysis = JSON.parse(text || "{}");
    res.json(analysis);
  } catch (error) {
    console.error("Weekly analysis error:", error);
    res.status(500).json({ error: "Gagal memproses analisis emosi mingguan" });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
