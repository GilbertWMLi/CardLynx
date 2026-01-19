import React, { useState, useEffect } from 'react';
import { Flashcard, ComparisonResult, DefinitionBlock } from '../types';
import { analyzeSentence } from '../utils/analysis';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { RubyText } from './RubyText';

interface QuizModeProps {
  cards: Flashcard[];
  onExit: () => void;
}

interface QuizItem {
  card: Flashcard;
  targetBlock: DefinitionBlock;
}

export const QuizMode: React.FC<QuizModeProps> = ({ cards, onExit }) => {
  const [queue, setQueue] = useState<QuizItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    // Generate quiz items: find cards with EN sentences
    const items: QuizItem[] = [];
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    
    shuffled.forEach(card => {
      // Compatibility check: look for sentenceEN or fallback to exampleSentence if migrated poorly
      const blocksWithExamples = card.blocks.filter(b => (b.sentenceEN && b.sentenceEN.length > 5));
      if (blocksWithExamples.length > 0) {
        // Pick random block
        const randomBlock = blocksWithExamples[Math.floor(Math.random() * blocksWithExamples.length)];
        items.push({ card, targetBlock: randomBlock });
      }
    });

    setQueue(items);
  }, [cards]);

  if (queue.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">沒有包含例句的卡片可用於造句練習。</p>
        <button onClick={onExit} className="text-brand-600 hover:underline">回到卡組列表</button>
      </div>
    );
  }

  const currentItem = queue[currentIdx];

  const checkAnswer = () => {
    // analyzeSentence now handles stripping [brackets] automatically
    const analysis = analyzeSentence(userInput, currentItem.targetBlock.sentenceEN);
    setResult(analysis);
  };

  const nextCard = () => {
    setResult(null);
    setUserInput('');
    if (currentIdx < queue.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      alert("Sentence Quiz Complete!");
      onExit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">造句練習</h2>
        <div className="flex items-center gap-4">
           <span className="text-sm font-medium text-slate-500">
             {currentIdx + 1} / {queue.length}
           </span>
           <button onClick={onExit} className="text-slate-400 hover:text-slate-600"><ArrowLeft className="w-5 h-5"/></button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-8">
        <div className="mb-8 text-center">
          <p className="text-sm text-slate-400 uppercase tracking-wider font-bold mb-2">目標詞彙</p>
          <div className="text-4xl font-extrabold text-brand-600 mb-2">
             <RubyText text={currentItem.card.term} />
          </div>
          {currentItem.card.reading && !currentItem.card.term.includes('[') && (
            <p className="text-xl text-slate-500 mb-2">{currentItem.card.reading}</p>
          )}
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 mb-2">
            {currentItem.targetBlock.pos}
          </div>
          
          {/* Hint Section: Use Chinese definition/sentence if available, else English def */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100 inline-block max-w-lg">
             {currentItem.targetBlock.sentenceCN ? (
               <p className="text-lg text-slate-800 font-medium">"{currentItem.targetBlock.sentenceCN}"</p>
             ) : (
               <div className="text-lg text-slate-600 italic">
                  {/* If no Chinese hint, show English/Japanese hint with Ruby support */}
                  "<RubyText text={currentItem.targetBlock.defCN || currentItem.targetBlock.defEN} />"
               </div>
             )}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            將句子翻譯/重構為 {currentItem.card.language === 'JP' ? '日文' : '英文'}:
          </label>
          
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={!!result}
            placeholder="輸入句子..."
            className="w-full p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-brand-500 min-h-[100px] text-lg resize-none"
          />

          {!result ? (
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
            >
              <Check className="w-5 h-5" />
              查看答案
            </button>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Result Section */}
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">分析結果</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      result.score === 100 ? 'bg-green-100 text-green-700' : 
                      result.score > 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      匹配度: {result.score}%
                    </span>
                 </div>

                 <div className="mb-4 text-lg leading-relaxed break-words">
                    {result.feedback.map((item, idx) => (
                      <span key={idx} className={`mr-1 inline-block ${
                        item.status === 'correct' ? 'text-green-600' : 
                        item.status === 'missing' ? 'text-red-600 bg-red-50 px-1 decoration-line-through' :
                        'text-orange-600 underline decoration-wavy'
                      }`}>
                        {item.status === 'missing' ? `[${item.word}]` : item.word}
                      </span>
                    ))}
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">正確句子:</p>
                    <div className="text-slate-700 font-medium">
                       <RubyText text={currentItem.targetBlock.sentenceEN} />
                    </div>
                 </div>
              </div>

              <button
                onClick={nextCard}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
              >
                <span>下一張字卡</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};