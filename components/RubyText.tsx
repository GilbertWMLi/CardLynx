import React from 'react';

interface RubyTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
}

export const RubyText: React.FC<RubyTextProps> = ({ text, className = "", showFurigana = true }) => {
  if (!text) return null;

  // This Regex matches strictly: "BaseText[Reading]" OR "SingleChar"
  const segments = [];
  const regex = /([^\s\[［]+)(?:\[|［)([^\]］]*)(?:\]|］)|([\s\S])/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
     if (match[1]) {
       // Matched Base[Reading] format
       // e.g. match[1] = "で勉", match[2] = "べん"
       const base = match[1];
       const reading = match[2];

       // HEURISTIC FIX: Detect if "Particle (Kana)" is sticking to "Kanji".
       // Same logic as RubyInput.tsx: Split if base ends in "Non-Kanji" + "Kanji"
       const stickyMatch = base.match(/^(.*[^\u4e00-\u9faf])([\u4e00-\u9faf]+)$/);

       if (stickyMatch) {
         // Split logic: Prefix (plain) + Kanji (ruby)
         const prefix = stickyMatch[1];
         const kanjiPart = stickyMatch[2];
         
         // 1. Render Prefix (Particle or previous word context)
         segments.push(<span key={`ruby-${match.index}-prefix`}>{prefix}</span>);
         
         // 2. Render Kanji with Reading
         if (showFurigana && reading) {
           segments.push(
             <ruby key={`ruby-${match.index}-kanji`} className="group mx-[1px]">
               {kanjiPart}
               <rt className="text-[0.55em] text-slate-500 opacity-80 select-none font-normal mb-[0.1em]">{reading}</rt>
             </ruby>
           );
         } else {
           segments.push(<span key={`ruby-${match.index}-kanji`}>{kanjiPart}</span>);
         }

       } else {
         // Normal Rendering (No sticky particle detected, or whole block is Kanji)
         if (showFurigana && reading) {
           segments.push(
             <ruby key={`ruby-${match.index}`} className="group mx-[1px]">
               {base}
               <rt className="text-[0.55em] text-slate-500 opacity-80 select-none font-normal mb-[0.1em]">{reading}</rt>
             </ruby>
           );
         } else {
           segments.push(<span key={`ruby-${match.index}`}>{base}</span>);
         }
       }

     } else if (match[3]) {
       // Matched single char (plain text)
       segments.push(<span key={`char-${match.index}`}>{match[3]}</span>);
     }
  }

  return (
    <span className={`inline-block align-baseline decoration-clone leading-relaxed ${className}`}>
      {segments}
    </span>
  );
};