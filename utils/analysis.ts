import { ComparisonResult, FeedbackItem } from '../types';

/**
 * Analyzes the user's input sentence against the target (correct) sentence.
 * This uses a deterministic word-by-word comparison and basic rule checking
 * instead of generative AI.
 */
export const analyzeSentence = (userInput: string, targetSentence: string): ComparisonResult => {
  const normalize = (str: string) => str.trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase();
  
  const userWords = userInput.trim().split(/\s+/);
  const targetWords = targetSentence.trim().split(/\s+/);
  const normalizedUser = userWords.map(normalize);
  const normalizedTarget = targetWords.map(normalize);

  const feedback: FeedbackItem[] = [];
  let correctCount = 0;
  const generalErrors: string[] = [];

  // 1. Basic Rule Checks
  if (userInput.length > 0 && userInput[0] !== userInput[0].toUpperCase()) {
    generalErrors.push("Sentences should start with a capital letter.");
  }

  const lastChar = userInput.trim().slice(-1);
  const targetLastChar = targetSentence.trim().slice(-1);
  const isPunctuation = (char: string) => ['.', '!', '?'].includes(char);
  
  if (isPunctuation(targetLastChar) && lastChar !== targetLastChar) {
    generalErrors.push(`Missing or incorrect punctuation. Expected: "${targetLastChar}"`);
  }

  // 2. Diff Logic (Simple position-based with lookahead)
  // This is a simplified diff. For production NLP, Levenshtein distance per word is better,
  // but this suffices for "strict" practice.
  
  let userIdx = 0;
  let targetIdx = 0;

  while (targetIdx < normalizedTarget.length) {
    const uWordRaw = userWords[userIdx] || "";
    const tWordRaw = targetWords[targetIdx];
    
    const uWord = normalizedUser[userIdx];
    const tWord = normalizedTarget[targetIdx];

    if (!uWord) {
      // User ran out of words
      feedback.push({ word: tWordRaw, status: 'missing' });
      targetIdx++;
      continue;
    }

    if (uWord === tWord) {
      // Exact match
      feedback.push({ word: uWordRaw, status: 'correct' });
      correctCount++;
      userIdx++;
      targetIdx++;
    } else {
      // Mismatch
      // Check if the user inserted an extra word (look ahead in target)
      // or if they missed a word (look ahead in user input)
      
      const nextUserWordMatchesCurrentTarget = normalizedUser[userIdx + 1] === tWord;
      const currentUserWordMatchesNextTarget = uWord === normalizedTarget[targetIdx + 1];

      if (nextUserWordMatchesCurrentTarget) {
         // User typed an extra word before the correct one
         feedback.push({ word: uWordRaw, status: 'extra' });
         userIdx++; // Skip the user's extra word, stay on target
      } else if (currentUserWordMatchesNextTarget) {
         // User missed the current target word
         feedback.push({ word: tWordRaw, status: 'missing' });
         targetIdx++; // Move target forward, keep user index
      } else {
         // Just a wrong word substitution
         feedback.push({ word: uWordRaw, status: 'incorrect', expected: tWordRaw });
         userIdx++;
         targetIdx++;
      }
    }
  }

  // Check for trailing extra words from user
  while (userIdx < normalizedUser.length) {
    feedback.push({ word: userWords[userIdx], status: 'extra' });
    userIdx++;
  }

  // Calculate score
  const totalTokens = Math.max(normalizedTarget.length, normalizedUser.length);
  const score = totalTokens === 0 ? 0 : Math.round((correctCount / totalTokens) * 100);

  return {
    score,
    feedback,
    generalErrors
  };
};