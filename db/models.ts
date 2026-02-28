import mongoose, { Schema, Document } from "mongoose";

// User schema
export interface IUser extends Document {
  email: string;
  displayName: string;
  name?: string;
  phone?: string;
  phoneVerifiedAt?: Date;
  countryCode?: string;
  password?: string;
  avatarUrl?: string;
  isBot: boolean;
  // OAuth fields
  oauthProvider?: "google" | null;
  oauthProviderId?: string; // Provider's unique user ID
  // Subscription fields
  plan?: "free" | "pro";
  isPro?: boolean;
  proSince?: Date;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  subscriptionProvider?: "razorpay" | "manual" | "gift" | null;
  subscriptionStatus?: "active" | "inactive" | "canceled" | null;
  subscriptionId?: string; // Razorpay subscription_id
  razorpayCustomerId?: string; // Razorpay customer_id for recurring payments
  // Billing address (for tax calculation)
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string; // Critical for US sales tax
    postalCode?: string;
    country?: string; // ISO 3166-1 alpha-2 (US, IN, etc.)
  };
  // Badges & Achievements
  badges?: Array<{
    badgeId: string; // e.g., "early-bird"
    earnedAt: Date; // When badge was awarded
    metadata?: {
      userRank?: number; // User position (e.g., #247 of 500)
      benefitUsedMonths?: number; // Track discount usage (0-3)
    };
  }>;
  // Referral fields
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  // Password reset fields
  resetToken?: string;
  resetTokenExpiry?: Date;
  // Terms acceptance
  termsAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    name: { type: String },
    phone: { type: String, unique: true, sparse: true },
    phoneVerifiedAt: { type: Date },
    countryCode: { type: String },
    password: { type: String },
    avatarUrl: { type: String },
    isBot: { type: Boolean, default: false },
    oauthProvider: { type: String, enum: ["google"], default: null },
    oauthProviderId: { type: String },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    isPro: { type: Boolean, default: false },
    proSince: { type: Date },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    subscriptionProvider: {
      type: String,
      enum: ["razorpay", "manual", "gift"],
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "canceled"],
      default: null,
    },
    subscriptionId: { type: String },
    razorpayCustomerId: { type: String },
    billingAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    badges: [
      {
        badgeId: { type: String, required: true },
        earnedAt: { type: Date, required: true },
        metadata: {
          userRank: { type: Number },
          benefitUsedMonths: { type: Number, default: 0 },
        },
      },
    ],
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },
    referralCount: { type: Number, default: 0 },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    termsAcceptedAt: { type: Date },
  },
  { timestamps: true },
);
userSchema.index({ displayName: 1 });
userSchema.index({ oauthProvider: 1, oauthProviderId: 1 });
userSchema.index({ "badges.badgeId": 1 });
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

// Project schema - groups related chats into workspaces
export interface IProject extends Document {
  userId: mongoose.Types.ObjectId | string;
  name: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}
const projectSchema = new Schema<IProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    color: { type: String },
  },
  { timestamps: true },
);
projectSchema.index({ userId: 1, createdAt: -1 });
export const Project =
  mongoose.models.Project || mongoose.model<IProject>("Project", projectSchema);

// Chat schema (single chat per conversation)
export interface IChat extends Document {
  userId: mongoose.Types.ObjectId | string;
  aiId: mongoose.Types.ObjectId | string;
  title?: string;
  projectId?: mongoose.Types.ObjectId | string;
  tags?: string[];
  summary?: string;
  category?: string;
  isPinned?: boolean;
  /** Persisted canvas node positions keyed by node ID */
  canvasPositions?: Record<string, { x: number; y: number }>;
  lastMsgAt: Date;
  createdAt: Date;
  updatedAt: Date;
  messages: IMessage[];
}
const chatSchema = new Schema<IChat>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    aiId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", default: null },
    tags: [{ type: String }],
    summary: { type: String },
    category: { type: String },
    isPinned: { type: Boolean, default: false },
    canvasPositions: { type: Schema.Types.Mixed, default: null },
    lastMsgAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);
chatSchema.index({ userId: 1, lastMsgAt: -1 });
chatSchema.index({ lastMsgAt: -1 });
chatSchema.index({ userId: 1, projectId: 1, lastMsgAt: -1 });
export const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

// Message schema
export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId | string;
  senderId: mongoose.Types.ObjectId | string;
  parentMsgId?: string | null;
  body: string;
  files: Array<{ name: string; url: string; mime: string; modelName?: string; width?: number; height?: number }>;
  reactions: Array<{ userId: string; emoji: string }>;
  createdAt: Date;
  editedAt?: Date;
  groundingMetadata?: any;
}
const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentMsgId: { type: String, default: null },
    body: { type: String, required: true },
    files: [{ name: String, url: String, mime: String, modelName: String, width: Number, height: Number }],
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
      },
    ],
    groundingMetadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: "editedAt" } },
);
messageSchema.index({ chatId: 1, createdAt: 1 });
messageSchema.index({ parentMsgId: 1, createdAt: 1 });
export const Message =
  mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);

// Annotation schema - for "Ask Lucinova" threads tied to selected text
export interface IAnnotation extends Document {
  messageId: mongoose.Types.ObjectId | string; // The message containing the selected text
  chatId: mongoose.Types.ObjectId | string;
  userId: mongoose.Types.ObjectId | string; // User who created the annotation
  selectedText: string; // The text that was selected
  // Position info for rendering the highlight
  startOffset?: number;
  endOffset?: number;
  createdAt: Date;
  updatedAt: Date;
}
const annotationSchema = new Schema<IAnnotation>(
  {
    messageId: { type: Schema.Types.ObjectId, ref: "Message", required: true },
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    selectedText: { type: String, required: true },
    startOffset: { type: Number },
    endOffset: { type: Number },
  },
  { timestamps: true },
);
annotationSchema.index({ messageId: 1, createdAt: 1 });
annotationSchema.index({ chatId: 1 });
export const Annotation =
  mongoose.models.Annotation ||
  mongoose.model<IAnnotation>("Annotation", annotationSchema);

// Payment schema (records payment events/orders from Razorpay)
export interface IPayment extends Document {
  orderId: string;
  status: string; // e.g., PAID, FAILED, SUCCESS
  amount: number; // rupees
  currency: string; // e.g., INR
  customerEmail?: string;
  customerName?: string;
  environment?: "production" | "test";
  planName?: string; // from order_note
  provider?: "razorpay"; // payment gateway used
  subscriptionId?: string; // Razorpay subscription_id
  paymentId?: string; // Razorpay payment_id
  invoiceId?: string; // Razorpay invoice_id
  // Tax fields
  taxAmount?: number; // Tax collected (in cents)
  taxRate?: number; // Tax rate applied (e.g., 0.0875 for 8.75%)
  taxJurisdiction?: string; // e.g., "CA" or "NY"
  taxCurrency?: string; // Currency of the tax amount (e.g., "USD")
  // Billing address snapshot at time of payment
  billingAddress?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  raw?: any;
  createdAt: Date;
  updatedAt: Date;
}
const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    customerEmail: { type: String },
    customerName: { type: String },
    environment: { type: String, enum: ["production", "test"] },
    planName: { type: String },
    provider: { type: String, enum: ["razorpay"] },
    subscriptionId: { type: String },
    paymentId: { type: String },
    invoiceId: { type: String },
    taxAmount: { type: Number },
    taxRate: { type: Number },
    taxJurisdiction: { type: String },
    taxCurrency: { type: String },
    billingAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Add missing indexes for common queries
paymentSchema.index({ customerEmail: 1, status: 1 }); // User payment history
paymentSchema.index({ subscriptionId: 1 }); // Webhook lookups
paymentSchema.index({ paymentId: 1 }); // Webhook lookups
paymentSchema.index({ status: 1, createdAt: -1 }); // Admin dashboard

export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

// Usage schema - tracks AI API usage per billing period
export interface IUsageBreakdown {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  unitsUsed: number;
  timestamp: Date;
}

export interface IUsage extends Document {
  userId: mongoose.Types.ObjectId | string;
  periodStart: Date;
  periodEnd: Date;
  unitsUsed: number;
  lastUpdated: Date;
  breakdown: IUsageBreakdown[];
  createdAt: Date;
  updatedAt: Date;
}

const usageSchema = new Schema<IUsage>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    unitsUsed: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
    breakdown: [
      {
        modelId: { type: String, required: true },
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        unitsUsed: { type: Number, default: 0 },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

// Optimize for getUserUsageStats: exact match on userId + range query on period
usageSchema.index({ userId: 1, periodStart: 1, periodEnd: 1 });
usageSchema.index({ userId: 1, periodEnd: -1 }); // Finding latest usage

export const Usage =
  mongoose.models.Usage || mongoose.model<IUsage>("Usage", usageSchema);
