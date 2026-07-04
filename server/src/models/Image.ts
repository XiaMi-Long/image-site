import mongoose, { Document, Schema } from 'mongoose';

export interface IImage extends Document {
  title: string;
  description: string;
  fileName: string;
  originalPath: string;
  displayPath: string;
  size: number;
  displaySize: number;
  width: number | null;
  height: number | null;
  mimeType: string;
  albumId: mongoose.Types.ObjectId | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IImage>(
  {
    title: { type: String, required: true, default: '未命名' },
    description: { type: String, default: '' },
    fileName: { type: String, required: true },
    originalPath: { type: String, required: true },
    displayPath: { type: String, required: true },
    size: { type: Number, required: true },
    displaySize: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    mimeType: { type: String, required: true },
    albumId: { type: Schema.Types.ObjectId, ref: 'Album', default: null, index: true },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true },
);

imageSchema.index({ createdAt: -1 });
imageSchema.index({ title: 'text' });

export const Image = mongoose.model<IImage>('Image', imageSchema);
