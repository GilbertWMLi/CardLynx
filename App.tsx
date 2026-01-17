import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, ArrowLeft, Brain, Layers, Edit2, Globe, LogOut, StickyNote, Volume2 } from 'lucide-react';
import { Flashcard, AppView, Language, Proficiency, User } from './types';
import { CardForm } from './components/CardForm';
import { QuizMode } from './components/QuizMode';
import { ReviewMode } from './components/ReviewMode';
import { AuthForm } from './components/AuthForm';
import { RubyText } from './components/RubyText';
import { StorageService } from './utils/storage';
import { api } from './utils/api';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<AppView>(AppView.AUTH);
  const [lang, setLang] = useState<Language>('EN');
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);

  // 1. Check for Session on mount
  useEffect(() => {
    StorageService.getCurrentUser().then(currentUser => {
      if (currentUser) {
        setUser(currentUser);
        setView(AppView.HOME);
        loadCards(currentUser.id);
      } else {
        setView(AppView.AUTH);
      }
    });
  }, []);

  const loadCards = async (userId: string) => {
    const data = await api.getCards(userId);
    setCards(data);
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setView(AppView.HOME);
    loadCards(loggedInUser.id);
  };

  const handleLogout = () => {
    StorageService.logout();
    setUser(null);
    setCards([]);
    setView(AppView.AUTH);
  };

  const filteredCards = cards.filter(c => c.language === lang);

  const handleSaveCard = async (cardData: Flashcard) => {
    if (!user) return;
    
    await api.saveCard(user.id, cardData);
    await loadCards(user.id); // Refresh list
    
    setView(AppView.DECK);
    setSelectedCard(null);
  };

  const handleDeleteCard = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;

    if (confirm('Delete this card permanently?')) {
      await api.deleteCard(user.id, id);
      await loadCards(user.id); // Refresh list
      
      if (selectedCard?.id === id) {
        setSelectedCard(null);
        setView(AppView.DECK);
      }
    }
  };

  const handleUpdateProficiency = async (id: string, level: Proficiency) => {
    if (!user) return;
    
    const cardToUpdate = cards.find(c => c.id === id);
    if (cardToUpdate) {
      const updatedCard = { 
        ...cardToUpdate, 
        proficiency: level, 
        lastReviewed: Date.now() 
      };
      // Optimistic update
      setCards(prev => prev.map(c => c.id === id ? updatedCard : c));
      // Save to server
      await api.saveCard(user.id, updatedCard);
    }
  };

  const handlePlayAudio = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const audio = new Audio(url);
    audio.play().catch(err => console.error("Play error:", err));
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

  // 0. Auth View
  if (!user || view === AppView.AUTH) {
    return <AuthForm onLogin={handleLogin} />;
  }

  // 1. Home / Language Selection
  if (view === AppView.HOME) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="text-sm font-medium text-slate-500">Hi, {user.username}</span>
          <button 
            onClick={handleLogout} 
            className="p-2 bg-white text-slate-600 hover:text-red-600 rounded-full shadow-sm border border-slate-200 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl mb-6">L</div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">LexiDeck <span className="text-brand-600">Filesystem</span></h1>
          <p className="text-slate-500">Data stored in: ./Userdata</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          <button 
            onClick={() => { setLang('EN'); setView(AppView.DECK); }}
            className="group relative bg-white p-8 rounded-2xl shadow-xl border-2 border-transparent hover:border-blue-500 transition-all flex flex-col items-center hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">En</div>
            <h2 className="text-2xl font-bold text-slate-800">English</h2>
            <p className="text-slate-400 mt-2">Cambridge Dictionary Support</p>
          </button>

          <button 
            onClick={() => { setLang('JP'); setView(AppView.DECK); }}
            className="group relative bg-white p-8 rounded-2xl shadow-xl border-2 border-transparent hover:border-rose-500 transition-all flex flex-col items-center hover:-translate-y-1"
          >
             <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4 text-2xl font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">あ</div>
            <h2 className="text-2xl font-bold text-slate-800">Japanese</h2>
            <p className="text-slate-400 mt-2">Weblio Dictionary Support</p>
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
          userId={user.id}
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
            <ArrowLeft className="w-5 h-5" /> Back to Deck
          </button>
          
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
            {/* Header */}
            <div className={`p-8 ${lang === 'EN' ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-rose-600 to-rose-800'} text-white`}>
               <div className="flex justify-between items-start">
                  <div>
                    {/* Render Term with Audio Button */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-5xl font-black leading-tight">
                         <RubyText text={selectedCard.term} />
                      </div>
                      {selectedCard.audioUrl && (
                         <button 
                           onClick={(e) => handlePlayAudio(e, selectedCard.audioUrl!)}
                           className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm text-white transition-colors"
                           title="Play Audio"
                         >
                           <Volume2 className="w-6 h-6" />
                         </button>
                      )}
                    </div>
                    {selectedCard.reading && <p className="text-2xl font-serif opacity-80">{selectedCard.reading}</p>}
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
                    {/* Definitions */}
                    <div className="space-y-1">
                      {block.defEN && <h3 className="text-xl font-bold text-slate-800 leading-snug">{block.defEN}</h3>}
                      {block.defCN && <p className="text-md text-slate-500 font-medium">{block.defCN}</p>}
                    </div>
                    
                    {/* Synonyms / Antonyms Display */}
                    {(block.synonyms || block.antonyms) && (
                      <div className="flex gap-4 text-sm mt-1">
                          {block.synonyms && (
                            <div className="bg-green-50 px-2 py-1 rounded border border-green-100">
                              <span className="font-bold text-green-700 mr-1">Synonyms:</span>
                              <span className="text-green-800">{block.synonyms}</span>
                            </div>
                          )}
                          {block.antonyms && (
                            <div className="bg-red-50 px-2 py-1 rounded border border-red-100">
                              <span className="font-bold text-red-700 mr-1">Antonyms:</span>
                              <span className="text-red-800">{block.antonyms}</span>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Sentences */}
                    {(block.sentenceEN || block.sentenceCN) && (
                       <div className="bg-slate-50 border-l-4 border-slate-300 p-4 rounded-r-lg space-y-2">
                         {block.sentenceEN && (
                           <div className="text-slate-800 font-medium text-lg leading-loose">
                              <RubyText text={block.sentenceEN} />
                           </div>
                         )}
                         {block.sentenceCN && <p className="text-slate-500 text-sm">{block.sentenceCN}</p>}
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

              {/* Note Display */}
              {selectedCard.note && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 relative">
                     <div className="absolute top-4 left-4 text-yellow-500">
                       <StickyNote className="w-5 h-5" />
                     </div>
                     <div className="pl-8">
                       <h4 className="text-xs font-bold text-yellow-700 uppercase mb-2">My Note</h4>
                       <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{selectedCard.note}</p>
                     </div>
                  </div>
                </div>
              )}

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
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <button onClick={() => setView(AppView.REVIEW)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                <Layers className="w-4 h-4" /> Flashcards
              </button>
              <button onClick={() => setView(AppView.QUIZ)} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
                <Brain className="w-4 h-4" /> Quiz
              </button>
              <button onClick={() => { setSelectedCard(null); setView(AppView.ADD); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            
            <button 
              onClick={handleLogout} 
              className="p-2 ml-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
         {filteredCards.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
             <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
             <h3 className="text-lg font-semibold text-slate-500">No cards in this deck</h3>
             <button onClick={() => setView(AppView.ADD)} className="mt-4 text-brand-600 font-bold hover:underline">Create your first card</button>
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
                   <div className="flex-1 pr-2">
                     <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-2xl font-bold text-slate-800">
                          {/* Use RubyText so [brackets] don't show in list view */}
                          <RubyText text={card.term} showFurigana={true} />
                        </h3>
                        {card.audioUrl && (
                          <button 
                            onClick={(e) => handlePlayAudio(e, card.audioUrl!)}
                            className="p-1.5 text-brand-500 bg-brand-50 hover:bg-brand-100 rounded-full transition-colors"
                            title="Play Audio"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                     </div>
                     {card.reading && <p className="text-sm text-slate-500">{card.reading}</p>}
                   </div>
                   {/* Proficiency Badge */}
                   <div className={`w-3 h-3 rounded-full shrink-0 ${
                     card.proficiency === 'mastered' ? 'bg-green-500' : 
                     card.proficiency === 'hazy' ? 'bg-yellow-400' : 
                     card.proficiency === 'forgot' ? 'bg-red-500' : 'bg-slate-300'
                   }`} />
                 </div>
                 
                 <div className="space-y-2">
                   {card.blocks.slice(0, 2).map((b, i) => (
                     <div key={i} className="text-sm text-slate-600 line-clamp-1 flex gap-2">
                       <span className="font-bold text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{b.pos}</span>
                       <span title={b.defCN || b.defEN}>{b.defEN || b.defCN}</span>
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