export type SignLanguageType = 'bisindo' | 'sibi';
export type DictionaryCategory = 'alfabet' | 'angka' | 'kata_umum' | 'frasa';
export type LearningLevel = 'pemula' | 'menengah' | 'lanjutan';

export interface User {
  id: string;
  name: string;
  username: string;
  preferredSignLanguage: SignLanguageType;
  streak: number;
  completedModuleIds: string[];
  avatarUrl?: string;
}

export interface DictionaryEntry {
  id: string;
  word: string;
  category: DictionaryCategory;
  type: SignLanguageType;
  description: string;
  imageUrl: string;
  videoUrl: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  level: LearningLevel;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
  order: number;
}

export interface TranslationResult {
  id: string;
  sourceText: string;
  translatedText: string;
  signLanguageType: SignLanguageType;
  confidence: number;
  matchedEntryIds: string[];
  createdAt: string;
}
