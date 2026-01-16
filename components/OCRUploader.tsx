import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Camera, Loader2 } from 'lucide-react';

interface OCRUploaderProps {
  onTextExtracted: (text: string) => void;
}

export const OCRUploader: React.FC<OCRUploaderProps> = ({ onTextExtracted }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      // Basic cleanup of OCR text
      const cleanText = result.data.text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      onTextExtracted(cleanText);
    } catch (err) {
      console.error("OCR Error:", err);
      alert("Failed to extract text from image. Please try a clearer image.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Auto-Fill from Image (OCR)
      </label>
      
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 shadow-sm text-sm font-medium transition-all
            ${isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50 hover:border-brand-500'}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {progress > 0 ? `Scanning ${progress}%` : 'Initializing...'}
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              <span>Upload / Camera</span>
            </>
          )}
        </button>
        
        {!isProcessing && (
           <span className="text-xs text-slate-400">
             Takes a clear photo of an example sentence.
           </span>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};