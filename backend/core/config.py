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

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
