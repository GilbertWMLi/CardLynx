export type Language = 'EN' | 'JP';

export type Proficiency = 'new' | 'forgot' | 'hazy' | 'mastered';

export interface DefinitionBlock {
  id: string;
  pos: string; 
  // Split into bilingual fields
  defEN: string; // English Definition
  defCN: string; // Chinese Definition
  sentenceEN: string; // English Example
  sentenceCN: string; // Chinese Example translation
  imageUrl?: string;
}

export interface Flashcard {
  id: string;
  language: Language;
  term: string; 
  reading?: string; 
  blocks: DefinitionBlock[];
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
  QUIZ = 'QUIZ', 
  REVIEW = 'REVIEW', 
  ADD = 'ADD'
}