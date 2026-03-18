// 定義回傳資料的格式（保持不變）
export interface AnalysisResult {
  foodName: string;
  safetyStatus: '安全' | '需注意' | '避免';
  safetyExplanation: string;
  nutrition: string;
  alternatives: string;
}

// 這個函數現在只負責「打電話」給你的 Vercel 後端
export async function analyzeFood(text: string, imageBase64: string | null): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      imageBase64
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    // 如果後端報錯（例如地區不支援），這裡會抓到具體訊息
    throw new Error(errorData.error || '分析失敗');
  }

  return await response.json();
}