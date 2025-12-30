import React, { useState, useEffect } from 'react';
import { Flashcard, ComparisonResult } from '../types';
import { analyzeSentence } from '../utils/analysis';
import { RefreshCw, Check, ArrowRight, XCircle, AlertTriangle } from 'lucide-react';

interface QuizModeProps {
  cards: Flashcard[];
  onExit: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({ cards, onExit }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);

  useEffect(() => {
    // Fisher-Yates shuffle
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
  }, [cards]);

  if (shuffledCards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">No cards available for quiz.</p>
        <button onClick={onExit} className="text-brand-600 hover:underline">Return to list</button>
      </div>
    );
  }

  const currentCard = shuffledCards[currentCardIndex];

  const checkAnswer = () => {
    const analysis = analyzeSentence(userInput, currentCard.exampleSentence);
    setResult(analysis);
  };

  const nextCard = () => {
    setResult(null);
    setUserInput('');
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      alert("Quiz Complete! Great job.");
      onExit();
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Sentence Practice</h2>
        <span className="text-sm font-medium text-slate-500">
          Card {currentCardIndex + 1} of {shuffledCards.length}
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-8">
        <div className="mb-8 text-center">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-2">Keyword</p>
          <h1 className="text-4xl font-extrabold text-brand-600 mb-4">{currentCard.word}</h1>
          <p className="text-lg text-slate-600 italic">"{currentCard.definition}"</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Reconstruct the example sentence:
          </label>
          
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={!!result}
            placeholder="Type the sentence using the keyword..."
            className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 min-h-[100px] text-lg resize-none"
          />

          {!result ? (
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Check Answer
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Result Section */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">Analysis Result</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      result.score === 100 ? 'bg-green-100 text-green-700' : 
                      result.score > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      Match Score: {result.score}%
                    </span>
                 </div>

                 {/* Visual Diff Feedback */}
                 <div className="mb-4 text-lg leading-relaxed break-words">
                    {result.feedback.map((item, idx) => {
                      if (item.status === 'correct') {
                        return <span key={idx} className="text-green-600 inline-block mr-1">{item.word}</span>;
                      }
                      if (item.status === 'missing') {
                        return <span key={idx} className="bg-red-100 text-red-600 line-through decoration-red-400 px-1 rounded inline-block mr-1" title="Missing word">[{item.word}]</span>;
                      }
                      if (item.status === 'extra') {
                        return <span key={idx} className="bg-yellow-100 text-yellow-700 px-1 rounded inline-block mr-1" title="Extra word">{item.word}</span>;
                      }
                      return (
                        <span key={idx} className="relative inline-block mr-1 group">
                          <span className="text-red-600 underline decoration-wavy decoration-red-400 cursor-help">{item.word}</span>
                          {item.expected && (
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none transition-opacity">
                              Expected: {item.expected}
                            </span>
                          )}
                        </span>
                      );
                    })}
                 </div>

                 {/* General Grammar/Spelling Errors */}
                 {result.generalErrors.length > 0 && (
                   <div className="mt-4 p-3 bg-orange-50 border-l-4 border-orange-400 text-orange-800 text-sm">
                     <div className="flex items-center gap-2 font-bold mb-1">
                       <AlertTriangle className="w-4 h-4" />
                       <span>Potential Issues:</span>
                     </div>
                     <ul className="list-disc pl-5 space-y-1">
                       {result.generalErrors.map((err, i) => (
                         <li key={i}>{err}</li>
                       ))}
                     </ul>
                   </div>
                 )}
                 
                 <div className="mt-6 pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">Target Sentence:</p>
                    <p className="text-slate-700">{currentCard.exampleSentence}</p>
                 </div>
              </div>

              <button
                onClick={nextCard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
              >
                <span>Next Card</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};