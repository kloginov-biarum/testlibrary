import asyncio
import random

from fastapi import Depends, Header, HTTPException

import store


def _extract_token(authorization: str = Header(..., alias="Authorization")) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    return authorization.removeprefix("Bearer ").strip()


def get_current_user(token: str = Depends(_extract_token)) -> dict:
    user = store.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user


async def apply_glitch_delay(current_user: dict = Depends(get_current_user)) -> dict:
    """Drop-in replacement for get_current_user that adds a delay for performance_glitch_user."""
    if current_user["user_type"] == "performance_glitch_user":
        await asyncio.sleep(random.uniform(2.0, 3.5))
    return current_user


def require_admin(current_user: dict = Depends(apply_glitch_delay)) -> dict:
    if current_user["user_type"] != "admin_user":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
