import React, { useState, useEffect } from 'react';
import { Flashcard, Proficiency } from '../types';
import { CheckCircle, HelpCircle, XCircle, ArrowLeft, Eye, EyeOff, Link2, StickyNote } from 'lucide-react';
import { RubyText } from './RubyText';

interface ReviewModeProps {
  cards: Flashcard[];
  onUpdateProficiency: (id: string, level: Proficiency) => void;
  onExit: () => void;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ cards, onUpdateProficiency, onExit }) => {
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFurigana, setShowFurigana] = useState(false); // New Toggle state
  
  // Stats for the current session feedback
  const [sessionStats, setSessionStats] = useState({ mastered: 0, hazy: 0, forgot: 0 });

  useEffect(() => {
    // Randomize cards for review (limit to 20)
    const sessionCards = [...cards].sort(() => Math.random() - 0.5).slice(0, 20);
    setQueue(sessionCards);
  }, [cards]);

  const handleRate = (level: Proficiency) => {
    const currentCard = queue[currentIdx];
    
    // 1. Update the card data in the global state
    onUpdateProficiency(currentCard.id, level);
    
    // 2. Calculate new stats locally
    const statsKey = level as keyof typeof sessionStats;
    const newStats = {
      ...sessionStats,
      [statsKey]: (sessionStats[statsKey] || 0) + 1
    };
    setSessionStats(newStats);

    if (currentIdx < queue.length - 1) {
      // Move to next card
      setCurrentIdx(prev => prev + 1);
      setIsFlipped(false);
      setShowFurigana(false); // Reset furigana toggle on next card
    } else {
      // End of session: Increase timeout to 100ms to ensure React batch updates and local storage effects run.
      setTimeout(() => {
        alert(`Session Complete!\n\nMastered: ${newStats.mastered}\nHazy: ${newStats.hazy}\nForgot: ${newStats.forgot}`);
        onExit();
      }, 100);
    }
  };

  if (queue.length === 0) return <div className="p-10 text-center text-slate-500">No cards to review! Add some cards first.</div>;

  const card = queue[currentIdx];

  // Logic to determine if we should show the toggle button
  // 1. JP Language
  // 2. Either has 'reading' field OR has Ruby brackets in 'term'
  const hasReading = card.language === 'JP' && (!!card.reading || card.term.includes('['));

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
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center backface-hidden relative">
              
              {/* Furigana Toggle (Only for JP) */}
              {hasReading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowFurigana(!showFurigana); }}
                  className="absolute top-6 right-6 p-2 text-slate-300 hover:text-brand-600 bg-slate-50 rounded-full transition-colors z-20"
                  title="Toggle Furigana Reading"
                >
                  {showFurigana ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </button>
              )}

              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Term</span>
              
              {/* Ruby Display Logic */}
              <div className="flex flex-col items-center justify-center">
                 {/* 
                   If using separate 'reading' field and NO brackets in term, show it separately.
                   If using brackets in term, RubyText handles it via showFurigana.
                 */}
                 {card.language === 'JP' && showFurigana && card.reading && !card.term.includes('[') && (
                   <span className="text-xl text-slate-500 mb-1 animate-in fade-in slide-in-from-bottom-2">
                     {card.reading}
                   </span>
                 )}

                 {/* Use RubyText for term. If term has brackets, showFurigana prop controls visibility. */}
                 <div className="text-5xl font-black text-slate-800 mb-2">
                   <RubyText text={card.term} showFurigana={showFurigana} />
                 </div>
                 
                 {card.language !== 'JP' && card.reading && (
                   <p className="text-xl text-slate-400 font-serif mt-2">{card.reading}</p>
                 )}
              </div>

              <p className="mt-8 text-xs text-slate-400">(Tap to flip)</p>
            </div>
          )}

          {/* Back */}
          {isFlipped && (
            <div className="absolute inset-0 flex flex-col p-8 overflow-y-auto bg-slate-50 rounded-3xl backface-hidden rotate-y-180">
               <div className="flex justify-between items-baseline mb-4 border-b pb-2">
                 <h2 className="text-2xl font-bold text-brand-600">
                   <RubyText text={card.term} />
                 </h2>
                 {card.language === 'JP' && card.reading && !card.term.includes('[') && (
                    <span className="text-lg text-slate-500">{card.reading}</span>
                 )}
               </div>

               <div className="space-y-6 text-left pb-4">
                  {card.blocks.map((block, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full font-bold">{block.pos}</span>
                      </div>
                      
                      <div className="mb-3">
                         {block.defEN && <p className="text-slate-800 font-bold">{block.defEN}</p>}
                         {block.defCN && <p className="text-slate-500 text-sm">{block.defCN}</p>}
                      </div>

                      {block.imageUrl && (
                        <img src={block.imageUrl} alt="visual aid" className="w-full h-32 object-cover rounded-lg mb-3" />
                      )}

                      {(block.sentenceEN || block.sentenceCN) && (
                        <div className="bg-slate-50 p-2 rounded-lg border-l-2 border-brand-300 mb-3">
                          {block.sentenceEN && (
                            <div className="text-sm text-slate-800 leading-relaxed">
                               <RubyText text={block.sentenceEN} />
                            </div>
                          )}
                          {block.sentenceCN && <p className="text-xs text-slate-400 mt-1">{block.sentenceCN}</p>}
                        </div>
                      )}

                      {/* Synonyms / Antonyms Display */}
                      {(block.synonyms || block.antonyms) && (
                        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-slate-100">
                           {block.synonyms && (
                             <div className="text-xs">
                               <span className="font-bold text-green-600 mr-1">Syn:</span>
                               <span className="text-slate-600">{block.synonyms}</span>
                             </div>
                           )}
                           {block.antonyms && (
                             <div className="text-xs">
                               <span className="font-bold text-red-500 mr-1">Ant:</span>
                               <span className="text-slate-600">{block.antonyms}</span>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Note Display */}
                  {card.note && (
                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-700 mb-1">
                        <StickyNote className="w-3 h-3" />
                        <span className="text-xs font-bold uppercase">Note</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{card.note}</p>
                    </div>
                  )}
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
            <span className="font-bold text-sm">Forgot</span>
          </button>
          
          <button 
            onClick={() => handleRate('hazy')}
            className="flex flex-col items-center justify-center py-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl border-2 border-yellow-100 transition-colors"
          >
            <HelpCircle className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">Hazy</span>
          </button>

          <button 
            onClick={() => handleRate('mastered')}
            className="flex flex-col items-center justify-center py-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl border-2 border-green-100 transition-colors"
          >
            <CheckCircle className="w-6 h-6 mb-1" />
            <span className="font-bold text-sm">Mastered</span>
          </button>
        </div>
      </div>
    </div>
  );
};