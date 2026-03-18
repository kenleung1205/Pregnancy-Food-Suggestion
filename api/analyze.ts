import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel 後端會自動抓取這個變數
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, imageBase64 } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `你是一位專業的孕婦營養專家... (請把原本那段長長的 Prompt 貼在這裡) ...`;

    const parts: any[] = [{ text: prompt }];
    if (text) parts.push({ text: `查詢食物：${text}` });
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const response = await result.response;
    
    // 將結果傳回給前端
    res.status(200).json(JSON.parse(response.text()));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}