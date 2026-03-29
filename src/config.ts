import dotenv from 'dotenv';
dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_TOKEN ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  dulceGestionApiUrl: process.env.DULCEGESTION_API_URL ?? 'http://localhost:3001/api',
  sessionTtlMinutes: parseInt(process.env.SESSION_TTL_MINUTES ?? '30', 10),
  sessionMaxHistory: parseInt(process.env.SESSION_MAX_HISTORY ?? '20', 10),
  widgetAllowedOrigin: process.env.WIDGET_ALLOWED_ORIGIN ?? 'http://localhost:5173',
  llmAdapter: process.env.LLM_ADAPTER ?? 'hardcoded',
  port: parseInt(process.env.PORT ?? '3002', 10),
  whatsappAccountSid: process.env.WHATSAPP_ACCOUNT_SID ?? '',
  whatsappAuthToken: process.env.WHATSAPP_AUTH_TOKEN ?? '',
  whatsappPhoneNumber: process.env.WHATSAPP_PHONE_NUMBER ?? '',
};
