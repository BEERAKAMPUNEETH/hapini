# Hapini — Smart Price Comparison Platform

> **A high-performance, full-stack price arbitrage and comparison platform built with modern SDE best practices.**

Hapini monitors, aggregates, and compares prices for consumer tech across major retailers (Amazon, Flipkart, Croma, etc.), providing consumers with real-time lowest price identification, historical price drop trends, and synthesized AI review summaries.

---

## 🏛️ Architecture Overview

```
                      ┌──────────────────────────────────────┐
                      │          React 19 + TypeScript       │
                      │   Vite 8 + Tailwind CSS v4 + Mol*    │
                      └──────────────────┬───────────────────┘
                                         │ REST API / JWT
                      ┌──────────────────▼───────────────────┐
                      │      Node.js + Express + TS API      │
                      │  Layered Controllers, Services & DI  │
                      └─────────┬──────────────────┬─────────┘
                                │                  │
            ┌───────────────────▼──┐            ┌──▼───────────────────┐
            │   PostgreSQL 16 DB   │            │     Redis 7 Cache    │
            │  Relational Storage  │            │ In-memory Query TTL  │
            │  (Source of Truth)   │            │ (Cache-Aside Layer)  │
            └──────────────────────┘            └──────────────────────┘
```

* **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Framer Motion (micro-interactions), Lucide Icons, Recharts (price trajectory graphing).
* **Backend:** Node.js, Express, TypeScript, Layered Architecture (Controllers &rarr; Services &rarr; Data Access), Parameterized SQL queries, Centralized Error Handling.
* **Database:** PostgreSQL (Users, Products, Retailers, Offers, Price History, Wishlists, Price Alerts).
* **Cache:** Redis 7 with Cache-Aside pattern, stable canonical keys, configurable TTLs, and instant invalidation on product/offer updates. Transparent fallback to memory when Redis is offline.
* **Security & Auth:** Native JWT authentication (`Bearer <token>`), 10-round bcrypt password hashing, IP rate limiting, and strict user-scoped authorization.
* **DevOps & Containers:** Docker, Docker Compose, Multi-stage builds, Nginx SPA reverse proxy.
* **CI/CD:** GitHub Actions workflow running automated typechecking and production builds on push/PR.
* **Cloud Target:** AWS (ECS Fargate / App Runner, Amazon RDS PostgreSQL, Amazon ElastiCache Redis).

---

## ⚡ Redis Caching Layer & Cache-Aside Architecture

The caching layer uses the **Cache-Aside Pattern** to offload frequent public catalog searches and product queries while ensuring **PostgreSQL remains the single source of truth**:

1. **Cache-Aside Read Flow**:
   - The application checks Redis (or the in-memory fallback) for a pre-computed result.
   - If found (`X-Cache: HIT`), the cached JSON is returned immediately.
   - If not found (`X-Cache: MISS`), the database is queried, the response is serialized and saved with a configurable TTL, and returned to the client.
2. **Deterministic Stable Cache Keys**:
   - Query parameters are canonicalized regardless of URL order. For example, `?search=mac&category=Laptops` and `?category=Laptops&search=mac` resolve to the exact same cache key:
     `products:list:cat:laptops:q:mac:sort:featured:stock:false:lim:50:off:0`
3. **Configurable TTL**:
   - `CACHE_TTL_SECONDS`: 300s (Default catalog listing)
   - `SEARCH_CACHE_TTL_SECONDS`: 120s (Fast-changing autocomplete search)
   - `PRODUCT_CACHE_TTL_SECONDS`: 600s (Detailed specifications and price history)
4. **Cache Invalidation on Updates**:
   - When a product or retailer offer price updates, `productService.invalidateProductCache(productId)` evicts the specific product detail key and pattern-deletes all associated catalog lists and search results (`products:list:*`, `products:search:*`).
   - Invalidation endpoint: `POST /api/products/cache/invalidate` (rate-limited).
5. **Private Data Isolation**:
   - **User-specific private data (e.g. `/api/wishlist`, `/api/auth/me`) is NEVER cached in shared public keys**.
   - Cached public product queries attach `X-Cache: HIT | MISS` response headers, clearly indicating to clients whether data was served from cache or live from PostgreSQL.

---

## 📋 Redis Local Setup Options for Windows

Redis is an **optional enhancement layer**. The backend includes built-in graceful degradation: if Redis is not running, it automatically uses an internal high-performance in-memory cache with zero configuration required.

If you wish to run a dedicated Redis instance locally, choose any of the options below:

### Option 1: Docker Compose (Easiest if Docker Desktop is installed)
```powershell
# Start only the Redis container
docker compose up -d redis

# Verify Redis is responding
docker exec -it hapini-redis redis-cli ping
# Expected output: PONG
```

### Option 2: Windows Subsystem for Linux (WSL 2)
```powershell
# Open Ubuntu / WSL terminal
wsl

# Install and launch Redis Server
sudo apt update
sudo apt install -y redis-server
sudo service redis-server start

# Verify status
redis-cli ping
# Expected output: PONG
```

### Option 3: Native Windows Port / Memurai
1. Install Redis for Windows via `winget`:
   ```powershell
   winget install Redis.Redis
   ```
2. Or download **Memurai** (Redis-compatible Windows engine) from [https://www.memurai.com](https://www.memurai.com).

## 🐳 Docker & Docker Compose Setup

Hapini is fully containerized using multi-stage, production-hardened Docker images with self-contained container health checks, service readiness guarantees, and persistent local storage:

```
┌────────────────────────────────────────────────────────┐
│                   docker-compose.yml                   │
├─────────────────┬──────────────────┬───────────────────┤
│    Postgres 16  │     Redis 7      │    Backend API    │
│  pg_isready     │  redis-cli ping  │  /api/health      │
│  :5432          │  :6379           │  :5000            │
│  [pgdata vol]   │  [redisdata vol] │  non-root node    │
└────────┬────────┴────────┬─────────┴─────────┬─────────┘
         │                 │                   │
         └─────────┬───────┴───────────────────┘
                   │ service_healthy condition
          ┌────────▼────────┐
          │   Frontend SPA  │
          │   Nginx Alpine  │
          │   :80 & :5173   │
          └─────────────────┘
```

### Docker Management Commands (Windows PowerShell)

```powershell
# 1. Start all containers in detached mode (builds images on first run)
docker compose up -d

# 2. Inspect container status and health checks
docker compose ps

# 3. View live logs from all services (or specify 'backend', 'frontend', 'postgres', 'redis')
docker compose logs -f backend

# 4. Run database migrations inside the running backend container
docker compose exec backend npm run db:migrate

# 5. Run database seeds inside the backend container
docker compose exec backend npm run db:seed

# 6. Execute full automated test suite inside the containerized environment
docker compose exec backend npm test

# 7. Stop all services (preserves persistent database and cache volumes)
docker compose down

# NOTE: Named volumes 'pgdata' and 'redisdata' persist all data across restarts.
# Never pass the '-v' flag to docker compose down without explicit intent.
```

---

## 🔔 Price Alerts & Scheduled Evaluation Engine

Hapini enables authenticated users to set custom price alerts on products and retailer offers (e.g. "Notify me if the iPhone 17 Pro drops below ₹70,000"):

1. **Background Scheduled Worker**:
   - Evaluates active alerts against newly recorded offer prices every 60 seconds (`alertJobService.startScheduler(60000)`).
   - Concurrency lock guard (`isJobRunning`) prevents overlapping passes.
   - Comprehensive audit logging via `alert_job_logs` tracks duration, evaluated counts, triggered alerts, and failures.
2. **Strict Idempotency Safeguards**:
   - Prevents duplicate notifications for the same observation using deterministic keys:
     `alert_{alert.id}_p{productId}_price{Math.floor(currentPrice)}`
   - Guaranteed at database level with a `UNIQUE(idempotency_key)` constraint on the `alert_notifications` table.
   - Safely retriable without repeated alerts.
3. **Pluggable Notification Provider Architecture**:
   - `INotificationProvider` interface enables swappable transports.
   - Local development implementation (`ConsoleNotificationProvider`) formats clear, structured alerts in the console and test assertions without calling paid third-party APIs or sending real emails.
4. **Interactive Simulation & Manual Triggers**:
   - `POST /api/alerts/simulate-price`: Updates simulated offer prices to test alert triggers on demand.
   - `POST /api/alerts/run-check`: Manually forces a job execution pass for instant verification.
   - In the frontend, the **Price Alerts Dashboard** (`/alerts`) includes interactive **"Test Trigger"** buttons that instantly simulate price drops and visualize triggered statuses.

---

## 🚀 Local Development (Without Docker)

### 1. Configure Environment
```powershell
# Copy the environment template (safe placeholders only)
Copy-Item .env.example .env
```

### 2. Install Dependencies
```powershell
# Install root, frontend, and backend packages
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 3. Start Development Servers
Open two Windows PowerShell terminals:

```powershell
# Terminal 1 - Backend API (Port 5000)
npm run dev:backend

# Terminal 2 - React Frontend (Port 5173)
npm run dev:frontend
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Comprehensive Automated Testing Suite

The project includes an end-to-end testing suite spanning pure business unit logic, isolated database integration, UI state handling, and full browser-less E2E journeys:

```powershell
# Run ALL test suites across the monorepo (Backend + Frontend)
npm test

# 1. Unit Tests: Pure price comparison & alert evaluation logic
npm run test:unit

# 2. API Integration Tests: Full HTTP lifecycle against isolated test database
npm run test:integration

# 3. Frontend Tests: Vitest + Testing Library for Search, Loading, Empty & Error states + E2E
npm run test:frontend

# 4. Authentication Suite: Password hashing, JWT auth, and wishlist isolation
npm run test:auth

# 5. Redis Caching Suite: Cache-aside HIT/MISS, canonical keys, TTL, and offline resilience
npm run test:cache

# 6. Price Alerts Suite: Periodic scheduler, simulated drops, and idempotency guards
npm run test:alerts
```

### Test Coverage Highlights:
- `✓` **Unit Logic**: Verifies currency parsing, Indian rupee formatting, lowest price selection, max savings calculation, and boundary cases.
- `✓` **Isolated DB Integration**: Runs against `TEST_DATABASE_URL` / `hapini_test`, verifying products catalog, offers, user registration, wishlist, and alert CRUD in total isolation from development data.
- `✓` **Frontend State Handling**: Verifies search bar debouncing and clear controls, pulse skeleton loaders, error retry banners, and empty state illustrations.
- `✓` **End-to-End User Flow**: Simulates a complete user journey searching for a product, verifying live search dropdown results, navigating to product details, and comparing multi-store offers with lowest-price badges.
- `✓` **Cache Miss / Hit**: Initial queries fetch from source and populate Redis; subsequent identical queries return `X-Cache: HIT`.
- `✓` **Deterministic Canonical Keys**: Permuted query parameters resolve to identical cache keys.
- `✓` **Idempotency Safeguards**: Re-running background alert evaluation passes strictly prevents duplicate notifications for the same observation.
- `✓` **Cross-User Authorization**: Enforces strict user isolation so users cannot read or delete each other's alerts or wishlists.

---

## 🔄 CI/CD & GitHub Actions Workflow

Hapini includes a continuous integration pipeline configured in [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml) that automatically runs on pushes and pull requests targeting the `main` branch.

```
                  GitHub Push / Pull Request to 'main'
                                   │
             ┌─────────────────────┴─────────────────────┐
             ▼                                           ▼
┌─────────────────────────┐                 ┌─────────────────────────┐
│      Frontend Job       │                 │       Backend Job       │
│     (ubuntu-latest)     │                 │     (ubuntu-latest)     │
├─────────────────────────┤                 ├─────────────────────────┤
│ • actions/checkout@v4   │                 │ • Isolated Services:    │
│ • actions/setup-node@v4 │                 │   - postgres:16-alpine  │
│   (Node 20, npm cache)  │                 │   - redis:7-alpine      │
│ • npm ci (reproducible) │                 │ • actions/setup-node@v4 │
│ • npm run lint (ESLint) │                 │   (Node 20, npm cache)  │
│ • npm run typecheck     │                 │ • npm ci (reproducible) │
│ • npm test (Vitest)     │                 │ • npm run typecheck     │
│ • npm run build (Vite)  │                 │ • npm run db:setup      │
│                         │                 │ • npm test (All suites) │
│                         │                 │ • npm run build (tsc)   │
└─────────────────────────┘                 └─────────────────────────┘
```

### 1. Key Pipeline Guarantees
- **Least-Privilege Security**: Configured with strict top-level `permissions: contents: read`. No elevated write privileges or production cloud credentials are exposed.
- **Reproducible Dependency Resolution**: Dependencies are strictly installed with `npm ci` referencing lockfiles (`frontend/package-lock.json` and `backend/package-lock.json`).
- **NPM Package Caching**: Both jobs use `actions/setup-node@v4` with `cache: "npm"` keyed to their respective lockfiles for fast, efficient pipeline runs.
- **Concurrency Control**: Automatically cancels obsolete in-progress pipeline runs on rapid updates (`cancel-in-progress: true`).
- **Isolated Service Containers**: The backend job spins up isolated `postgres:16-alpine` and `redis:7-alpine` containers with native health checks (`pg_isready` and `redis-cli ping`), allowing unit, authentication, caching, price alert, and database integration tests to run in an environment identical to production.

---

### 2. Configuring the GitHub Repository

To enforce branch protection and ensure code quality before merging PRs:

1. **Push the repository to GitHub**:
   ```powershell
   git remote add origin https://github.com/<your-username>/hapini.git
   git push -u origin main
   ```
2. **Navigate to Repository Settings**:
   - Go to **Settings** &rarr; **Branches** &rarr; **Branch protection rules** (or **Rulesets** &rarr; **New ruleset**).
3. **Add Branch Protection Rule for `main`**:
   - Branch name pattern: `main`
   - Check **Require a pull request before merging**
   - Check **Require status checks to pass before merging**
   - Check **Require branches to be up to date before merging**
   - In the search bar for status checks, add the CI job names:
     - `Frontend (Lint, Typecheck, Tests & Build)`
     - `Backend (Lint, Typecheck, DB Integration & Tests)`
4. **Save Changes**: This ensures that any pull request cannot be merged unless both frontend and backend jobs pass without error.

---

### 3. Verifying Workflow Execution

1. Open your repository on GitHub and navigate to the **Actions** tab.
2. Select **Hapini CI** from the left sidebar to view all workflow runs.
3. Click on a specific run to inspect logs from each step:
   - Expand `Install Dependencies` to verify npm cache hits.
   - Expand `Run ESLint` and `Typecheck` to inspect static analysis reports.
   - Expand `Run Backend Tests` to view individual assertions across unit logic, database transactions, Redis cache-aside hits, and price alert scheduling.
   - Expand `Build Production` to confirm asset bundling completes cleanly.
4. On pull request pages, status badges will appear in the PR merge box, showing real-time pass/fail states with direct links to the job logs.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Cache / Auth Strategy |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service uptime, DB, and Redis connection status | No Cache |
| `GET` | `/api/products` | Filter, sort, and search catalog products | Cache-Aside (300s TTL) |
| `GET` | `/api/products/:id` | Full product specs, retailer offers & price history | Cache-Aside (600s TTL) |
| `GET` | `/api/products/search?q=:q` | Substring search autocomplete | Cache-Aside (120s TTL, Rate-limited) |
| `POST` | `/api/products/cache/invalidate`| Evict product/list caches on data updates | Rate-limited (15 req/min) |
| `POST` | `/api/auth/register` | User registration with 10-round bcrypt hash | Rate-limited (20 req/15 min) |
| `POST` | `/api/auth/login` | User login returning signed JWT | Rate-limited (20 req/15 min) |
| `GET` | `/api/auth/me` | Current authenticated user profile | Protected by JWT Bearer |
| `POST` | `/api/auth/logout` | Client session logout | Public |
| `GET` | `/api/wishlist` | Authenticated user's saved products | User-Scoped, No Shared Cache |
| `POST` | `/api/wishlist` | Add product to authenticated user's wishlist | User-Scoped |
| `DELETE`| `/api/wishlist/:productId` | Remove product from user's wishlist | User-Scoped |
| `POST` | `/api/alerts` | Create a target price alert for product/offer | Protected by JWT Bearer |
| `GET` | `/api/alerts` | Retrieve authenticated user's price alerts | User-Scoped (`WHERE user_id = $1`) |
| `GET` | `/api/alerts/:id` | Retrieve single alert by ID | User-Scoped (IDOR protected) |
| `PATCH`| `/api/alerts/:id` | Update target price or active status | User-Scoped (IDOR protected) |
| `DELETE`| `/api/alerts/:id` | Delete user's price alert | User-Scoped (IDOR protected) |
| `POST` | `/api/alerts/run-check` | Trigger scheduled alert evaluation pass | Rate-limited / Idempotent |
| `POST` | `/api/alerts/simulate-price` | Simulate retailer price change for testing | Rate-limited |
| `GET` | `/api/alerts/logs` | Retrieve recent background job audit logs | Admin / Monitoring |

---

## 💡 Key SDE Interview Talking Points

1. **Cache-Aside Pattern & Consistency:** The database remains the authoritative source of truth. Redis acts as a pure read-through accelerator. When product prices or offers update, the corresponding detail and list keys are evicted to prevent presenting stale prices.
2. **Transparent Graceful Degradation:** Both PostgreSQL and Redis connections employ retry caps and non-blocking fallbacks. If Redis goes down, response latency degrades slightly to database query time, but user-facing availability is unaffected.
3. **No Cross-User Parameter Tampering (IDOR Prevention):** Private user endpoints extract the identity strictly from verified JWT tokens (`req.user.id`), making Insecure Direct Object References impossible.
4. **Deterministic Canonical Caching:** Queries with permuted parameters (`?a=1&b=2` vs `?b=2&a=1`) are canonicalized before hashing, ensuring zero duplicate cache bloat.
5. **Safe, Idempotent Background Workers:** Price alert evaluation uses unique compound idempotency keys (`alert_{id}_p{productId}_price{floor}`) backed by PostgreSQL `UNIQUE` constraints to guarantee that network hiccups or repeated scheduler runs never spam users with duplicate notifications.
6. **Zero External Paid Dependencies:** The architecture uses swappable provider interfaces (`INotificationProvider`), allowing local development to format console and audit logs while leaving production free to hook into AWS SES or SNS without code rewrites.
