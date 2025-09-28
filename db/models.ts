import mongoose, { Schema, Document } from "mongoose";

// User schema
export interface IUser extends Document {
  email: string;
  displayName: string;
  name?: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
  isBot: boolean;
  // Subscription fields
  plan?: "free" | "pro";
  isPro?: boolean;
  proSince?: Date;
  currentPeriodEnd?: Date | null;
  subscriptionProvider?: "cashfree" | "manual" | null;
  subscriptionStatus?: "active" | "inactive" | "canceled" | null;
  createdAt: Date;
  updatedAt: Date;
}
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    name: { type: String },
    phone: { type: String },
    password: { type: String },
    avatarUrl: { type: String },
    isBot: { type: Boolean, default: false },
    plan: { type: String, enum: ["free", "pro"], default: "free" },
    isPro: { type: Boolean, default: false },
    proSince: { type: Date },
    currentPeriodEnd: { type: Date, default: null },
    subscriptionProvider: {
      type: String,
      enum: ["cashfree", "manual"],
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "canceled"],
      default: null,
    },
  },
  { timestamps: true }
);
userSchema.index({ displayName: 1 });
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

// Payment schema (records Cashfree payment events/orders)
export interface IPayment extends Document {
  orderId: string;
  status: string; // e.g., PAID, FAILED
  amount: number; // rupees
  currency: string; // e.g., INR
  customerEmail?: string;
  customerName?: string;
  environment?: "production" | "sandbox";
  planName?: string; // from order_note
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
    environment: { type: String, enum: ["production", "sandbox"] },
    planName: { type: String },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);
paymentSchema.index({ orderId: 1 }, { unique: true });
export const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);
