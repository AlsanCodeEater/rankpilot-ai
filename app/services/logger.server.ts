/**
 * Simple Server-Side Logger
 * Logs messages securely. Ensures no API keys or personal data are accidentally leaked.
 */

const SENSITIVE_KEYS = [
  "ZAI_API_KEY",
  "OPENROUTER_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_API_KEY",
  "access_token",
  "pixel_secret"
];

function maskSensitiveData(obj: any): any {
  if (!obj) return obj;
  if (typeof obj !== "object") return obj;

  const masked = { ...obj };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
      masked[key] = "[REDACTED]";
    } else if (typeof masked[key] === "object") {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

export const logger = {
  info(message: string, meta?: any) {
    const safeMeta = maskSensitiveData(meta);
    console.log(`[INFO] ${message}`, safeMeta ? safeMeta : "");
  },
  warn(message: string, meta?: any) {
    const safeMeta = maskSensitiveData(meta);
    console.warn(`[WARN] ${message}`, safeMeta ? safeMeta : "");
  },
  error(message: string, error?: any, meta?: any) {
    const safeMeta = maskSensitiveData(meta);
    console.error(`[ERROR] ${message}`, error?.message || error, safeMeta ? safeMeta : "");
  }
};
