import React, { useState, useEffect } from 'react';
import { Wand2, RefreshCcw, Type, Sparkles, ArrowDown } from 'lucide-react';

interface RubyInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  enableAutoDetect?: boolean; // If true, tries to find Kanji automatically
}

interface RubySegment {
  id: string;
  base: string;
  reading: string;
  isKanji: boolean;
}

export const RubyInput: React.FC<RubyInputProps> = ({ 
  value, 
  onChange, 
  label, 
  placeholder,
  // enableAutoDetect - removed from destructuring because it is currently unused in logic, causing TS build error
}) => {
  const [mode, setMode] = useState<'visual' | 'raw'>('visual');
  const [segments, setSegments] = useState<RubySegment[]>([]);
  
  // Helper: Detect if char is Kanji (Basic CJK range)
  const isKanjiChar = (char: string) => {
    return /[\u4e00-\u9faf\u3400-\u4dbf]/.test(char);
  };

  // Parse string "漢[かん]字[じ]" into segment objects
  const parseValueToSegments = (text: string): RubySegment[] => {
    const newSegments: RubySegment[] = [];
    // Split by bracket groups or single characters if no brackets
    const regex = /([^\s\[]+)(?:\[([^\]]*)\])|([\s\S])/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        // Matched format: Base[Reading]
        newSegments.push({
          id: Math.random().toString(36).substr(2, 9),
          base: match[1],
          reading: match[2],
          isKanji: true
        });
      } else if (match[3]) {
        // Matched single character (no brackets)
        const char = match[3];
        // If we are in auto-detect mode, splitting by character helps
        // But here we just keep raw text unless specifically broken down
        newSegments.push({
          id: Math.random().toString(36).substr(2, 9),
          base: char,
          reading: '',
          isKanji: isKanjiChar(char)
        });
      }
    }
    
    // If empty or parsing failed to produce segments (e.g. empty string), return empty
    if (newSegments.length === 0 && text) {
        return text.split('').map(c => ({
            id: Math.random().toString(36).substr(2, 9),
            base: c,
            reading: '',
            isKanji: isKanjiChar(c)
        }));
    }
    
    return newSegments;
  };

  // Reconstruct segments back to string "漢[かん]字[じ]"
  const segmentsToString = (segs: RubySegment[]) => {
    return segs.map(s => {
      if (s.reading.trim()) {
        return `${s.base}[${s.reading}]`;
      }
      return s.base;
    }).join('');
  };

  // Initial load
  useEffect(() => {
    const parsed = parseValueToSegments(value);
    setSegments(parsed);
    // If initial value is empty, user probably wants to type, so default to raw for sentences
    // But for "Term", we might want visual. Let's stick to visual default but show empty state.
  }, []);

  // Handle changes in Visual Mode
  const handleSegmentChange = (id: string, field: keyof RubySegment, newVal: string) => {
    const updated = segments.map(s => {
      if (s.id === id) return { ...s, [field]: newVal };
      return s;
    });
    setSegments(updated);
    onChange(segmentsToString(updated));
  };

  // Auto-Magic: Split raw text into individual characters and enable reading for Kanji
  const autoTokenize = () => {
    // If currently has value, split it char by char
    const currentText = segmentsToString(segments); // Get current valid string
    if (!currentText) return;

    const chars = currentText.split('');
    const newSegs = chars.map(c => ({
      id: Math.random().toString(36).substr(2, 9),
      base: c,
      reading: '',
      isKanji: isKanjiChar(c)
    }));
    setSegments(newSegs);
    onChange(segmentsToString(newSegs));
    setMode('visual'); // Ensure we switch to visual
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    setSegments(parseValueToSegments(val));
  };

  // New function to handle the "Confirm" action from Raw mode
  const handleConfirmAndDetect = () => {
    // 1. Take current raw value
    if (!value) return;
    
    // 2. Tokenize it (Character split for max flexibility with Kanji)
    const chars = value.split('');
    const newSegs = chars.map(c => ({
      id: Math.random().toString(36).substr(2, 9),
      base: c,
      reading: '',
      isKanji: isKanjiChar(c)
    }));

    // 3. Update State & Switch Mode
    setSegments(newSegs);
    onChange(segmentsToString(newSegs)); // Update parent with bracket format if needed immediately
    setMode('visual');
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-end mb-1">
          <label className="block text-sm font-medium text-slate-700">{label}</label>
          <div className="flex gap-1">
            {mode === 'visual' && (
              <button 
                type="button"
                onClick={autoTokenize}
                className="text-xs flex items-center gap-1 text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded transition-colors"
                title="Split into characters and highlight Kanji"
              >
                <Wand2 className="w-3 h-3" /> Auto-Detect Kanji
              </button>
            )}
            <button
              type="button"
              onClick={() => setMode(mode === 'visual' ? 'raw' : 'visual')}
              className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded transition-colors"
            >
              {mode === 'visual' ? <><Type className="w-3 h-3" /> Raw Text</> : <><RefreshCcw className="w-3 h-3" /> Visual Editor</>}
            </button>
          </div>
        </div>
      )}

      {mode === 'raw' ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={value}
            onChange={handleRawChange}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm"
            rows={3}
            placeholder={placeholder || "Type sentence here (e.g. 図書館で勉強した)..."}
          />
          {/* Confirm Button for Raw Mode */}
          {value && (
            <button
              type="button"
              onClick={handleConfirmAndDetect}
              className="flex items-center justify-center gap-2 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Analyze & Add Readings (確認並標註)
            </button>
          )}
        </div>
      ) : (
        <div className="p-3 border border-slate-300 rounded-lg bg-slate-50 min-h-[5rem] flex flex-wrap gap-y-4 gap-x-1 items-end transition-all">
          {segments.map((seg) => (
            <div key={seg.id} className="flex flex-col items-center group relative">
              {/* Reading Input (Furigana) */}
              <input
                type="text"
                value={seg.reading}
                onChange={(e) => handleSegmentChange(seg.id, 'reading', e.target.value)}
                className={`w-full min-w-[1.5rem] text-center text-xs p-0 border-b border-transparent bg-transparent focus:bg-white focus:border-brand-500 outline-none mb-0.5
                  ${seg.reading ? 'opacity-100 text-brand-600 font-medium' : 'opacity-0 group-hover:opacity-100 focus:opacity-100 placeholder:text-slate-300'}`}
                placeholder={seg.isKanji ? "kana" : ""}
              />
              
              {/* Base Input (Kanji/Text) */}
              <input
                type="text"
                value={seg.base}
                onChange={(e) => handleSegmentChange(seg.id, 'base', e.target.value)}
                className={`text-center p-1 rounded border border-transparent hover:border-slate-300 focus:border-brand-500 focus:bg-white outline-none transition-all
                   ${seg.isKanji ? 'bg-white font-bold text-slate-800 shadow-sm' : 'bg-transparent text-slate-600'}`}
                style={{ width: `${Math.max(1.5, seg.base.length * 1.5)}rem` }}
              />
            </div>
          ))}
          
          {/* Empty state placeholder */}
          {segments.length === 0 && (
             <div 
               className="text-slate-400 text-sm italic w-full text-center py-4 cursor-pointer hover:text-brand-600 transition-colors flex flex-col items-center gap-2" 
               onClick={() => setMode('raw')}
             >
               <span>Click to type sentence...</span>
               <ArrowDown className="w-4 h-4 opacity-50" />
             </div>
          )}
        </div>
      )}
      
      {mode === 'visual' && (
        <p className="text-[10px] text-slate-400 mt-1">
          * Enter reading in top box, Kanji in bottom.
        </p>
      )}
    </div>
  );
};