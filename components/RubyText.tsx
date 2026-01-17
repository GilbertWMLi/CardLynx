import React from 'react';

interface RubyTextProps {
  text: string;
  className?: string;
  showFurigana?: boolean;
}

export const RubyText: React.FC<RubyTextProps> = ({ text, className = "", showFurigana = true }) => {
  if (!text) return null;

  const parts = [];
  let remainingText = text;
  let keyCounter = 0;

  // The strategy: Look for the CLOSING bracket first ']', then find the matching opening '[' before it.
  // This handles multiple brackets better than a global greedy regex in some browsers.
  
  while (remainingText.length > 0) {
    const closeBracketIndex = remainingText.indexOf(']');
    const fullWidthCloseIndex = remainingText.indexOf('］');
    
    // Find the nearest closing bracket
    let bestCloseIndex = -1;
    if (closeBracketIndex !== -1 && (fullWidthCloseIndex === -1 || closeBracketIndex < fullWidthCloseIndex)) {
      bestCloseIndex = closeBracketIndex;
    } else {
      bestCloseIndex = fullWidthCloseIndex;
    }

    // If no closing bracket, just render the rest as text
    if (bestCloseIndex === -1) {
      parts.push(<span key={`text-${keyCounter++}`}>{remainingText}</span>);
      break;
    }

    // Found a closing bracket at `bestCloseIndex`. Now look backwards for opening bracket.
    const segmentBeforeClose = remainingText.substring(0, bestCloseIndex);
    const openBracketIndex = segmentBeforeClose.lastIndexOf('[');
    const fullWidthOpenIndex = segmentBeforeClose.lastIndexOf('［');
    
    let bestOpenIndex = -1;
    if (openBracketIndex !== -1 && (fullWidthOpenIndex === -1 || openBracketIndex > fullWidthOpenIndex)) {
      bestOpenIndex = openBracketIndex;
    } else {
      bestOpenIndex = fullWidthOpenIndex;
    }

    if (bestOpenIndex === -1) {
      // Closing bracket exists but no opening bracket? Treat everything up to close bracket as text.
      parts.push(<span key={`text-${keyCounter++}`}>{remainingText.substring(0, bestCloseIndex + 1)}</span>);
      remainingText = remainingText.substring(bestCloseIndex + 1);
      continue;
    }

    // We have a pair: [bestOpenIndex] ... [bestCloseIndex]
    
    // 1. Text BEFORE the open bracket
    if (bestOpenIndex > 0) {
      parts.push(<span key={`text-${keyCounter++}`}>{remainingText.substring(0, bestOpenIndex)}</span>);
    }

    // 2. The Ruby Base
    // We assume the "Base" is the text immediately preceding the bracket, up to a space or the start of the previous segment.
    // However, RubyInput format is tightly coupled. Ideally, we want to capture the Kanji just before.
    // Heuristic: Capture non-whitespace characters preceding the bracket.
    // But since we are iterating, we've already pushed the "Text Before".
    // Wait, the logic above pushes ALL text before. We need to split that "Text Before" into "Plain Text" and "Ruby Base".
    
    // Correction:
    // This logic is tricky. Let's rely on the Split pattern used in RubyInput parsing:
    // Regex: /([^\s\[]+)(?:\[([^\]]*)\])/g
    // But we need to parse it for display.
    
    // Let's reboot the parsing loop to match RubyInput's structure exactly.
    break; // Break the manual loop to use the Regex below which matches RubyInput.
  }

  // --- REBOOTED PARSING ---
  // This Regex matches strictly: "BaseText[Reading]"
  // It captures:
  // 1. Anything that isn't a bracket or space (Base)
  // 2. The content inside brackets (Reading)
  // 3. Any single character that didn't match the above (fallback)
  
  const segments = [];
  const regex = /([^\s\[［]+)(?:\[|［)([^\]］]*)(?:\]|］)|([\s\S])/g;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
     if (match[1]) {
       // Matched Base[Reading]
       const base = match[1];
       const reading = match[2];
       if (showFurigana && reading) {
         segments.push(
           <span key={`ruby-${match.index}`} className="inline-flex flex-col-reverse items-center justify-end align-bottom mx-[1px] leading-none mb-[-0.2em]">
             <span className="text-[1em] leading-normal">{base}</span>
             <span className="text-[0.55em] text-current opacity-70 select-none text-center font-normal mb-[0.1em]">{reading}</span>
           </span>
         );
       } else {
         segments.push(<span key={`ruby-${match.index}`}>{base}</span>);
       }
     } else if (match[3]) {
       // Matched single char (plain text)
       segments.push(<span key={`char-${match.index}`}>{match[3]}</span>);
     }
  }

  return (
    <span className={`inline-block align-baseline decoration-clone ${className}`}>
      {segments}
    </span>
  );
};