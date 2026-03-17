import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AnalysisResult {
  foodName: string;
  safetyStatus: '安全' | '需注意' | '避免';
  safetyExplanation: string;
  nutrition: string;
  alternatives: string;
}

export async function analyzeFood(text: string, imageBase64: string | null): Promise<AnalysisResult> {
  const prompt = `你是一位專業的孕婦營養專家。請分析以下食物、菜式或食材。
請以 JSON 格式回覆，包含以下欄位：
- foodName: 識別出的食物名稱
- safetyStatus: 只能是 "安全"、"需注意" 或 "避免" 其中之一
- safetyExplanation: 解釋為何安全、需注意或避免（支援 Markdown，**請務必將重點文字加粗**）
- nutrition: 這食物對孕婦和胎兒有什麼主要營養好處或隱患？（支援 Markdown，**請務必將重點文字加粗**）
- alternatives: 如果有安全疑慮，或有更健康的選擇，請提供替代建議。（支援 Markdown，**請務必將重點文字加粗**）

請用繁體中文（香港/廣東話口吻亦可）回答。`;

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
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING, description: "識別出的食物名稱" },
          safetyStatus: { type: Type.STRING, description: "安全狀態", enum: ["安全", "需注意", "避免"] },
          safetyExplanation: { type: Type.STRING, description: "安全性解釋" },
          nutrition: { type: Type.STRING, description: "營養價值" },
          alternatives: { type: Type.STRING, description: "替代方案" }
        },
        required: ["foodName", "safetyStatus", "safetyExplanation", "nutrition", "alternatives"]
      }
    }
  });

  if (!response.text) {
    throw new Error("無法獲取分析結果，請稍後再試。");
  }

  try {
    return JSON.parse(response.text) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("解析分析結果時發生錯誤。");
  }
}
