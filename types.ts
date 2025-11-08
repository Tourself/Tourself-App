

export type Language = 'en' | 'ru' | 'ge';

export type MultilingualString = {
  [key in Language]: string;
};

export interface Review {
  id: string;
  guideItemId: string;
  userName:string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
  isApproved: boolean;
}

export type ServiceSubCategory = 'banks_atms' | 'car_rentals' | 'medical_clinics' | 'pharmacy';

export interface LocalGuideItem {
  id: string;
  category: 'sites' | 'restaurants' | 'services';
  subCategory?: ServiceSubCategory;
  title: MultilingualString;
  description: MultilingualString;
  address: MultilingualString;
  contact: string;
  coords: { lat: number; lng: number };
  image: string;
  averageRating?: number;
}

export enum QuestDifficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export enum QuestionType {
  MultipleChoice = 'MultipleChoice',
  OpenText = 'OpenText',
}

export interface Question {
  type: QuestionType;
  question: MultilingualString;
  options?: MultilingualString[]; // For MultipleChoice
  answer: MultilingualString; // For OpenText, this is the exact string. For MC, it's the index.
  hint?: MultilingualString;
}

export interface QuestStep {
  stepIndex: number;
  title: MultilingualString;
  clue: MultilingualString;
  image: string;
  coords: { lat: number; lng: number };
  question: Question;
  postAnswerInfo?: MultilingualString;
  postAnswerImage?: string;
}

export enum QuestStatus {
    Published = 'published',
    Pending = 'pending_approval',
    Draft = 'draft',
}

export interface Quest {
  id: string;
  title: MultilingualString;
  description: MultilingualString;
  mainImage: string;
  difficulty: QuestDifficulty;
  duration: number; // in minutes
  category: string;
  price: number;
  steps: QuestStep[];
  status: QuestStatus;
  authorId?: string;
}

export type UserRole = 'admin' | 'guide';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  messenger: string;
}

export interface Purchase {
  id: string;
  userId: string;
  questId: string;
  purchaseDate: string;
  status: 'started' | 'completed';
  completionDate?: string;
}

export interface InfoPage {
  id: string;
  title: MultilingualString;
  content: MultilingualString;
}

export interface HomePageContent {
  id: 'home';
  heroImage: string;
  title: MultilingualString;
  subtitle: MultilingualString;
  card1Title: MultilingualString;
  card1Description: MultilingualString;
  card2Title: MultilingualString;
  card2Description: MultilingualString;
}

export interface PromoCode {
  id: string;
  code: string;
  questIds: string[]; // empty array means all quests
  usageLimit: number; // 0 for unlimited
  currentUsage: number;
  expirationDate: string; // ISO string e.g. "2024-12-31"
}