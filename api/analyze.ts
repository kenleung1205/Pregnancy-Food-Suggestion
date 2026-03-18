import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel 後端會自動抓取這個變數
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, imageBase64 } = req.body;
    
    // 關鍵修改：使用 gemini-1.5-flash-latest 確保 404 錯誤消失
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // 這是你原本的專業 Prompt
    const prompt = `你是一位專業的孕婦營養專家。請分析以下食物、菜式或食材。
請以 JSON 格式回覆，包含以下欄位：
- foodName: 識別出的食物名稱
- safetyStatus: 只能是 "安全"、"需注意" 或 "避免" 其中之一
- safetyExplanation: 解釋為何安全、需注意或避免（支援 Markdown，請務必將重點文字加粗）
- nutrition: 這食物對孕婦和胎兒有什麼主要營養好處或隱患？（支援 Markdown，請務必將重點文字加粗）
- alternatives: 如果有安全疑慮，或有更健康的選擇，請提供替代建議。（支援 Markdown，請務必將重點文字加粗）
請用繁體中文回答。`;

    const parts: any[] = [{ text: prompt }];
    if (text) parts.push({ text: `查詢食物：${text}` });
    
    if (imageBase64) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: { mimeType: match[1], data: match[2] }
        });
      }
    }

    const result = await model.generateContent({ contents: [{ role: "user", parts }] });
    const response = await result.response;
    let responseText = response.text();
    
    // 強力清理 Markdown 標籤：防止 AI 回傳 ```json ... ``` 導致崩潰
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.status(200).json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || "分析過程中發生未知錯誤" });
  }
}