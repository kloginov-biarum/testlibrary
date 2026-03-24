from fastapi import APIRouter, Depends, Header, HTTPException

import store
from auth import get_current_user, _extract_token
from models import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Login with username and password",
    description="""
Authenticate a user and receive a session token.

Use the returned `token` as a Bearer token in all subsequent requests:
`Authorization: Bearer <token>`

**Test credentials (all passwords: `secret_sauce`)**

| Username | Behavior |
|---|---|
| `standard_user` | Normal behavior |
| `locked_out_user` | Returns HTTP 403 — cannot log in |
| `problem_user` | Logs in normally, but UI has 4 intentional bugs |
| `performance_glitch_user` | All API calls take 2–3.5 seconds |
| `admin_user` | Full admin access: manage books, view all loans |
""",
)
def login(body: LoginRequest) -> LoginResponse:
    user = store.USERS.get(body.username)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    if user["user_type"] == "locked_out_user":
        raise HTTPException(
            status_code=403,
            detail="Sorry, this user has been locked out.",
        )

    if user["password"] != body.password:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    token = store.create_session(body.username)
    return LoginResponse(
        token=token,
        username=user["username"],
        user_type=user["user_type"],
        display_name=user["display_name"],
    )


@router.post(
    "/logout",
    summary="Logout and invalidate session token",
    description="Deletes the current session. The token cannot be used after this call.",
)
def logout(token: str = Depends(_extract_token)) -> dict:
    store.delete_session(token)
    return {"message": "Logged out successfully"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user info",
    description="Returns username, user_type, and display_name for the authenticated user.",
)
def me(current_user: dict = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        username=current_user["username"],
        user_type=current_user["user_type"],
        display_name=current_user["display_name"],
    )
