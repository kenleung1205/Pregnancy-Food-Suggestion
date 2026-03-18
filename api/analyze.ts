import { GoogleGenAI, Type } from '@google/genai';

// 伺服器端直接用 process.env
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { text, imageBase64 } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // 這裡建議用最新的模型

    // 把原本 gemini.ts 那段長長的 Prompt 貼在這裡
    const prompt = `你是一位專業的孕婦營養專家...（中間省略，請複製你原本那段）...`;

    const parts: any[] = [{ text: prompt }];
    if (text) parts.push({ text: `查詢食物：${text}` });
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseMimeType: "application/json",
        // 把你原本的 responseSchema 也貼在這裡
      }
    });

    const response = await result.response;
    res.status(200).json(JSON.parse(response.text()));
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}