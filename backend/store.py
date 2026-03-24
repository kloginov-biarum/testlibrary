"""
In-memory data store. All state lives in module-level dicts.
Resets every time the server restarts — this is intentional for a demo app.
"""
import uuid
from datetime import datetime, timedelta

from seed_data import SEED_BOOKS, SEED_USERS

# username -> user record
USERS: dict[str, dict] = {}

# token (UUID str) -> username
SESSIONS: dict[str, str] = {}

# book_id (UUID str) -> book record
BOOKS: dict[str, dict] = {}

# loan_id (UUID str) -> loan record
LOANS: dict[str, dict] = {}


def initialize_store() -> None:
    """Populate in-memory store from seed data. Call once at startup."""
    USERS.clear()
    SESSIONS.clear()
    BOOKS.clear()
    LOANS.clear()

    for user in SEED_USERS:
        USERS[user["username"]] = dict(user)

    for book in SEED_BOOKS:
        book_id = str(uuid.uuid4())
        BOOKS[book_id] = {
            "book_id": book_id,
            "title": book["title"],
            "author": book["author"],
            "category": book["category"],
            "isbn": book["isbn"],
            "year": book["year"],
            "description": book["description"],
            "cover_color": book["cover_color"],
            "total_copies": book["total_copies"],
            "available_copies": book["total_copies"],
        }


def create_session(username: str) -> str:
    token = str(uuid.uuid4())
    SESSIONS[token] = username
    return token


def get_user_by_token(token: str) -> dict | None:
    username = SESSIONS.get(token)
    if username:
        return USERS.get(username)
    return None


def delete_session(token: str) -> None:
    SESSIONS.pop(token, None)


def get_user_active_loans(username: str) -> list[dict]:
    return [loan for loan in LOANS.values() if loan["username"] == username]


def create_loan(username: str, book_id: str) -> dict:
    loan_id = str(uuid.uuid4())
    now = datetime.utcnow()
    due = now + timedelta(days=14)
    loan = {
        "loan_id": loan_id,
        "username": username,
        "book_id": book_id,
        "borrowed_at": now.isoformat() + "Z",
        "due_date": due.isoformat() + "Z",
    }
    LOANS[loan_id] = loan
    BOOKS[book_id]["available_copies"] -= 1
    return loan


def delete_loan(loan_id: str) -> None:
    loan = LOANS.pop(loan_id, None)
    if loan:
        book = BOOKS.get(loan["book_id"])
        if book:
            book["available_copies"] = min(
                book["available_copies"] + 1, book["total_copies"]
            )
