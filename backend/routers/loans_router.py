from fastapi import APIRouter, Depends, HTTPException

import store
from auth import apply_glitch_delay, require_admin
from models import LoanCreate, LoanResponse, build_loan_response

router = APIRouter(prefix="/loans", tags=["Loans"])

MAX_LOANS_PER_USER = 3


@router.get(
    "/me",
    response_model=list[LoanResponse],
    summary="Get current user's active loans",
)
def my_loans(current_user: dict = Depends(apply_glitch_delay)) -> list[LoanResponse]:
    loans = store.get_user_active_loans(current_user["username"])
    return [build_loan_response(loan, store.BOOKS) for loan in loans]


@router.post(
    "",
    response_model=LoanResponse,
    status_code=201,
    summary="Borrow a book",
    description=f"""
Borrow a book from the library.

**Rules:**
- Maximum **{MAX_LOANS_PER_USER} active loans** per user — returns HTTP 409 if exceeded
- Book must have **available copies** — returns HTTP 409 if none left
- Cannot borrow the **same book twice** simultaneously — returns HTTP 409
""",
)
def borrow_book(
    body: LoanCreate,
    current_user: dict = Depends(apply_glitch_delay),
) -> LoanResponse:
    book = store.BOOKS.get(body.book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    username = current_user["username"]
    user_loans = store.get_user_active_loans(username)

    if len(user_loans) >= MAX_LOANS_PER_USER:
        raise HTTPException(
            status_code=409,
            detail=f"Borrow limit reached. Maximum {MAX_LOANS_PER_USER} books allowed.",
        )

    if book["available_copies"] <= 0:
        raise HTTPException(status_code=409, detail="No copies available.")

    already_borrowed = any(loan["book_id"] == body.book_id for loan in user_loans)
    if already_borrowed:
        raise HTTPException(
            status_code=409, detail="You already have this book borrowed."
        )

    loan = store.create_loan(username, body.book_id)
    return build_loan_response(loan, store.BOOKS)


@router.delete(
    "/{loan_id}",
    status_code=204,
    summary="Return a book",
    description="Users can only return their own loans. Admins can return any loan.",
)
def return_book(
    loan_id: str,
    current_user: dict = Depends(apply_glitch_delay),
) -> None:
    loan = store.LOANS.get(loan_id)
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if (
        current_user["username"] != loan["username"]
        and current_user["user_type"] != "admin_user"
    ):
        raise HTTPException(
            status_code=403, detail="You can only return your own books."
        )

    store.delete_loan(loan_id)


@router.get(
    "",
    response_model=list[LoanResponse],
    summary="Get all loans (admin only)",
    description="Returns all active loans across all users. Admin access required.",
)
def all_loans(current_user: dict = Depends(require_admin)) -> list[LoanResponse]:
    return [build_loan_response(loan, store.BOOKS) for loan in store.LOANS.values()]
