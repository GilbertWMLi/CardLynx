import { ComparisonResult, FeedbackItem } from '../types';

/**
 * Analyzes the user's input sentence against the target (correct) sentence.
 */
export const analyzeSentence = (userInput: string, targetSentence: string): ComparisonResult => {
  const normalize = (str: string) => str.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
  
  // Handle empty target edge case
  if (!targetSentence) {
    return { score: 0, feedback: [], generalErrors: ["Target sentence is missing."] };
  }

  const userWords = userInput.trim().split(/\s+/);
  // Support Japanese sentence splitting purely by char if no spaces (rudimentary fallback)
  // But for this analysis, we assume spaces or use a simple char split for JP if needed.
  // For now, we stick to space-based for English reliability, simple split for others.
  const isJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(targetSentence);
  
  let targetWords: string[];
  let uWordsToProcess: string[];

  if (isJapanese) {
    // Very basic char-by-char logic for JP since we don't have a tokenizer
    targetWords = targetSentence.split('');
    uWordsToProcess = userInput.split('');
  } else {
    targetWords = targetSentence.trim().split(/\s+/);
    uWordsToProcess = userWords;
  }

  const normalizedUser = uWordsToProcess.map(normalize);
  const normalizedTarget = targetWords.map(normalize);

  const feedback: FeedbackItem[] = [];
  let correctCount = 0;
  const generalErrors: string[] = [];

  // 1. Basic Rule Checks (English only)
  if (!isJapanese) {
    if (userInput.length > 0 && userInput[0] !== userInput[0].toUpperCase()) {
      generalErrors.push("Sentences should start with a capital letter.");
    }
    const lastChar = userInput.trim().slice(-1);
    const targetLastChar = targetSentence.trim().slice(-1);
    const isPunctuation = (char: string) => ['.', '!', '?'].includes(char);
    if (isPunctuation(targetLastChar) && lastChar !== targetLastChar) {
      generalErrors.push(`Missing or incorrect punctuation. Expected: "${targetLastChar}"`);
    }
  }

  // 2. Diff Logic
  let userIdx = 0;
  let targetIdx = 0;

  while (targetIdx < normalizedTarget.length) {
    const uWordRaw = uWordsToProcess[userIdx] || "";
    const tWordRaw = targetWords[targetIdx];
    
    const uWord = normalizedUser[userIdx];
    const tWord = normalizedTarget[targetIdx];

    if (!uWord) {
      feedback.push({ word: tWordRaw, status: 'missing' });
      targetIdx++;
      continue;
    }

    if (uWord === tWord) {
      feedback.push({ word: uWordRaw, status: 'correct' });
      correctCount++;
      userIdx++;
      targetIdx++;
    } else {
      const nextUserWordMatchesCurrentTarget = normalizedUser[userIdx + 1] === tWord;
      const currentUserWordMatchesNextTarget = uWord === normalizedTarget[targetIdx + 1];

      if (nextUserWordMatchesCurrentTarget) {
         feedback.push({ word: uWordRaw, status: 'extra' });
         userIdx++; 
      } else if (currentUserWordMatchesNextTarget) {
         feedback.push({ word: tWordRaw, status: 'missing' });
         targetIdx++; 
      } else {
         feedback.push({ word: uWordRaw, status: 'incorrect', expected: tWordRaw });
         userIdx++;
         targetIdx++;
      }
    }
  }

  while (userIdx < normalizedUser.length) {
    feedback.push({ word: uWordsToProcess[userIdx], status: 'extra' });
    userIdx++;
  }

  const totalTokens = Math.max(normalizedTarget.length, normalizedUser.length);
  const score = totalTokens === 0 ? 0 : Math.round((correctCount / totalTokens) * 100);

  return {
    score,
    feedback,
    generalErrors
  };
};