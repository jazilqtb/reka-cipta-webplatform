from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    SUPABASE_JWT_SECRET: str
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    ENVIRONMENT: str = "development"
    SENTRY_DSN: str = ""
    REVALIDATION_SECRET: str = ""
    RESEND_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    # Default ke domain Vercel aktual saat ini (belum ada custom domain
    # rekaciptaindonesia.com terpasang). Override via env var Railway
    # kapan pun custom domain sudah live — tidak perlu ubah kode.
    FRONTEND_URL: str = "https://reka-cipta-webplatform.vercel.app"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
