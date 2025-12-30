export type Language = 'EN' | 'JP';

export type Proficiency = 'new' | 'forgot' | 'hazy' | 'mastered';

export interface DefinitionBlock {
  id: string;
  pos: string; // Part of Speech (e.g., noun, verb, or for JP: 動詞, 形容詞)
  definition: string;
  exampleSentence: string;
  imageUrl?: string; // Base64 string for local storage
}

export interface Flashcard {
  id: string;
  language: Language;
  term: string; // Word or Kanji
  reading?: string; // For Japanese Kana reading
  blocks: DefinitionBlock[]; // Multiple definitions/POS
  createdAt: number;
  proficiency: Proficiency;
  lastReviewed?: number;
}

export interface ComparisonResult {
  score: number;
  feedback: FeedbackItem[];
  generalErrors: string[];
}

export interface FeedbackItem {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
  expected?: string;
}

export enum AppView {
  HOME = 'HOME',
  DECK = 'DECK',
  DETAIL = 'DETAIL',
  QUIZ = 'QUIZ', // Spelling/Sentence construction
  REVIEW = 'REVIEW', // Flashcard proficiency check
  ADD = 'ADD'
}