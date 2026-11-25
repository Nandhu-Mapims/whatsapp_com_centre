import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/ewccms_mapims',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET || 'mapims_ewccms_secure_jwt_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  WATI_API_ENDPOINT: process.env.WATI_API_ENDPOINT || 'https://live-mt-server.wati.io/10190409',
  WATI_ACCESS_TOKEN:
    process.env.WATI_ACCESS_TOKEN ||
    'wati_23e7b9c8-a03f-4877-b520-6196a6779d56.x3l8hzgWOaUwzI4sDy19Z9sQboGGZjp8IDLfC_qM0G24wRiEhhqp3e_oR-pnwn1rLlvzgx_lQqrTTLuGiZXt4ooNCwBdxIc8XOwQwi5-VPRBuG9bsIliIUFNfXAgJUsx',
  SHORTLINK_BASE_URL: process.env.SHORTLINK_BASE_URL || process.env.APP_DOMAIN || '',
};
