import React, { useState, useEffect } from 'react';
import { Flashcard, Proficiency } from '../types';
import { RotateCw, CheckCircle, HelpCircle, XCircle, ArrowLeft } from 'lucide-react';

interface ReviewModeProps {
  cards: Flashcard[];
  onUpdateProficiency: (id: string, level: Proficiency) => void;
  onExit: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ cards, onUpdateProficiency, onExit }) => {
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ mastered: 0, hazy: 0, forgot: 0 });

  useEffect(() => {
    // Randomize cards for review
    setQueue([...cards].sort(() => Math.random() - 0.5).slice(0, 20)); // Limit to 20 for a session
  }, [cards]);

  const handleRate = (level: Proficiency) => {
    const currentCard = queue[currentIdx];
    onUpdateProficiency(currentCard.id, level);
    
    // Update stats
    setSessionStats(prev => ({
      ...prev,
      [level]: (prev as any)[level] ? (prev as any)[level] + 1 : 1
    }));

    if (currentIdx < queue.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // End session
      alert(`本次課程完成！\n熟練: ${sessionStats.mastered}\n稍微記得: ${sessionStats.hazy}\n完全不記得: ${sessionStats.forgot}`);
      onExit();
    }
  };

  if (queue.length === 0) return <div className="p-10 text-center">Loading...</div>;

  const card = queue[currentIdx];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onExit} className="text-slate-500 hover:text-slate-800 flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" /> Quit Review
        </button>
        <span className="text-sm font-medium text-slate-400">Card {currentIdx + 1} / {queue.length}</span>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Card Area - Click to Flip */}
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className={`relative w-full aspect-[4/3] bg-white rounded-3xl shadow-2xl cursor-pointer transition-all duration-500 transform-style-3d mb-8 ${isFlipped ? 'rotate-y-180' : ''}`}
          style={{ perspective: '1000px' }}
        >
          {/* Front */}
          {!isFlipped && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Term</span>
              <h1 className="text-5xl font-black text-slate-800 mb-2">{card.term}</h1>
              {card.reading && <p className="text-2xl text-slate-500 font-serif">{card.reading}</p>}
              <p className="mt-8 text-xs text-slate-400">(Tap to flip)</p>
            </div>
          )}

          {/* Back */}
          {isFlipped && (
            <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto bg-slate-50 rounded-3xl">
               <h2 className="text-2xl font-bold text-brand-600 mb-4 border-b pb-2">{card.term}</h2>
               <div className="space-y-4 text-left">
                  {card.blocks.map((block, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-bold">{block.pos}</span>
                      </div>
                      <p className="text-slate-800 font-medium mb-2">{block.definition}</p>
                      {block.imageUrl && (
                        <img src={block.imageUrl} alt="visual aid" className="w-full h-32 object-cover rounded-lg mb-2" />
                      )}
                      {block.exampleSentence && (
                        <p className="text-sm text-slate-500 italic border-l-2 border-brand-300 pl-2">"{block.exampleSentence}"</p>
                      )}
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => handleRate('forgot')}
            className="flex flex-col items-center justify-center py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border-2 border-red-100 transition-colors"
          >
            <XCircle className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">完全不記得</span>
          </button>
          
          <button 
            onClick={() => handleRate('hazy')}
            className="flex flex-col items-center justify-center py-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl border-2 border-yellow-100 transition-colors"
          >
            <HelpCircle className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">稍微記得</span>
          </button>

          <button 
            onClick={() => handleRate('mastered')}
            className="flex flex-col items-center justify-center py-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl border-2 border-green-100 transition-colors"
          >
            <CheckCircle className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">熟練</span>
          </button>
        </div>
      </div>
    </div>
  );
};