export enum AppView {
  AUTH = 'auth',
  WORKSPACE = 'workspace',
  PROJECT_VAULT = 'project_vault',
  LOCAL_EXPERTS = 'local_experts',
  BUILDERS_WALL = 'builders_wall',
  EXPERT_POOL = 'expert_pool',
  EXPERT_PROJECTS = 'expert_projects',
  PORTFOLIO = 'portfolio',
  CALL = 'call',
  SETTINGS = 'settings',
  EXPERT_PROFILE = 'expert_profile',
  CLIENT_BROADCASTS = 'client_broadcasts'
}

export interface AuthUser {
  name: string;
  identifier: string; // email or phone
  password: string;
  role: 'client' | 'expert';
}

export interface Collection {
  id: string;
  name: string;
  postIds: string[];
}

export interface WallComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: string;
}

export interface WallPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  timestamp: string;
  tags: string[];
  comments: WallComment[];
  likedByClient?: boolean;
  likedByExpert?: boolean;
}

export interface ProjectMedia {
  id: string;
  url: string;
  type: 'photo' | 'video' | 'document';
  name: string;
  timestamp: string;
}

export interface Offer {
  expertId: string;
  expertName: string;
  expertAvatar: string;
  profile: Professional;
  timestamp: string;
}

export interface BroadcastRequest {
  id: string;
  clientId: string;
  clientName: string;
  problemSummary: string;
  category: string;
  snapshot?: string;
  urgency: 'low' | 'medium' | 'high';
  timestamp: string;
  status: 'open' | 'offer_received' | 'chatting' | 'active' | 'resolved';
  offers: Offer[];
  assignedExpertId?: string;
  assignedExpertName?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  type: 'doc' | 'sheet' | 'pdf' | 'folder';
  size?: string;
  modified: string;
}

export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar: string;
  rating: number;
  comment: string;
  date: string;
  aspects: {
    quality: number;
    communication: number;
    timeliness: number;
  };
}

export interface SavedCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  isDefault: boolean;
  nickname?: string;
}

export interface BankAccount {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  routingNumber: string;
  status: 'verified' | 'pending';
}

export interface Invoice {
  id: string;
  amount: number;
  type: 'hourly' | 'fixed';
  rateLabel: string; // e.g., "$85/hr" or "Total Project Fee"
  description: string;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  imageUrl: string;
  mimeType?: string;
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  category: 'Plumbing' | 'Electrical' | 'Gardening' | 'Carpentry' | 'General' | 'Design';
  rating: number;
  reviewCount: number;
  experience: string;
  location: string;
  city?: string;
  region?: string;
  zipCode: string;
  avatar: string;
  bio: string;
  skills: string[];
  portfolio: PortfolioItem[];
  hourlyRate: string;
  availability: 'Available Now' | 'Available Next Week' | 'Busy';
  reviews: Review[];
  pendingReviews?: Review[];
  certificates?: Certificate[];
  expertPlan?: 'standard' | 'pro' | 'enterprise';
}

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  status: 'planning' | 'in-progress' | 'completed';
  lastUpdated: string;
  summary: string;
  assignedProId?: string;
  assignedProName?: string;
  aiMessages: ChatMessage[];
  expertMessages: ChatMessage[];
  media: ProjectMedia[];
  files: DriveFile[];
  summaries: { id: string, title: string, content: string, date: string }[];
  invoice?: Invoice;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'expert' | 'system_summary' | 'missed_call';
  expertName?: string;
  text: string;
  canvasSnapshot?: string;
  generatedImages?: string[];
  attachedFiles?: DriveFile[];
  // Grounding sources extracted from Google Search tools
  groundingSources?: { title: string; uri: string }[];
}