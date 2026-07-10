import express from 'express';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import { config } from './config.js';
import { connectDB } from './db.js';
import { seedAdmin } from './routes/auth.js';
import authRoutes from './routes/auth.js';
import imageRoutes from './routes/images.js';
import albumRoutes from './routes/albums.js';
import tagRoutes from './routes/tags.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 静态文件：原图与展示图
app.use('/uploads', express.static(path.join(config.rootDir, 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/tags', tagRoutes);

app.use('/api', notFoundMiddleware);
app.use(errorMiddleware);

async function main() {
  await connectDB();
  await seedAdmin();
  // Drop old single-field text index, let Mongoose create compound
  try {
    const col = mongoose.connection.db?.collection('images');
    if (col) {
      const hasOld = await col.indexExists('title_text');
      if (hasOld) {
        await col.dropIndex('title_text');
        await mongoose.model('Image').ensureIndexes();
      }
    }
  } catch { /* non-fatal: $regex fallback still works */ }
  app.listen(config.port, () => {
    console.log(`[server] http://localhost:${config.port}`);
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
