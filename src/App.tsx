/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Camera, Search, Leaf, X, Loader2, Info, ShieldCheck, AlertTriangle, ShieldAlert, HeartPulse, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { analyzeFood, AnalysisResult } from './services/gemini';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const analysis = await analyzeFood(inputText, image);
      setResult(analysis);
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
        return { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
      case '需注意': 
        return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' };
      case '避免': 
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
            <label htmlFor="food-input" className="block text-sm font-medium text-gray-700 mb-2">
              想查詢什麼食物？
            </label>
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
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-gray-800">{result.foodName}</h2>
              </div>

              {/* Safety Section */}
              {(() => {
                const config = getSafetyConfig(result.safetyStatus);
                const SafetyIcon = config.icon;
                return (
                  <div className={`rounded-2xl border ${config.border} overflow-hidden shadow-sm bg-white`}>
                    <div className={`${config.bg} px-4 py-3 border-b ${config.border} flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <SafetyIcon className={`w-5 h-5 ${config.color}`} />
                        <h3 className={`font-bold ${config.color}`}>安全性評估</h3>
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
              <div className="rounded-2xl border border-blue-200 overflow-hidden shadow-sm bg-white">
                <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-blue-800">營養價值</h3>
                </div>
                <div className="p-4">
                  <div className="markdown-body text-sm">
                    <Markdown>{result.nutrition}</Markdown>
                  </div>
                </div>
              </div>

              {/* Alternatives Section */}
              <div className="rounded-2xl border border-purple-200 overflow-hidden shadow-sm bg-white">
                <div className="bg-purple-50 px-4 py-3 border-b border-purple-200 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-purple-800">替代方案</h3>
                </div>
                <div className="p-4">
                  <div className="markdown-body text-sm">
                    <Markdown>{result.alternatives}</Markdown>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
