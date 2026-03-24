from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import store
from routers import auth_router, books_router, loans_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    store.initialize_store()
    yield


app = FastAPI(
    title="TestLibrary API",
    description="""
## TestLibrary — QA Demo Application

A library management system designed for QA testing practice.

### Getting Started

1. Use `POST /auth/login` to authenticate
2. Copy the `token` from the response
3. Click **Authorize** (lock icon) and enter: `Bearer <token>`
4. Explore the other endpoints

### Test Users (password for all: `secret_sauce`)

| Username | Behavior |
|---|---|
| `standard_user` | Normal behavior |
| `locked_out_user` | Cannot log in (HTTP 403) |
| `problem_user` | Logs in, but UI has 4 intentional bugs |
| `performance_glitch_user` | All requests delayed 2–3.5 seconds |
| `admin_user` | Full admin: create/update/delete books, see all loans |
""",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(books_router.router)
app.include_router(loans_router.router)


@app.get("/health", tags=["System"], summary="Health check")
def health() -> dict:
    return {"status": "ok"}
