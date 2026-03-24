import uuid
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query

import store
from auth import apply_glitch_delay, require_admin
from models import BookCreate, BookResponse, BookUpdate

router = APIRouter(prefix="/books", tags=["Books"])


def _book_to_response(book: dict) -> BookResponse:
    return BookResponse(**book)


@router.get(
    "",
    response_model=list[BookResponse],
    summary="List all books",
    description="""
Returns all books, with optional filtering and sorting.

**Query parameters:**
- `search` — case-insensitive substring match on title and author
- `category` — filter by exact category name
- `sort_by` — `title` or `author` (default: `title`)
- `sort_order` — `asc` or `desc` (default: `asc`)
""",
)
def list_books(
    search: str | None = Query(default=None, description="Search in title and author"),
    category: str | None = Query(default=None, description="Filter by category"),
    sort_by: Literal["title", "author"] = Query(default="title"),
    sort_order: Literal["asc", "desc"] = Query(default="asc"),
    current_user: dict = Depends(apply_glitch_delay),
) -> list[BookResponse]:
    books = list(store.BOOKS.values())

    if search:
        q = search.lower()
        books = [b for b in books if q in b["title"].lower() or q in b["author"].lower()]

    if category:
        books = [b for b in books if b["category"].lower() == category.lower()]

    reverse = sort_order == "desc"
    books.sort(key=lambda b: b[sort_by].lower(), reverse=reverse)

    return [_book_to_response(b) for b in books]


@router.get(
    "/{book_id}",
    response_model=BookResponse,
    summary="Get a single book by ID",
)
def get_book(
    book_id: str,
    current_user: dict = Depends(apply_glitch_delay),
) -> BookResponse:
    book = store.BOOKS.get(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return _book_to_response(book)


@router.post(
    "",
    response_model=BookResponse,
    status_code=201,
    summary="Create a new book (admin only)",
)
def create_book(
    body: BookCreate,
    current_user: dict = Depends(require_admin),
) -> BookResponse:
    book_id = str(uuid.uuid4())
    book = {
        "book_id": book_id,
        "title": body.title,
        "author": body.author,
        "category": body.category,
        "isbn": body.isbn,
        "year": body.year,
        "description": body.description,
        "cover_color": body.cover_color,
        "total_copies": body.total_copies,
        "available_copies": body.total_copies,
    }
    store.BOOKS[book_id] = book
    return _book_to_response(book)


@router.put(
    "/{book_id}",
    response_model=BookResponse,
    summary="Update a book (admin only)",
    description="Only provided fields are updated. `available_copies` is adjusted if `total_copies` changes.",
)
def update_book(
    book_id: str,
    body: BookUpdate,
    current_user: dict = Depends(require_admin),
) -> BookResponse:
    book = store.BOOKS.get(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    updates = body.model_dump(exclude_none=True)
    if "total_copies" in updates:
        delta = updates["total_copies"] - book["total_copies"]
        book["available_copies"] = max(0, book["available_copies"] + delta)

    book.update(updates)
    return _book_to_response(book)


@router.delete(
    "/{book_id}",
    status_code=204,
    summary="Delete a book (admin only)",
    description="Also removes all active loans for this book and restores availability.",
)
def delete_book(
    book_id: str,
    current_user: dict = Depends(require_admin),
) -> None:
    if book_id not in store.BOOKS:
        raise HTTPException(status_code=404, detail="Book not found")

    # Remove all loans for this book
    loan_ids_to_remove = [
        lid for lid, loan in store.LOANS.items() if loan["book_id"] == book_id
    ]
    for lid in loan_ids_to_remove:
        store.LOANS.pop(lid, None)

    del store.BOOKS[book_id]
