import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, ArrowLeft, Brain, Layers, Edit2, GraduationCap, Globe } from 'lucide-react';
import { Flashcard, AppView, Language, Proficiency } from './types';
import { CardForm } from './components/CardForm';
import { QuizMode } from './components/QuizMode';
import { ReviewMode } from './components/ReviewMode';

function App() {
  const [view, setView] = useState<AppView>(AppView.HOME);
  const [lang, setLang] = useState<Language>('EN');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  
  // Load & Migration Logic
  useEffect(() => {
    const saved = localStorage.getItem('lexideck-data-v2');
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cards", e);
      }
    } else {
      // Check for V1 data and simple migrate (warning: this is destructive if structure is too different, assuming clean slate for V2 per request)
      const old = localStorage.getItem('lexideck-cards');
      if (old) {
        // Here we could migrate, but for simplicity in this major refactor, we start fresh or user manual migrate.
        // Let's just ignore V1 for now to prevent crashes.
      }
    }
  }, []);

  // Save
  useEffect(() => {
    localStorage.setItem('lexideck-data-v2', JSON.stringify(cards));
  }, [cards]);

  const filteredCards = cards.filter(c => c.language === lang);

  const handleSaveCard = (newCard: Flashcard) => {
    setCards(prev => {
      const exists = prev.findIndex(c => c.id === newCard.id);
      if (exists >= 0) {
        const updated = [...prev];
        updated[exists] = newCard;
        return updated;
      }
      return [newCard, ...prev];
    });
    setView(AppView.DECK);
    setSelectedCard(null);
  };

  const handleDeleteCard = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('Delete this card permanently?')) {
      setCards(prev => prev.filter(c => c.id !== id));
      if (selectedCard?.id === id) {
        setSelectedCard(null);
        setView(AppView.DECK);
      }
    }
  };

  const handleUpdateProficiency = (id: string, level: Proficiency) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, proficiency: level, lastReviewed: Date.now() } : c));
  };

  const getProficiencyColor = (p: Proficiency) => {
    switch (p) {
      case 'mastered': return 'border-green-400 bg-green-50';
      case 'hazy': return 'border-yellow-400 bg-yellow-50';
      case 'forgot': return 'border-red-400 bg-red-50';
      default: return 'border-slate-200 bg-white';
    }
  };

  // --- Views ---

  // 1. Home / Language Selection
  if (view === AppView.HOME) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6">L</div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">CardLynx</h1>
          <p className="text-slate-500">~~尚在開發中~~</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button 
            onClick={() => { setLang('EN'); setView(AppView.DECK); }}
            className="group relative bg-white p-8 rounded-2xl shadow-xl border-2 border-transparent hover:border-blue-500 transition-all flex flex-col items-center hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">En</div>
            <h2 className="text-2xl font-bold text-slate-800">English</h2>
            <p className="text-slate-400 mt-2">劍橋詞典</p>
          </button>

          <button 
            onClick={() => { setLang('JP'); setView(AppView.DECK); }}
            className="group relative bg-white p-8 rounded-2xl shadow-xl border-2 border-transparent hover:border-rose-500 transition-all flex flex-col items-center hover:-translate-y-1"
          >
             <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">あ</div>
            <h2 className="text-2xl font-bold text-slate-800">Japanese</h2>
            <p className="text-slate-400 mt-2">Weblio 日語詞典</p>
          </button>
        </div>
      </div>
    );
  }

  // 2. Add / Edit Form
  if (view === AppView.ADD) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <CardForm 
          language={lang} 
          onSave={handleSaveCard} 
          onCancel={() => { setSelectedCard(null); setView(AppView.DECK); }}
          initialData={selectedCard || undefined}
        />
      </div>
    );
  }

  // 3. Quiz Mode
  if (view === AppView.QUIZ) {
    return (
      <div className="min-h-screen bg-slate-100">
        <QuizMode cards={filteredCards} onExit={() => setView(AppView.DECK)} />
      </div>
    );
  }

  // 4. Review Mode (Flashcards)
  if (view === AppView.REVIEW) {
    return (
      <div className="min-h-screen bg-slate-100">
        <ReviewMode 
          cards={filteredCards} 
          onUpdateProficiency={handleUpdateProficiency}
          onExit={() => setView(AppView.DECK)} 
        />
      </div>
    );
  }

  // 5. Card Details
  if (view === AppView.DETAIL && selectedCard) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => { setSelectedCard(null); setView(AppView.DECK); }} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium">
            <ArrowLeft className="w-5 h-5" /> 回到字卡
          </button>
          
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className={`p-8 ${lang === 'EN' ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-rose-600 to-rose-800'} text-white`}>
               <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-5xl font-black mb-2">{selectedCard.term}</h1>
                    {selectedCard.reading && <p className="text-2xl font-serif opacity-90">{selectedCard.reading}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setView(AppView.ADD)} className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition-colors">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDeleteCard(selectedCard.id)} className="p-2 bg-white/20 hover:bg-red-500 rounded-full backdrop-blur-sm transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
               </div>
            </div>

            {/* Content Blocks */}
            <div className="p-8 space-y-8">
              {selectedCard.blocks.map((block, idx) => (
                <div key={idx} className="flex gap-6 border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <div className="w-12 pt-1 flex flex-col items-center">
                    <span className="text-xs font-bold uppercase text-slate-400 bg-slate-100 px-2 py-1 rounded">{block.pos}</span>
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 leading-snug">{block.definition}</h3>
                    </div>
                    
                    {block.exampleSentence && (
                       <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-lg">
                         <p className="text-slate-700 italic font-serif text-lg">"{block.exampleSentence}"</p>
                       </div>
                    )}
                    
                    {block.imageUrl && (
                      <div className="mt-4">
                        <img src={block.imageUrl} alt="visual aid" className="max-h-64 rounded-xl shadow-md object-cover border border-slate-200" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Main Deck List
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setView(AppView.HOME)} className="flex items-center gap-2 text-slate-400 hover:text-brand-600 transition-colors">
               <Globe className="w-5 h-5" />
             </button>
             <h1 className="text-xl font-bold text-slate-800">
               {lang === 'EN' ? 'English Deck' : 'Japanese Deck'}
             </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView(AppView.REVIEW)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
              <Layers className="w-4 h-4" /> 單字卡
            </button>
            <button onClick={() => setView(AppView.QUIZ)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
              <Brain className="w-4 h-4" /> 測驗
            </button>
            <button onClick={() => { setSelectedCard(null); setView(AppView.ADD); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> 添加字卡
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
         {filteredCards.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
             <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg font-semibold text-slate-500">尚未有任何字卡</h3>
             <button onClick={() => setView(AppView.ADD)} className="mt-4 text-brand-600 font-bold hover:underline">開始建立字卡</button>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {filteredCards.map(card => (
               <div 
                 key={card.id} 
                 onClick={() => { setSelectedCard(card); setView(AppView.DETAIL); }}
                 className={`relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 group ${getProficiencyColor(card.proficiency)}`}
               >
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <h3 className="text-2xl font-bold text-slate-800">{card.term}</h3>
                     {card.reading && <p className="text-sm text-slate-500">{card.reading}</p>}
                   </div>
                   {/* Proficiency Badge */}
                   <div className={`w-3 h-3 rounded-full ${
                     card.proficiency === 'mastered' ? 'bg-green-500' : 
                     card.proficiency === 'hazy' ? 'bg-yellow-400' : 
                     card.proficiency === 'forgot' ? 'bg-red-500' : 'bg-slate-300'
                   }`} />
                 </div>
                 
                 <div className="space-y-2">
                   {card.blocks.slice(0, 2).map((b, i) => (
                     <div key={i} className="text-sm text-slate-600 line-clamp-1 flex gap-2">
                       <span className="font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{b.pos}</span>
                       <span>{b.definition}</span>
                     </div>
                   ))}
                   {card.blocks.length > 2 && <p className="text-xs text-slate-400 mt-2">+{card.blocks.length - 2} more definitions</p>}
                 </div>
               </div>
             ))}
           </div>
         )}
      </main>
    </div>
  );
}

export default App;