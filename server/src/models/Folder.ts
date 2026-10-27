import mongoose, { Document, Schema } from 'mongoose';

export interface IFolder extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  parentFolderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: { type: String, required: true, trim: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentFolderId: { type: Schema.Types.ObjectId, ref: 'Folder', default: null },
  },
  {
    timestamps: true,
  }
);

export const Folder = mongoose.model<IFolder>('Folder', FolderSchema);
