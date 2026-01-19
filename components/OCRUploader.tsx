import React, { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { Camera, Loader2, Download } from 'lucide-react';
import { Language } from '../types';

interface OCRUploaderProps {
  language?: Language; // Optional prop, defaults to EN if not provided
  onTextExtracted: (text: string) => void;
}

export const OCRUploader: React.FC<OCRUploaderProps> = ({ language = 'EN', onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    setStatusText('Starting OCR...');

    try {
      // 1. Determine Language Code
      // 'jpn' is standard Japanese. 'eng' is English.
      const langCode = language === 'JP' ? 'jpn' : 'eng';
      
      console.log(`[OCR] Initializing worker for language: ${langCode}`);

      // 2. Initialize Worker with Logger
      // Note: Tesseract.js v5+ downloads the .traineddata files from CDN by default.
      // This step might take time on first run (especially for 'jpn' ~15MB).
      const worker = await createWorker(langCode, 1, {
        logger: m => {
          // Log status to UI
          if (m.status === 'recognizing text') {
            setStatusText('Extracting Text...');
            setProgress(Math.round(m.progress * 100));
          } else if (m.status.includes('downloading')) {
            // "downloading jpn.traineddata.gz"
            const p = m.progress ? Math.round(m.progress * 100) : 0;
            setStatusText(`Downloading Data (${p}%)...`);
          } else if (m.status.includes('loading')) {
             setStatusText('Loading Engine...');
          } else {
             setStatusText(m.status);
          }
        }
      });

      // 3. Recognize
      setStatusText('Processing Image...');
      const { data: { text } } = await worker.recognize(file);
      
      // 4. Terminate worker to free memory
      await worker.terminate();
      
      // 5. Cleanup Text
      let cleanText = text;
      
      if (language === 'JP') {
          // For Japanese: Remove all spaces (often OCR adds spaces between chars)
          // and replace newlines with nothing (continuous text)
          cleanText = cleanText.replace(/\s+/g, '');
      } else {
          // For English: Replace newlines with space, remove multiple spaces
          cleanText = cleanText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      }

      if (!cleanText) {
          alert("無法偵測文字。圖片可能太模糊或對比度太低。請嘗試更清晰的圖片。");
      } else {
          onTextExtracted(cleanText);
      }

    } catch (err: any) {
      console.error("OCR Error:", err);
      // Friendly error message for network issues
      if (err.message && err.message.includes('NetworkError')) {
          alert(`OCR Failed: Network Error.\n\nThe first time you use ${language === 'JP' ? 'Japanese' : 'English'} OCR, the app needs to download language data (~15MB). Please ensure you have internet access.`);
      } else {
          alert(`OCR Failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setStatusText('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-slate-700">
          圖片辨識自動填入 (OCR)
        </label>
        {isProcessing && (
           <span className="text-xs font-bold text-brand-600 animate-pulse">
             {statusText} {progress > 0 && progress < 100 ? `${progress}%` : ''}
           </span>
        )}
      </div>
      
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border shadow-sm text-sm font-medium transition-all
            ${isProcessing 
               ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' 
               : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-brand-500 hover:text-brand-600'
            }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>上傳 / 相機</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>上傳圖片</span>
            </>
          )}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {!isProcessing && (
         <p className="text-[10px] text-slate-400 mt-1.5 ml-1 flex items-center gap-1">
           <Download className="w-3 h-3" />
           {language === 'JP' ? '首次使用需下載日文資料。' : '首次使用需下載英文資料。'}
         </p>
      )}
    </div>
  );
};