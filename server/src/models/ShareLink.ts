import mongoose, { Document, Schema } from 'mongoose';

export interface IShareLink extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  token: string;
  passwordHash?: string | null;
  hasPassword?: boolean;
  expiresAt: Date;
  maxViews?: number | null;
  viewCount: number;
  allowDownload: boolean;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShareLinkSchema = new Schema<IShareLink>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, default: null },
    expiresAt: { type: Date, required: true, index: true },
    maxViews: { type: Number, default: null },
    viewCount: { type: Number, default: 0 },
    allowDownload: { type: Boolean, default: true },
    isRevoked: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Virtual property indicating whether password protection is active
ShareLinkSchema.virtual('hasPassword').get(function () {
  return !!this.passwordHash;
});

export const ShareLinkModel = mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);
