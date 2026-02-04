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
  subscriptionProvider?: "razorpay" | "manual" | null;
  subscriptionStatus?: "active" | "inactive" | "canceled" | null;
  subscriptionId?: string; // Razorpay subscription_id
  razorpayCustomerId?: string; // Razorpay customer_id for recurring payments
  // Badges & Achievements
  badges?: Array<{
    badgeId: string; // e.g., "early-bird"
    earnedAt: Date; // When badge was awarded
    metadata?: {
      userRank?: number; // User position (e.g., #247 of 500)
      benefitUsedMonths?: number; // Track discount usage (0-3)
    };
  }>;
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
      enum: ["razorpay", "manual"],
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "canceled"],
      default: null,
    },
    subscriptionId: { type: String },
    razorpayCustomerId: { type: String },
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
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
    termsAcceptedAt: { type: Date },
  },
  { timestamps: true }
);
userSchema.index({ displayName: 1 });
userSchema.index({ oauthProvider: 1, oauthProviderId: 1 });
userSchema.index({ "badges.badgeId": 1 });
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

// Chat schema (single chat per conversation)
export interface IChat extends Document {
  userId: mongoose.Types.ObjectId | string;
  aiId: mongoose.Types.ObjectId | string;
  title?: string;
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
    lastMsgAt: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true }
);
chatSchema.index({ userId: 1, lastMsgAt: -1 });
chatSchema.index({ lastMsgAt: -1 });
export const Chat =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

// Message schema
export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId | string;
  senderId: mongoose.Types.ObjectId | string;
  parentMsgId?: string | null;
  body: string;
  files: Array<{ name: string; url: string; mime: string }>;
  reactions: Array<{ userId: string; emoji: string }>;
  createdAt: Date;
  editedAt?: Date;
}
const messageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentMsgId: { type: String, default: null },
    body: { type: String, required: true },
    files: [{ name: String, url: String, mime: String }],
    reactions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        emoji: { type: String, required: true },
      },
    ],
  },
  { timestamps: { createdAt: true, updatedAt: "editedAt" } }
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
  { timestamps: true }
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
  raw?: any;
  createdAt: Date;
  updatedAt: Date;
}
const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: String, required: true, unique: true },
    status: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    customerEmail: { type: String },
    customerName: { type: String },
    environment: { type: String, enum: ["production", "test"] },
    planName: { type: String },
    provider: { type: String, enum: ["razorpay"] },
    subscriptionId: { type: String },
    paymentId: { type: String },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);
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
  { timestamps: true }
);

usageSchema.index({ userId: 1, periodStart: -1 });
usageSchema.index({ userId: 1, periodEnd: 1 });

export const Usage =
  mongoose.models.Usage || mongoose.model<IUsage>("Usage", usageSchema);
