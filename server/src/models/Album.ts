import mongoose, { Document, Schema } from 'mongoose';

export interface IAlbum extends Document {
  name: string;
  description: string;
  coverImageId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const albumSchema = new Schema<IAlbum>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    coverImageId: { type: Schema.Types.ObjectId, ref: 'Image', default: null },
  },
  { timestamps: true },
);

albumSchema.index({ createdAt: -1 });

export const Album = mongoose.model<IAlbum>('Album', albumSchema);
