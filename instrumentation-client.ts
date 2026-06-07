// Sentry initialization on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://d7aaedb1c973d2c73ed715d294fc5911@o4511512727912448.ingest.us.sentry.io/4511512751112192",

  // 10% trace sampling — hemat quota free tier
  tracesSampleRate: 0.1,

  // Disable console log → Sentry forwarding (terlalu noisy)
  enableLogs: false,

  // Privacy — jangan kirim PII (email, IP, dll)
  sendDefaultPii: false,

  // Hanya kirim error di production
  enabled: process.env.NODE_ENV === "production",
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
