export interface AnalysisResult {
  foodName: string;
  safetyStatus: '安全' | '需注意' | '避免';
  safetyExplanation: string;
  nutrition: string;
  alternatives: string;
}

export async function analyzeFood(text: string, imageBase64: string | null): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, imageBase64 }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '分析失敗');
  }
  return await response.json();
}