
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  explanation?: string;
  isCoding?: boolean;
  createdAt: number;
}

export interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  STUDY = 'STUDY',
  CREATE = 'CREATE'
}
