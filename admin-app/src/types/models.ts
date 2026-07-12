import type { Timestamp } from "firebase/firestore";

export type FirestoreDate = Timestamp | Date | string | null | undefined;

export type OrderStatus =
  | "requested"
  | "accepted"
  | "rejected"
  | "pending"
  | "preparing"
  | "completed"
  | "cancelled";

export type ReservationStatus = "pending" | "confirmed" | "rejected";

export type VisibilityStatus = "active" | "hidden" | "archived";

export interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price?: number;
  category?: string;
}

export interface Order {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  userEmail?: string;
  userId?: string;
  status?: OrderStatus | string;
  total?: number;
  items?: OrderItem[];
  orderType?: string;
  orderTypeLabel?: string;
  orderTiming?: string;
  requestedFor?: FirestoreDate;
  requestedForLabel?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  updatedBy?: string;
}

export interface Reservation {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  date?: string;
  time?: string;
  guests?: string | number;
  notes?: string;
  status?: ReservationStatus | "completed" | string;
  createdAt?: FirestoreDate;
  decisionAt?: FirestoreDate;
  decisionBy?: string;
  decisionReason?: string;
}

export interface MenuCatalogItem {
  id: string;
  category: string;
  name: string;
  nameZh?: string;
  price: number;
}

export interface MenuItemView extends MenuCatalogItem {
  currentPrice: number;
  hidden: boolean;
  imageUrl: string;
  hasPriceOverride: boolean;
  hasImageOverride: boolean;
}

export interface PromotionItem {
  id: string;
  name: string;
  category?: string;
  originalPrice?: number;
  promoPrice?: number | null;
  image?: string;
}

export interface Promotion {
  id: string;
  type?: "promotion" | "deal" | string;
  title?: string;
  offer?: string;
  code?: string;
  description?: string;
  expiresAt?: string;
  discountType?: "custom" | "percent" | "bundle" | string;
  discountPercent?: number | null;
  bundlePrice?: number | null;
  items?: PromotionItem[];
  active?: boolean;
  visible?: boolean;
  status?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  createdBy?: string;
  updatedBy?: string;
}

export interface ContactMessage {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  phoneMasked?: string;
  subject?: string;
  message?: string;
  originalMessage?: string;
  source?: string;
  read?: boolean;
  reportCategory?: string;
  reportUrgency?: string;
  preferredContact?: string;
  verificationStatus?: string;
  pageUrl?: string;
  createdAt?: FirestoreDate;
}

export interface AdminUser {
  id: string;
  email?: string;
  addedAt?: FirestoreDate;
  addedBy?: string;
}

export interface ChatbotKnowledge {
  id: string;
  title?: string;
  name?: string;
  question?: string;
  answer?: string;
  content?: string;
  body?: string;
  description?: string;
  text?: string;
  active?: boolean;
  archived?: boolean;
  status?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  archivedAt?: FirestoreDate;
  createdBy?: string;
  updatedBy?: string;
}

export interface SpecialMenuItem {
  name: string;
  price?: number | null;
  category?: string;
  description?: string;
}

export interface SpecialMenu {
  id: string;
  title?: string;
  eventDate?: string;
  note?: string;
  items?: SpecialMenuItem[];
  active?: boolean;
  status?: string;
  createdAt?: FirestoreDate;
  updatedAt?: FirestoreDate;
  createdBy?: string;
  updatedBy?: string;
}

export interface SmsCampaign {
  id?: string;
  title?: string;
  status?: string;
  messagePreview?: string;
  createdAt?: string;
  createdBy?: string;
  recipientCount?: number;
  successCount?: number;
  failedCount?: number;
  scheduled?: boolean;
  scheduleLocal?: string;
}

export interface FraudReview {
  duplicatePhones: Array<{ phoneMasked?: string; users: Array<{ email?: string; uid?: string; name?: string }> }>;
  repeatedOtpSends: Array<{ subjectHash: string; count: number }>;
  repeatedOtpFailures: Array<{ subjectHash: string; count: number }>;
  repeatedCancellations: Array<{ count: number; customerName?: string; customerPhone?: string; userId?: string }>;
  priceMismatches: Array<{ suppliedTotal?: number; authoritativeTotal?: number; userId?: string; createdAt?: string }>;
  suspiciousBursts: Array<{ scope?: string; createdAt?: string; subjectHash?: string }>;
  recentEvents: Array<{ kind?: string; createdAt?: string; orderId?: string; reservationId?: string; userId?: string }>;
}
