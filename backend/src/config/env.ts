import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ewccms_mapims',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'mapims_ewccms_secure_jwt_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  WATI_API_ENDPOINT: process.env.WATI_API_ENDPOINT || 'https://live-server-1082.wati.io/api/v1',
  WATI_ACCESS_TOKEN: process.env.WATI_ACCESS_TOKEN || 'wati_live_sec_mapims_vault_token',
};
