from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", populate_by_name=True)

    environment: Literal["development", "test", "production"] = Field("development", alias="NODE_ENV")
    host: str = Field("0.0.0.0", alias="HOST")
    port: int = Field(5001, alias="PORT", ge=1, le=65535)
    database_url: str = Field(alias="DATABASE_URL")
    base_url: str = Field(alias="BETTER_AUTH_URL")
    secret: str = Field(alias="BETTER_AUTH_SECRET", min_length=32)
    jwt_issuer: str = Field(alias="JWT_ISSUER")
    jwt_audience: str = Field(alias="JWT_AUDIENCE", min_length=1)
    trusted_origins_raw: str = Field("http://localhost:4000", alias="TRUSTED_ORIGINS")
    mindspace_api_database_url: str | None = Field(None, alias="MINDSPACE_API_DATABASE_URL")
    seed_mindspace_api: bool = Field(True, alias="SEED_MINDSPACE_API")

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def trusted_origins(self) -> list[str]:
        return [o.strip() for o in self.trusted_origins_raw.split(",") if o.strip()]

    @model_validator(mode="after")
    def _check(self) -> "Settings":
        if self.seed_mindspace_api and not self.mindspace_api_database_url:
            raise ValueError("MINDSPACE_API_DATABASE_URL is required when SEED_MINDSPACE_API=true")
        if self.is_production and not self.base_url.startswith("https://"):
            raise ValueError("BETTER_AUTH_URL must use HTTPS in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
