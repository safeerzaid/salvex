import getpass
import urllib.parse
import re
import sys

def main():
    print("Salvex Auction Platform — Secure Database Credential Configuration")
    print("------------------------------------------------------------------")
    try:
        password = getpass.getpass("Enter PostgreSQL password for user 'postgres': ")
    except Exception as e:
        print(f"Error reading password: {e}")
        sys.exit(1)

    if not password:
        print("Password cannot be empty.")
        sys.exit(1)

    encoded_password = urllib.parse.quote(password, safe="")

    try:
        with open(".env", "r", encoding="utf-8") as f:
            content = f.read()

        new_url = f"postgresql+asyncpg://postgres:{encoded_password}@localhost:5432/salvex_auction"
        updated_content = re.sub(r"DATABASE_URL=.*", f"DATABASE_URL={new_url}", content)

        with open(".env", "w", encoding="utf-8") as f:
            f.write(updated_content)

        print("SUCCESS: DATABASE_URL updated securely in backend/.env with URL-encoded password.")
    except Exception as e:
        print(f"Error updating .env: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
