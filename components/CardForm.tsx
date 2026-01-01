import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, X, BookOpen } from 'lucide-react';
import { Flashcard, Language, DefinitionBlock } from '../types';
import { OCRUploader } from './OCRUploader';

interface CardFormProps {
  language: Language;
  onSave: (card: Flashcard) => void;
  onCancel: () => void;
  initialData?: Flashcard;
}

export const CardForm: React.FC<CardFormProps> = ({ language, onSave, onCancel, initialData }) => {
  const [term, setTerm] = useState(initialData?.term || '');
  const [reading, setReading] = useState(initialData?.reading || '');
  
  // Use migrator logic fallback for old data
  const [blocks, setBlocks] = useState<DefinitionBlock[]>(initialData?.blocks?.map((b:any) => ({
    ...b,
    defEN: b.defEN !== undefined ? b.defEN : (b.definition || ''),
    defCN: b.defCN || '',
    sentenceEN: b.sentenceEN !== undefined ? b.sentenceEN : (b.exampleSentence || ''),
    sentenceCN: b.sentenceCN || '',
  })) || [
    { id: crypto.randomUUID(), pos: 'noun', defEN: '', defCN: '', sentenceEN: '', sentenceCN: '' }
  ]);
  
  const handleAddBlock = () => {
    setBlocks([...blocks, { id: crypto.randomUUID(), pos: 'noun', defEN: '', defCN: '', sentenceEN: '', sentenceCN: '' }]);
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  const updateBlock = (id: string, field: keyof DefinitionBlock, value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBlock(id, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: Flashcard = {
      id: initialData?.id || crypto.randomUUID(),
      language,
      term,
      reading: language === 'JP' ? reading : undefined,
      blocks,
      createdAt: initialData?.createdAt || Date.now(),
      proficiency: initialData?.proficiency || 'new',
      lastReviewed: initialData?.lastReviewed
    };
    onSave(newCard);
  };

  const dictionaryUrl = language === 'EN' 
    ? `https://dictionary.cambridge.org/dictionary/english-chinese-traditional/${encodeURIComponent(term)}`
    : `https://www.weblio.jp/content/${encodeURIComponent(term)}`;

  const openDictionary = () => {
    window.open(dictionaryUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800">
          {initialData ? 'Edit Card' : `添加 ${language === 'EN' ? '英文' : '日文'} 字卡`}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="overflow-y-auto p-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {language === 'EN' ? '單字' : 'Term (Kanji/Kana)'}
              </label>
              <div className="flex gap-2">
                <input
                  value={term}
                  onChange={e => setTerm(e.target.value)}
                  className="flex-1 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder={language === 'EN' ? "e.g. Ephemeral" : "e.g. 猫"}
                  required
                />
                {term && (
                  <button 
                    type="button" 
                    onClick={openDictionary} 
                    className="p-3 bg-slate-100 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="Open Dictionary in new tab"
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            {language === 'JP' && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Reading (Furigana)</label>
                <input
                  value={reading}
                  onChange={e => setReading(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g. ねこ"
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">定義</h3>
              <button onClick={handleAddBlock} className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> 增加區塊
              </button>
            </div>

            {blocks.map((block, index) => (
              <div key={block.id} className="bg-slate-50 p-5 rounded-xl border border-slate-200 relative group">
                {blocks.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveBlock(block.id)}
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                
                {/* Row 1: POS and Definitions */}
                <div className="mb-4">
                   <label className="block text-xs font-semibold text-slate-500 mb-1">詞性</label>
                   <select 
                     value={block.pos}
                     onChange={e => updateBlock(block.id, 'pos', e.target.value)}
                     className="w-full md:w-1/3 p-2 border border-slate-300 rounded-md bg-white text-sm mb-3"
                   >
                     <option value="noun">Noun (名詞)</option>
                     <option value="verb">Verb (動詞)</option>
                     <option value="adj">Adjective (形容詞)</option>
                     <option value="adv">Adverb (副詞)</option>
                     <option value="phrase">Phrase (片語)</option>
                     <option value="other">Other</option>
                   </select>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">英文解釋</label>
                        <input
                          value={block.defEN}
                          onChange={e => updateBlock(block.id, 'defEN', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                          placeholder="Meaning in English..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">中文解釋</label>
                        <input
                          value={block.defCN}
                          onChange={e => updateBlock(block.id, 'defCN', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                          placeholder="中文解釋..."
                        />
                      </div>
                   </div>
                </div>

                {/* Row 2: Examples */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-500">例句</label>
                    <div className="scale-75 origin-right"><OCRUploader onTextExtracted={(text) => updateBlock(block.id, 'sentenceEN', text)} /></div>
                  </div>
                  <textarea
                    value={block.sentenceEN}
                    onChange={e => updateBlock(block.id, 'sentenceEN', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm h-16 resize-none mb-2"
                    placeholder="Example sentence..."
                  />
                  
                  <label className="block text-xs font-semibold text-slate-500 mb-1">例句翻譯</label>
                  <input
                    value={block.sentenceCN}
                    onChange={e => updateBlock(block.id, 'sentenceCN', e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm"
                    placeholder="例句的中文翻譯..."
                  />
                </div>

                {/* Row 3: Image */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">圖片</label>
                  <div className="flex items-center gap-4">
                    {block.imageUrl ? (
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-300 group-image">
                        <img src={block.imageUrl} alt="Visual aid" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => updateBlock(block.id, 'imageUrl', '')}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">No Image</span>
                      </div>
                    )}
                    <label className="cursor-pointer bg-white border border-slate-300 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors">
                      上傳
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(block.id, e)} />
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
        <button type="button" onClick={onCancel} className="flex-1 py-3 px-4 border border-slate-300 rounded-xl hover:bg-white text-slate-700 font-semibold transition-colors">取消</button>
        <button type="button" onClick={handleSubmit} className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold shadow-lg shadow-brand-200 transition-all">儲存</button>
      </div>
    </div>
  );
};