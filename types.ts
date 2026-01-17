
export type Language = 'EN' | 'JP';

export type Proficiency = 'new' | 'forgot' | 'hazy' | 'mastered';

export interface User {
  id: string;
  username: string;
}

export interface DefinitionBlock {
  id: string;
  pos: string; 
  // Split into bilingual fields
  defEN: string; // English Definition
  defCN: string; // Chinese Definition
  sentenceEN: string; // English Example
  sentenceCN: string; // Chinese Example translation
  imageUrl?: string;
  synonyms?: string; // Comma separated string
  antonyms?: string; // Comma separated string
}

export interface Flashcard {
  id: string;
  language: Language;
  term: string; 
  reading?: string; 
  audioUrl?: string; // URL to the generated audio file
  blocks: DefinitionBlock[];
  note?: string; // User notes
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
  AUTH = 'AUTH',
  HOME = 'HOME',
  DECK = 'DECK',
  DETAIL = 'DETAIL',
  QUIZ = 'QUIZ', 
  REVIEW = 'REVIEW', 
  ADD = 'ADD'
}