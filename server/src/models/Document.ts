import mongoose, { Document as MongooseDocument, Schema } from 'mongoose';

export interface IDocumentPermission {
  userId: mongoose.Types.ObjectId;
  role: 'owner' | 'editor' | 'viewer';
}

export interface IDocumentAiMetadata {
  summary?: string;
  keyInsights?: string[];
  classification?: 'Confidential' | 'Internal' | 'Public' | 'Restricted' | 'Financial' | 'Legal' | 'Technical';
  riskScore?: number; // 0 - 100
  suggestedTags?: string[];
  extractedTextSnippet?: string;
  entities?: { name: string; type: string }[];
  processedAt?: Date;
}

export interface IDoc extends MongooseDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  folderId?: mongoose.Types.ObjectId;
  currentVersion: number;
  permissions: IDocumentPermission[];
  mimeType: string;
  sizeBytes: number;
  isDeleted: boolean;
  isBurnAfterRead: boolean; // Unique feature: Ephemeral self-destruct
  isBurned: boolean;
  isStarred: boolean;
  tags: string[];
  lockedBy?: mongoose.Types.ObjectId | null;
  lockedAt?: Date | null;
  aiMetadata?: IDocumentAiMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDoc>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    folderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null, index: true },
    currentVersion: { type: Number, default: 1 },
    permissions: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'editor', 'viewer'], required: true },
      },
    ],
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    isBurnAfterRead: { type: Boolean, default: false },
    isBurned: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lockedAt: { type: Date, default: null },
    aiMetadata: {
      summary: { type: String },
      keyInsights: { type: [String], default: [] },
      classification: { type: String, default: 'Internal' },
      riskScore: { type: Number, default: 0 },
      suggestedTags: { type: [String], default: [] },
      extractedTextSnippet: { type: String },
      entities: [{ name: { type: String }, type: { type: String } }],
      processedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

DocumentSchema.index({ name: 'text' });

export const DocumentModel = mongoose.model<IDoc>('Document', DocumentSchema);
