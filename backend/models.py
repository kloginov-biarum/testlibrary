from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------- Auth ----------

class LoginRequest(BaseModel):
    username: str = Field(..., examples=["standard_user"])
    password: str = Field(..., examples=["secret_sauce"])


class LoginResponse(BaseModel):
    token: str
    username: str
    user_type: str
    display_name: str


class UserResponse(BaseModel):
    username: str
    user_type: str
    display_name: str


# ---------- Books ----------

CATEGORIES = Literal["Fiction", "Science", "History", "Technology", "Biography", "Fantasy"]


class BookResponse(BaseModel):
    book_id: str
    title: str
    author: str
    category: str
    isbn: str
    year: int
    description: str
    cover_color: str
    available_copies: int
    total_copies: int


class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, examples=["My Book"])
    author: str = Field(..., min_length=1, examples=["Jane Doe"])
    category: CATEGORIES = Field(..., examples=["Fiction"])
    isbn: str = Field(..., examples=["978-0-000-00000-0"])
    year: int = Field(..., examples=[2024])
    description: str = Field(default="", examples=["A great book."])
    cover_color: str = Field(default="#4A90D9", examples=["#4A90D9"])
    total_copies: int = Field(default=1, ge=1, examples=[3])


class BookUpdate(BaseModel):
    title: str | None = None
    author: str | None = None
    category: str | None = None
    isbn: str | None = None
    year: int | None = None
    description: str | None = None
    cover_color: str | None = None
    total_copies: int | None = Field(default=None, ge=1)


# ---------- Loans ----------

class LoanCreate(BaseModel):
    book_id: str


class LoanResponse(BaseModel):
    loan_id: str
    username: str
    book_id: str
    book_title: str
    book_author: str
    borrowed_at: str
    due_date: str
    is_overdue: bool


def build_loan_response(loan: dict, books: dict) -> LoanResponse:
    book = books.get(loan["book_id"], {})
    due_date = loan["due_date"]
    # Compare naive UTC strings
    try:
        due_dt = datetime.fromisoformat(due_date.rstrip("Z"))
        is_overdue = due_dt < datetime.utcnow()
    except Exception:
        is_overdue = False

    return LoanResponse(
        loan_id=loan["loan_id"],
        username=loan["username"],
        book_id=loan["book_id"],
        book_title=book.get("title", "Unknown"),
        book_author=book.get("author", "Unknown"),
        borrowed_at=loan["borrowed_at"],
        due_date=due_date,
        is_overdue=is_overdue,
    )
