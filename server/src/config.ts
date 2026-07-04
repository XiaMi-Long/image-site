import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/image_site',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  port: parseInt(process.env.PORT || '4000', 10),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  displayWidth: parseInt(process.env.DISPLAY_WIDTH || '1600', 10),
  displayQuality: parseInt(process.env.DISPLAY_QUALITY || '85', 10),
  rootDir: path.resolve(__dirname, '..'),
};

export const paths = {
  originals: path.resolve(config.rootDir, config.uploadDir, 'originals'),
  displays: path.resolve(config.rootDir, config.uploadDir, 'displays'),
};
