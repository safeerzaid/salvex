import getpass
import urllib.parse
import os
import sys
import psycopg2

def main():
    print("Salvex Stage 2: Verified PostgreSQL Credential Synchronization")
    print("-------------------------------------------------------------")

    # 1. Prompt once with masked input
    try:
        password = getpass.getpass("Enter PostgreSQL password for user 'postgres': ")
    except Exception as e:
        print(f"ERROR: Failed to read password: {type(e).__name__}")
        sys.exit(1)

    if not password:
        print("ERROR: Password cannot be empty.")
        sys.exit(1)

    # 2. Verify connection against PostgreSQL BEFORE touching .env
    print("Testing connection against PostgreSQL (127.0.0.1:5432/salvex_auction)...")
    try:
        conn = psycopg2.connect(
            dbname="salvex_auction",
            user="postgres",
            password=password,
            host="127.0.0.1",
            port=5432,
            connect_timeout=5
        )
        cur = conn.cursor()
        cur.execute("SELECT 1;")
        res = cur.fetchone()[0]
        cur.close()
        conn.close()

        if res != 1:
            print("ERROR: Verification query returned unexpected result.")
            print(".env was NOT modified.")
            sys.exit(1)

        print("AUTHENTICATION VERIFIED: PostgreSQL accepted credentials.")
    except Exception as e:
        print(f"AUTHENTICATION FAILED: PostgreSQL rejected credentials ({type(e).__name__}).")
        print(".env was NOT modified.")
        sys.exit(1)

    # 3. Inspect .env and validate DATABASE_URL line presence
    env_path = ".env"
    if not os.path.exists(env_path):
        print(f"ERROR: {env_path} does not exist.")
        sys.exit(1)

    try:
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"ERROR: Failed reading {env_path}: {type(e).__name__}")
        sys.exit(1)

    db_url_indices = [i for i, line in enumerate(lines) if line.startswith("DATABASE_URL=")]

    if len(db_url_indices) == 0:
        print("ERROR: DATABASE_URL line not found in .env. File was NOT modified.")
        sys.exit(1)
    if len(db_url_indices) > 1:
        print("ERROR: Multiple DATABASE_URL lines found in .env. File was NOT modified.")
        sys.exit(1)

    # 4. Construct updated line with URL-encoded password
    target_index = db_url_indices[0]
    encoded_password = urllib.parse.quote(password, safe="")
    new_db_url_line = f"DATABASE_URL=postgresql+asyncpg://postgres:{encoded_password}@127.0.0.1:5432/salvex_auction\n"

    # 5. Atomic write: write to temporary file first, then replace .env
    lines[target_index] = new_db_url_line
    temp_path = ".env.tmp"

    try:
        with open(temp_path, "w", encoding="utf-8") as f:
            f.writelines(lines)
        os.replace(temp_path, env_path)
        print("SUCCESS: DATABASE_URL line in backend/.env updated safely with verified credentials.")
    except Exception as e:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
        print(f"ERROR: Failed atomic write to {env_path}: {type(e).__name__}")
        sys.exit(1)

if __name__ == "__main__":
    main()
