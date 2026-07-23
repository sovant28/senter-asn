from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = (
        "postgresql+asyncpg://senter:senter_dev@localhost:5432/senter_db"
    )
    DATABASE_URL_SYNC: str = (
        "postgresql://senter:senter_dev@localhost:5432/senter_db"
    )
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_ECHO: bool = False

    APP_NAME: str = "SENTER ASN"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    BCRYPT_COST: int = 12
    MAX_UPLOAD_SIZE_MB: int = 10

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
