// Sentry initialization on Edge runtime (middleware, edge routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: "https://d7aaedb1c973d2c73ed715d294fc5911@o4511512727912448.ingest.us.sentry.io/4511512751112192",

  tracesSampleRate: 0.1,

  enableLogs: false,
  sendDefaultPii: false,

  enabled: process.env.NODE_ENV === "production",
})
