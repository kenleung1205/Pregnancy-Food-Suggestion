import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeFood(text: string, imageBase64: string | null): Promise<string> {
  const prompt = `你是一位專業的孕婦營養專家。請分析以下食物、菜式或食材，並提供以下資訊：
1. **安全性**：孕婦可以吃嗎？（安全 / 需注意 / 避免），請解釋原因。
2. **營養價值**：這食物對孕婦和胎兒有什麼主要營養好處或隱患？
3. **替代方案**：如果有安全疑慮，或有更健康的選擇，請提供替代建議。

請用繁體中文（香港/廣東話口吻亦可）回答，並使用 Markdown 格式排版，使其易於閱讀。`;

  const parts: any[] = [{ text: prompt }];

  if (text) {
    parts.push({ text: `查詢食物：${text}` });
  }

  if (imageBase64) {
    const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  if (parts.length === 1) {
    throw new Error("請輸入食物名稱或上傳照片。");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: { parts },
  });

  return response.text || "無法獲取分析結果，請稍後再試。";
}
