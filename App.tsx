import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, ExternalLink, GraduationCap, X } from 'lucide-react';
import { Flashcard, AppTab } from './types';
import { OCRUploader } from './components/OCRUploader';
import { QuizMode } from './components/QuizMode';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CARDS);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    exampleSentence: ''
  });

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lexideck-cards');
    if (saved) {
      try {
        setCards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cards", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('lexideck-cards', JSON.stringify(cards));
  }, [cards]);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      word: formData.word.trim(),
      definition: formData.definition.trim(),
      exampleSentence: formData.exampleSentence.trim(),
      createdAt: Date.now(),
      reviewCount: 0
    };
    
    setCards([newCard, ...cards]);
    setFormData({ word: '', definition: '', exampleSentence: '' });
    setIsModalOpen(false);
  };

  const deleteCard = (id: string) => {
    if (confirm('Are you sure you want to delete this card?')) {
      setCards(cards.filter(c => c.id !== id));
    }
  };

  const openCambridgeDictionary = (word: string) => {
    if (!word) return;
    const url = `https://dictionary.cambridge.org/dictionary/english-chinese-traditional/${encodeURIComponent(word)}`;
    window.open(url, '_blank');
  };

  const handleOcrText = (text: string) => {
    // If the text looks like a full sentence, put it in example.
    // Heuristic: length > 20 and has spaces.
    if (text.length > 20 && text.includes(' ')) {
      setFormData(prev => ({ ...prev, exampleSentence: text }));
    } else {
      // Otherwise might be the word or definition, let user decide, but default to example for now as per requirement
      setFormData(prev => ({ ...prev, exampleSentence: text }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">L</div>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-700 to-brand-500">
               單字卡 <span className="text-slate-400 font-normal text-sm">PC版</span>
             </h1>
          </div>
          
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab(AppTab.CARDS)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === AppTab.CARDS 
                  ? 'bg-white text-brand-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setActiveTab(AppTab.QUIZ)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === AppTab.QUIZ 
                  ? 'bg-white text-brand-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Quiz
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pt-6">
        
        {activeTab === AppTab.QUIZ ? (
          <QuizMode cards={cards} onExit={() => setActiveTab(AppTab.CARDS)} />
        ) : (
          <>
            {/* Stats / Hero */}
            <div className="mb-8 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">單字卡儲存庫</h2>
                <p className="text-brand-100">
                  現有 {cards.length} 張單字卡.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-brand-700 px-5 py-3 rounded-xl font-bold shadow-lg hover:bg-brand-50 transition-colors flex items-center gap-2 active:scale-95 transform"
              >
                <Plus className="w-5 h-5" />
                New Card
              </button>
            </div>

            {/* Cards Grid */}
            {cards.length === 0 ? (
               <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                 <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                 <h3 className="text-lg font-semibold text-slate-600">尚未有單字卡</h3>
                 <p className="text-slate-400 max-w-xs mx-auto mt-2">新增一個單字以開始。你也可以上傳照片，系統會自動掃描文字！</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map(card => (
                  <div key={card.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow group relative">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-slate-800">{card.word}</h3>
                      <button 
                         onClick={() => deleteCard(card.id)}
                         className="text-slate-300 hover:text-red-500 transition-colors p-1"
                         title="Delete card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-slate-600 mb-4 text-sm leading-relaxed border-l-2 border-brand-200 pl-3">
                      {card.definition}
                    </p>
                    
                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 italic font-serif">
                      "{card.exampleSentence}"
                    </div>

                    <div className="mt-4 flex gap-2">
                       <button
                         onClick={() => openCambridgeDictionary(card.word)}
                         className="text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                       >
                         <ExternalLink className="w-3 h-3" />
                         Cambridge Dict
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Add Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">添加新單字卡</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddCard} className="p-6 space-y-5">
              
              {/* Word Input & Dictionary Link */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">單字</label>
                <div className="flex gap-2">
                  <input
                    required
                    type="text"
                    value={formData.word}
                    onChange={e => setFormData({...formData, word: e.target.value})}
                    className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                    placeholder="e.g., Ephemeral"
                  />
                  {formData.word && (
                    <button
                      type="button"
                      onClick={() => openCambridgeDictionary(formData.word)}
                      className="px-3 bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-300 rounded-lg transition-colors flex items-center justify-center"
                      title="Look up in Cambridge Dictionary"
                    >
                      <BookOpen className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Definition */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">定義</label>
                <textarea
                  required
                  rows={2}
                  value={formData.definition}
                  onChange={e => setFormData({...formData, definition: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                  placeholder="Meaning of the word..."
                />
              </div>

              {/* Example Sentence with OCR */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">例句</label>
                
                {/* OCR Component */}
                <OCRUploader onTextExtracted={handleOcrText} />

                <textarea
                  required
                  rows={3}
                  value={formData.exampleSentence}
                  onChange={e => setFormData({...formData, exampleSentence: e.target.value})}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all resize-none"
                  placeholder="請輸入例句或上傳圖片…"
                />
                <p className="text-xs text-slate-500 mt-1">該例句將會用於練習測驗。</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all active:scale-95"
                >
                  儲存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;