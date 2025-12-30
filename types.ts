export interface Flashcard {
  id: string;
  word: string;
  definition: string;
  exampleSentence: string;
  createdAt: number;
  reviewCount: number;
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

export enum AppTab {
  CARDS = 'CARDS',
  QUIZ = 'QUIZ',
}