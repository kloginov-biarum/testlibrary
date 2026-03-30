# TestLibrary

A QA demo application for manual testing practice — similar to [saucedemo.com](https://www.saucedemo.com) but a library management system.

**Tech stack:** Python 3.11 · FastAPI · Vanilla JS · nginx · Docker

---

## Live Demo

| | URL |
|---|---|
| **Frontend** | https://kloginov-biarum.github.io/testlibrary/ |
| **API (Swagger)** | https://testlibrary-2.onrender.com/docs |
| **API (ReDoc)** | https://testlibrary-2.onrender.com/redoc |

---

## Test Users

Password for all users: `secret_sauce`

| Username | Behavior |
|---|---|
| `standard_user` | Normal behavior |
| `locked_out_user` | Cannot log in (HTTP 403) |
| `problem_user` | Logs in, but UI has 4 intentional bugs |
| `performance_glitch_user` | All requests delayed 2–3.5 seconds |
| `admin_user` | Full admin access |

---

## Run Locally with Docker

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed and running

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/kloginov-biarum/testlibrary.git
cd testlibrary

# 2. Build and start both services
docker compose up --build

# 3. Open in browser
# Frontend: http://localhost
# API Swagger: http://localhost:8000/docs
```

To stop:

```bash
docker compose down
```

---

## Project Structure

```
testlibrary/
├── backend/          # FastAPI application
│   ├── main.py
│   ├── routers/
│   ├── models.py
│   ├── store.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/         # Static HTML/CSS/JS
│   ├── index.html
│   ├── catalog.html
│   ├── my-books.html
│   ├── admin.html
│   ├── css/
│   ├── js/
│   ├── nginx.conf
│   └── Dockerfile
├── docs/
│   └── bug-reports-problem-user.md
├── docker-compose.yml
└── render.yaml
```

---

## How It Works Locally

nginx (port 80) serves the frontend and proxies all API requests (`/auth`, `/books`, `/loans`, `/health`, `/docs`) to the FastAPI backend (port 8000). No manual configuration needed — the frontend auto-detects `localhost` and uses relative URLs.
