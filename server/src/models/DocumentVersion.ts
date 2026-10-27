import mongoose, { Document, Schema } from 'mongoose';

export interface IDocumentVersion extends Document {
  _id: mongoose.Types.ObjectId;
  documentId: mongoose.Types.ObjectId;
  versionNumber: number;
  fileKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  iv: string; // 12-byte IV in hex
  authTag: string; // 16-byte auth tag in hex
  checksum: string; // SHA-256 of plaintext
  uploadedBy: mongoose.Types.ObjectId;
  restoredFromVersion?: number;
  changeSummary?: string;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    versionNumber: { type: Number, required: true },
    fileKey: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    checksum: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restoredFromVersion: { type: Number },
    changeSummary: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

DocumentVersionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });

export const DocumentVersion = mongoose.model<IDocumentVersion>('DocumentVersion', DocumentVersionSchema);
