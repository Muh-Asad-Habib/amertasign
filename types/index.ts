export type SignLanguageType = 'bisindo' | 'sibi';
export type DictionaryCategory = 'alfabet' | 'angka' | 'kata_umum' | 'frasa';

export interface User {
  id: string;
  name: string;
  username: string;
  preferredSignLanguage: SignLanguageType;
  streak: number;
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
