import React, { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, X, BookOpen, UploadCloud, Loader2, StickyNote, Link2, Volume2 } from 'lucide-react';
import { Flashcard, Language, DefinitionBlock } from '../types';
import { OCRUploader } from './OCRUploader';
import { RubyInput } from './RubyInput';
import { api } from '../utils/api';

// Safe ID generator that works in non-secure contexts (HTTP)
const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if context is not secure
    }
  }
  // Fallback: Timestamp + Random String
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

interface CardFormProps {
  userId: string; // New required prop
  language: Language;
  onSave: (card: Flashcard) => void;
  onCancel: () => void;
  initialData?: Flashcard;
}

export const CardForm: React.FC<CardFormProps> = ({ userId, language, onSave, onCancel, initialData }) => {
  const [term, setTerm] = useState(initialData?.term || '');
  const [reading, setReading] = useState(initialData?.reading || '');
  const [audioUrl, setAudioUrl] = useState(initialData?.audioUrl || '');
  const [note, setNote] = useState(initialData?.note || '');
  
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  
  // Use migrator logic fallback for old data
  const [blocks, setBlocks] = useState<DefinitionBlock[]>(initialData?.blocks?.map((b:any) => ({
    ...b,
    defEN: b.defEN !== undefined ? b.defEN : (b.definition || ''),
    defCN: b.defCN || '',
    sentenceEN: b.sentenceEN !== undefined ? b.sentenceEN : (b.exampleSentence || ''),
    sentenceCN: b.sentenceCN || '',
    synonyms: b.synonyms || '',
    antonyms: b.antonyms || ''
  })) || [
    { id: generateId(), pos: 'noun', defEN: '', defCN: '', sentenceEN: '', sentenceCN: '', synonyms: '', antonyms: '' }
  ]);
  
  const handleAddBlock = () => {
    setBlocks([...blocks, { id: generateId(), pos: 'noun', defEN: '', defCN: '', sentenceEN: '', sentenceCN: '', synonyms: '', antonyms: '' }]);
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length > 1) {
      setBlocks(blocks.filter(b => b.id !== id));
    }
  };

  const updateBlock = (id: string, field: keyof DefinitionBlock, value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleImageUpload = async (blockId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingBlockId(blockId);
      
      try {
        const imageUrl = await api.uploadImage(userId, file);
        updateBlock(blockId, 'imageUrl', imageUrl);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload image. Please check server connection.");
      } finally {
        setUploadingBlockId(null);
      }
    }
  };

  const handleGenerateAudio = async () => {
    console.log("DEBUG: Generate Audio Button Clicked");
    
    if (!userId) {
        alert("Error: User ID is missing. Please try logging in again.");
        return;
    }
    if (!term) {
        alert("Error: Please enter a term first.");
        return;
    }
    
    setIsGeneratingAudio(true);
    try {
      console.log("DEBUG: Calling api.generateAudio with User:", userId, "Term:", term, "Lang:", language);
      const url = await api.generateAudio(userId, term, language);
      console.log("DEBUG: Audio URL received:", url);
      setAudioUrl(url);
    } catch (error: any) {
      console.error("Audio generation failed", error);
      // Display the specific message from backend if available
      alert(`Failed to generate audio:\n${error.message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCard: Flashcard = {
      id: initialData?.id || generateId(),
      language,
      term,
      reading: language === 'JP' ? reading : undefined,
      audioUrl: audioUrl || undefined,
      blocks,
      note,
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
          {initialData ? 'Edit Card' : `Add ${language === 'EN' ? 'English' : 'Japanese'} Card`}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="overflow-y-auto p-6 space-y-6 flex-1">
        <div className="grid grid-cols-1 gap-4">
          {/* Main Term Row */}
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              {/* Term Input: Uses RubyInput for Japanese, Text for English */}
              {language === 'JP' ? (
                <RubyInput 
                  label="Term (Kanji)"
                  value={term}
                  onChange={setTerm}
                  placeholder="e.g. 猫, or 図書館"
                  enableAutoDetect={true}
                />
              ) : (
                <>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Word</label>
                  <input
                    value={term}
                    onChange={e => setTerm(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    placeholder="e.g. Ephemeral"
                    required
                  />
                </>
              )}
              
              <div className="mt-2 flex justify-end gap-3 items-center">
                 {/* Audio Generation Button for EN and JP */}
                 <div className="flex items-center gap-2">
                   {audioUrl && (
                     <audio controls src={audioUrl} className="h-8 w-40" />
                   )}
                   
                   <button 
                      type="button" 
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio || !term}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                        isGeneratingAudio ? 'bg-slate-100 text-slate-400' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                      }`}
                      title={`Generate Audio via ${language === 'EN' ? 'Cambridge' : 'OJAD'}`}
                   >
                      {isGeneratingAudio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                      {isGeneratingAudio ? 'Generating...' : (audioUrl ? 'Regenerate Audio' : 'Generate Audio')}
                   </button>
                 </div>

                {term && (
                  <button 
                    type="button" 
                    onClick={openDictionary} 
                    className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <BookOpen className="w-3 h-3" /> Check Dictionary
                  </button>
                )}
              </div>
            </div>

            {language === 'JP' && (
              <div className="w-1/3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Main Reading</label>
                <input
                  value={reading}
                  onChange={e => setReading(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                  placeholder="e.g. ねこ"
                />
                <p className="text-[10px] text-slate-400 mt-1">Reading for the whole word</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Definitions</h3>
              <button onClick={handleAddBlock} className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add Section
              </button>
            </div>

            {blocks.map((block) => (
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
                <div className="mb-6">
                   <label className="block text-xs font-semibold text-slate-500 mb-1">Part of Speech</label>
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
                        <label className="block text-xs font-semibold text-slate-500 mb-1">English Definition</label>
                        <input
                          value={block.defEN}
                          onChange={e => updateBlock(block.id, 'defEN', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                          placeholder="Meaning in English..."
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Chinese Definition (解釋)</label>
                        <input
                          value={block.defCN}
                          onChange={e => updateBlock(block.id, 'defCN', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                          placeholder="中文解釋..."
                        />
                      </div>
                   </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4"></div>

                {/* Row 2: Synonyms & Antonyms */}
                <div className="mb-6">
                   <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                      <Link2 className="w-3 h-3" /> Related Words
                   </label>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <input
                          value={block.synonyms}
                          onChange={e => updateBlock(block.id, 'synonyms', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                          placeholder="Synonyms (e.g. happy, glad)..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Similar meaning (近義詞)</p>
                      </div>
                      <div>
                        <input
                          value={block.antonyms}
                          onChange={e => updateBlock(block.id, 'antonyms', e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-brand-500 outline-none text-sm"
                          placeholder="Antonyms (e.g. sad, upset)..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Opposite meaning (反義詞)</p>
                      </div>
                   </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4"></div>

                {/* Row 3: Examples with OCR */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
                      <BookOpen className="w-3 h-3" /> 
                      Example Sentences
                    </label>
                    <div className="scale-90 origin-right">
                       <OCRUploader onTextExtracted={(text) => updateBlock(block.id, 'sentenceEN', text)} />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                        {/* Sentence Input: Uses RubyInput for Japanese, Textarea for English */}
                        {language === 'JP' ? (
                           <RubyInput
                             value={block.sentenceEN}
                             onChange={val => updateBlock(block.id, 'sentenceEN', val)}
                             placeholder="Type sentence..."
                             enableAutoDetect={true}
                           />
                        ) : (
                          <textarea
                              value={block.sentenceEN}
                              onChange={e => updateBlock(block.id, 'sentenceEN', e.target.value)}
                              className="w-full p-3 border border-slate-300 rounded-md text-sm h-20 resize-none focus:ring-1 focus:ring-brand-500 outline-none"
                              placeholder="Type English sentence here..."
                          />
                        )}
                    </div>
                    <div>
                        <input
                            value={block.sentenceCN}
                            onChange={e => updateBlock(block.id, 'sentenceCN', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-1 focus:ring-brand-500 outline-none"
                            placeholder="Translate example to Chinese (Optional)..."
                        />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4"></div>

                {/* Row 4: Visual Memory Aid (Image Upload) */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                    <ImageIcon className="w-3 h-3" />
                    Visual Memory Aid
                  </label>
                  
                  <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200 border-dashed">
                    {block.imageUrl ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-slate-300 group-image shadow-sm">
                        <img src={block.imageUrl} alt="Visual aid" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => updateBlock(block.id, 'imageUrl', '')}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-[10px] text-center px-2">No image selected</span>
                      </div>
                    )}

                    <div className="flex-1">
                      <p className="text-sm text-slate-600 mb-3">
                        Upload a photo or illustration to help you associate an image with this word.
                      </p>
                      
                      <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border shadow-sm text-sm font-medium transition-all cursor-pointer
                        ${uploadingBlockId === block.id 
                           ? 'bg-slate-100 text-slate-400 border-slate-200' 
                           : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-brand-400 hover:text-brand-600'
                        }`}>
                        
                        {uploadingBlockId === block.id ? (
                           <>
                             <Loader2 className="w-4 h-4 animate-spin" />
                             Uploading...
                           </>
                        ) : (
                           <>
                             <UploadCloud className="w-4 h-4" />
                             Choose Image
                           </>
                        )}
                        
                        <input 
                           type="file" 
                           className="hidden" 
                           accept="image/*" 
                           disabled={uploadingBlockId === block.id}
                           onChange={(e) => handleImageUpload(block.id, e)} 
                        />
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {/* Notes Section */}
          <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200">
            <label className="flex items-center gap-2 text-xs font-bold text-yellow-700 uppercase tracking-wide mb-2">
              <StickyNote className="w-4 h-4" /> 
              Study Notes (Memo)
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full p-3 bg-white border border-yellow-300 rounded-lg text-sm h-24 resize-none focus:ring-1 focus:ring-yellow-500 outline-none"
              placeholder="Add your own mnemonics, grammar notes, or custom tags here..."
            />
          </div>

        </div>
      </div>

      <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
        <button type="button" onClick={onCancel} className="flex-1 py-3 px-4 border border-slate-300 rounded-xl hover:bg-white text-slate-700 font-semibold transition-colors">Cancel</button>
        <button type="button" onClick={handleSubmit} className="flex-1 py-3 px-4 bg-brand-600 text-white rounded-xl hover:bg-brand-700 font-semibold shadow-lg shadow-brand-200 transition-all">Save Card</button>
      </div>
    </div>
  );
};