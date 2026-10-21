import os

# Set testing environment variables before any application modules load
os.environ["APP_ENV"] = "test"
os.environ["APP_SECRET_KEY"] = "test_secret_key_minimum_32_characters_long_for_salvex_unit_tests"
os.environ["DATABASE_URL"] = "postgresql+asyncpg://postgres:dummy_test_pass@localhost:5432/salvex_test_db"
os.environ["FRONTEND_ORIGINS"] = "http://localhost:5173"
