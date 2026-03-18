/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Search, Leaf, X, Loader2, Info, ShieldCheck, AlertTriangle, ShieldAlert, HeartPulse, Lightbulb, Share2, Download, Languages, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { toPng } from 'html-to-image';
import { analyzeFood, translateResult, AnalysisResult } from './services/gemini';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handleTranslate = async () => {
    if (!result) return;
    setIsTranslating(true);
    try {
      const translated = await translateResult(result);
      setResult(translated);
    } catch (err: any) {
      console.error(err);
      setError("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("您的瀏覽器不支援語音輸入。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-HK';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev + (prev ? ' ' : '') + transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setError("語音識別失敗，請重試。");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleShareImage = async () => {
    if (!resultCardRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(resultCardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2, // Higher quality
        style: {
          padding: '24px',
          borderRadius: '32px',
        }
      });
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `pregnancy-food-guide-${result?.foodName}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: '孕婦飲食指南分析結果',
          text: `我正在使用孕婦飲食指南分析：${result?.foodName}`,
        });
      } else {
        throw new Error('SHARE_NOT_SUPPORTED');
      }
    } catch (err: any) {
      // Ignore user cancellation
      if (err.name === 'AbortError') {
        console.log('Share canceled by user');
        return;
      }

      console.error('Sharing failed', err);
      
      // Fallback to download if sharing fails or is not supported
      try {
        const dataUrl = await toPng(resultCardRef.current, {
          backgroundColor: '#ffffff',
          pixelRatio: 2,
          style: {
            padding: '24px',
            borderRadius: '32px',
          }
        });
        const link = document.createElement('a');
        link.download = `pregnancy-food-guide-${result?.foodName}.png`;
        link.href = dataUrl;
        link.click();
        setError("您的裝置不支援直接分享圖片，已改為下載圖片。");
      } catch (fallbackErr) {
        setError("分享失敗，請稍後再試。");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsImage = async () => {
    if (!resultCardRef.current) return;
    
    setIsExporting(true);
    try {
      const dataUrl = await toPng(resultCardRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          padding: '24px',
          borderRadius: '32px',
        }
      });
      
      const link = document.createElement('a');
      link.download = `pregnancy-food-guide-${result?.foodName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Could not generate image', err);
      setError("無法生成圖片，請稍後再試。");
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!result) return;

    const cleanText = (text: string) => text.replace(/[*_#]/g, '');
    
    const message = `🤰 *孕婦飲食指南分析結果* 🤰\n\n` +
      `🍴 *食物*：${result.foodName}\n` +
      `🛡️ *安全性*：${result.safetyStatus}\n\n` +
      `📝 *評估*：\n${cleanText(result.safetyExplanation)}\n\n` +
      `💪 *營養*：\n${cleanText(result.nutrition)}\n\n` +
      `💡 *建議*：\n${cleanText(result.alternatives)}\n\n` +
      `🔗 立即查詢：${window.location.href}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("圖片大小不能超過 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !image) {
      setError("請輸入食物名稱或上傳照片");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysisResult = await analyzeFood(inputText, image);
      setResult(analysisResult);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "分析時發生錯誤，請稍後再試。");
    } finally {
      setIsLoading(false);
    }
  };

  const getSafetyConfig = (status: string) => {
    switch(status) {
      case '安全': 
      case 'Safe':
        return { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
      case '需注意': 
      case 'Caution':
        return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' };
      case '避免': 
      case 'Avoid':
        return { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' };
      default: 
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-rose-500 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2">
          <Leaf className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-wide">孕婦飲食指南</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 mt-4">
        {/* Intro Card */}
        <div className="bg-rose-50 rounded-2xl p-4 mb-6 border border-rose-100 shadow-sm">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-800 leading-relaxed">
              不知道這能不能吃？輸入食材、菜式名稱，或直接上傳照片，讓我們為您分析安全性與營養價值！
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="food-input" className="block text-sm font-medium text-gray-700">
                想查詢什麼食物？
              </label>
              <button
                type="button"
                onClick={startListening}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>正在聆聽...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>語音輸入</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="food-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="例如：生蠔、木瓜、麻辣火鍋..."
              className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all resize-none h-24"
            />

            {/* Image Preview Area */}
            <AnimatePresence>
              {image && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 relative inline-block"
                >
                  <img src={image} alt="Preview" className="h-32 w-32 object-cover rounded-xl border border-gray-200" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors font-medium text-sm"
              >
                <Camera className="w-4 h-4" />
                <span>拍照 / 上傳</span>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm px-2">
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && !image)}
            className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-bold text-lg shadow-md hover:bg-rose-600 active:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>分析中...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>開始分析</span>
              </>
            )}
          </button>
        </form>

        {/* Results Area */}
        <AnimatePresence>
          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 space-y-5"
            >
              <div ref={resultCardRef} className="space-y-5 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-gray-800">{result.foodName}</h2>
                </div>

                {/* Safety Section */}
                {(() => {
                  const config = getSafetyConfig(result.safetyStatus);
                  const SafetyIcon = config.icon;
                  const isEnglish = result.safetyStatus === 'Safe' || result.safetyStatus === 'Caution' || result.safetyStatus === 'Avoid';
                  return (
                    <div className={`rounded-2xl border ${config.border} overflow-hidden shadow-sm bg-white`}>
                      <div className={`${config.bg} px-4 py-3 border-b ${config.border} flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                          <SafetyIcon className={`w-5 h-5 ${config.color}`} />
                          <h3 className={`font-bold ${config.color}`}>
                            {isEnglish ? 'Safety Assessment' : '安全性評估'}
                          </h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.badge}`}>
                          {result.safetyStatus}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="markdown-body text-sm">
                          <Markdown>{result.safetyExplanation}</Markdown>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Nutrition Section */}
                {(() => {
                  const isEnglish = result.safetyStatus === 'Safe' || result.safetyStatus === 'Caution' || result.safetyStatus === 'Avoid';
                  return (
                    <div className="rounded-2xl border border-blue-200 overflow-hidden shadow-sm bg-white">
                      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
                        <HeartPulse className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-blue-800">
                          {isEnglish ? 'Nutrition' : '營養價值'}
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="markdown-body text-sm">
                          <Markdown>{result.nutrition}</Markdown>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Alternatives Section */}
                {(() => {
                  const isEnglish = result.safetyStatus === 'Safe' || result.safetyStatus === 'Caution' || result.safetyStatus === 'Avoid';
                  return (
                    <div className="rounded-2xl border border-purple-200 overflow-hidden shadow-sm bg-white">
                      <div className="bg-purple-50 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold text-purple-800">
                          {isEnglish ? 'Alternatives' : '替代方案'}
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="markdown-body text-sm">
                          <Markdown>{result.alternatives}</Markdown>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* App Branding for Export */}
                <div className="pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-rose-400 opacity-60">
                  <Leaf className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-widest">孕婦飲食指南</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={handleTranslate}
                  disabled={isTranslating || isLoading || isExporting}
                  className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                  {(() => {
                    const isEnglish = result.safetyStatus === 'Safe' || result.safetyStatus === 'Caution' || result.safetyStatus === 'Avoid';
                    return <span>{isEnglish ? '翻譯為中文' : '翻譯為英文'}</span>;
                  })()}
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveAsImage}
                  disabled={isLoading || isExporting}
                  className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold shadow-sm hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>儲存為圖片</span>
                </button>
              </div>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShareImage}
                disabled={isLoading || isExporting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                <span>分享圖片至 WhatsApp</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
