# InsightStack

**Workspace-scoped analytics for turning uploaded business data into dashboards, exports, and AI-assisted answers.**

InsightStack is a full-stack SaaS analytics application built with a React/TypeScript frontend and a Django REST API. Users can create accounts, work with organization workspaces, upload structured datasets, explore dataset-derived analytics, build dashboards and reports, and ask an AI assistant questions about authorized workspace data.

## Project summary

InsightStack demonstrates how to connect a typed single-page application to a multi-tenant API: authentication and workspace membership scope access, uploaded files are parsed into persistent dataset records, and analytics, report exports, and AI context are derived from that data. The AI integration uses Groq's chat completions API; provider credentials stay on the server.

## Features implemented

| Area | Implemented behavior |
| --- | --- |
| Authentication | Registration, login, JWT refresh/logout, password reset/change endpoints, and MFA setup/verification endpoints. Password-policy and API validation failures are surfaced by the frontend. |
| Organizations and workspaces | Organization/workspace onboarding and membership-aware access to workspace resources. |
| Dataset ingestion | CSV, `.xlsx`, and JSON upload, column and row parsing, sample preview, and persisted dataset records. |
| Analytics | Workspace-scoped dataset summaries and numeric/categorical aggregations exposed through the analytics API. Dashboard metrics are derived from available dataset fields; they are not guaranteed to represent business concepts such as revenue unless the uploaded data supports that meaning. |
| Dashboards | Create and persist dashboards and widget configuration; dashboard pages consume workspace data rather than relying on the earlier static examples. |
| AI analytics | Natural-language questions and generated insights use workspace KPIs and a bounded sample of authorized dataset rows. Groq API keys are read only by the backend. |
| Reports and exports | Persisted reports can export dataset-backed content as PDF, CSV, or Excel (`.xlsx`). Spreadsheet-formula-like values are escaped, and exports are audit logged. |
| Notifications and audit | Authenticated users can access notifications and workspace audit activity through API endpoints. |
| Subscription display | Subscription plans and related plan information are represented in the application. Payment processing is not implemented. |

### Current limitations

The following should not be presented as completed product capabilities:

- Report scheduling and public report sharing are not operational; their API actions explicitly return `503 Service Unavailable`.
- Subscription plan display is not a payment or billing integration.
- Email delivery, scheduled email alerts, and Celery-backed report delivery are not verified as working features.
- Dedicated anomaly-detection and forecasting workflows are not implemented as claimed in earlier project descriptions.
- Analytics use the columns and records supplied by a workspace. Business-specific semantics (for example, identifying which column is revenue) require suitable source data and configuration.

## Technology

### Frontend

- React **19** and TypeScript
- Vite 8
- Tailwind CSS
- React Router
- TanStack Query and Zustand
- Axios
- Recharts
- React Hook Form
- Lucide React

### Backend

- Python and Django **4.2.11**
- Django REST Framework
- SimpleJWT
- PostgreSQL configuration through `DATABASE_URL` or `DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_HOST`/`DB_PORT`
- Pandas, `openpyxl`, and CSV/JSON parsing for dataset ingestion
- ReportLab and `openpyxl` for PDF and Excel export
- Groq Python SDK and Groq chat completions API
- `drf-spectacular` for OpenAPI schema and Swagger UI
- TOTP/MFA support through `pyotp` and `django-otp`
- Celery and Redis dependencies are present; do not assume background delivery is enabled for every feature

> **Database note:** The current Django settings configure PostgreSQL from the environment; they do not default to SQLite. The `dev` settings module enables development conveniences, but does not change that database selection.

## Architecture

```text
Browser
  └── React + TypeScript application (Vite)
        └── Axios requests under /api
              └── Django REST Framework
                    ├── JWT authentication and workspace membership checks
                    ├── Dataset parsing and persisted rows
                    ├── Analytics, dashboards, and report exports
                    ├── Notifications and audit events
                    └── AI endpoints ── Groq chat completions API
```

The frontend uses the Vite development server and its `/api` proxy. Django routes API areas under `/api/`, with OpenAPI schema and Swagger UI available at `/api/schema/` and `/api/docs/` respectively when the backend is running.

### Backend apps

`authentication`, `users`, `organizations`, and `workspaces` manage identity and tenant boundaries. `datasets` parses and stores source data; `analytics` and `dashboards` expose dataset-derived summaries and saved dashboard configuration. `reports` creates persisted reports and exports; `ai_insights` builds workspace-scoped context for Groq; `notifications`, `audit`, and `subscriptions` provide their respective API surfaces.

## Local development setup

### Requirements

- Python version supported by the project dependencies
- Node.js version supported by Vite 8
- PostgreSQL reachable from the backend, locally or remotely
- A Groq API key for AI query and insight generation

### 1. Configure the backend

From the repository root:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` locally. Set a private Django `SECRET_KEY` and configure the database using **one** of these approaches:

```dotenv
# Option A: a PostgreSQL URL
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

# Option B: individual PostgreSQL settings
DB_NAME=insightstack
DB_USER=postgres
DB_PASSWORD=your-local-password
DB_HOST=localhost
DB_PORT=5432
```

Also configure Groq for AI features:

```dotenv
GROQ_API_KEY=your-private-groq-api-key
GROQ_MODEL=openai/gpt-oss-120b
```

Create or rotate API keys in the provider console and keep them only in your local environment file or deployment secret store. Never commit `.env` or paste a live key into chat, source code, screenshots, or logs. The model can be changed with `GROQ_MODEL` to another model currently available to your Groq account.

Apply migrations only to the database configured for this local environment. If pointing at a database that already contains important data, back it up and review pending migrations before applying them.

```powershell
python manage.py migrate --settings=config.settings.dev
python manage.py runserver --settings=config.settings.dev 8000
```

Backend API: `http://127.0.0.1:8000/api/`  
Swagger UI: `http://127.0.0.1:8000/api/docs/`

### 2. Start the frontend

In a second terminal, from the repository root:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The frontend calls the backend through the configured `/api` development proxy.

### Useful checks

```powershell
# Backend tests and Django configuration check
cd backend
python manage.py test
python manage.py check --settings=config.settings.dev

# Frontend lint and production build
cd ..\frontend
npm run lint
npm run build
```

## Resume-ready project material

### Concise summary

Built InsightStack, a multi-tenant analytics web application that ingests CSV, Excel, and JSON datasets; persists workspace-scoped records; presents dataset-derived analytics and dashboards; exports reports to PDF/CSV/XLSX; and supports Groq-powered natural-language analytics.

### Resume bullets

- Built a full-stack analytics platform using React, TypeScript, Django REST Framework, and PostgreSQL configuration, with JWT-protected APIs and workspace-membership checks for tenant-scoped access.
- Implemented CSV, Excel, and JSON ingestion with parsed row persistence, dataset previews, analytics endpoints, and reusable dashboard/report data flows.
- Integrated Groq chat completions for workspace-scoped natural-language analytics and implemented PDF, CSV, and XLSX report exports with audit logging and spreadsheet formula escaping.

### 30-second pitch

“InsightStack is a full-stack analytics platform I built with React and Django. Users can upload CSV, Excel, or JSON data into a workspace, explore derived analytics, save dashboards and reports, and export reports as PDF, CSV, or Excel. I also integrated Groq so users can ask questions against a bounded context built from data they are authorized to access. The main engineering focus was connecting ingestion, tenant-scoped APIs, persistence, exports, and the AI flow end to end.”

### Two-minute technical explanation

“The frontend is a React and TypeScript single-page application built with Vite. It uses an Axios API layer to communicate with Django REST Framework under `/api/`, plus React Router, TanStack Query, and Zustand for application flows and state.

On the backend, Django provides JWT-based authentication and separate apps for identity, organizations, workspaces, datasets, analytics, dashboards, reports, AI insights, notifications, audit, and subscriptions. Dataset upload accepts CSV, Excel, and JSON; parsing extracts columns and rows, and records are persisted against a workspace. API queries check the signed-in user’s workspace membership so data access stays tenant-scoped.

Analytics and dashboard values are derived from the available uploaded data, so the application does not assume a particular business meaning for every numeric column. Reports are persisted and can be exported in PDF, CSV, or XLSX; exports are audit logged and spreadsheet values are escaped against formula execution.

For AI, the backend assembles workspace KPIs and a bounded sample of dataset rows, then sends that context to Groq’s chat completions API. The provider key is server-side configuration, not frontend code. Report scheduling/public sharing and payment processing are not complete, so I describe those as limitations rather than shipped capabilities.”

## Interview questions and sample answers

**1. How do you isolate one customer’s data from another?**  
Workspace resources are queried through the authenticated user’s workspace membership, and workspace IDs are checked against those memberships before serving analytics or AI context. I would continue to enforce the same tenant boundary in every new endpoint and test cross-workspace access explicitly.

**2. How does dataset ingestion work?**  
The upload flow accepts CSV, `.xlsx`, and JSON. The backend detects the file type, parses headers and rows, records metadata such as columns and row count, and persists dataset rows for previews and downstream analytics.

**3. How do you keep AI responses grounded in the user’s data?**  
The backend first selects a workspace the user belongs to, then constructs a bounded context from that workspace’s KPI data and selected dataset metadata/sample rows. The system prompt instructs the model not to invent values. This constrains context, but generated answers should still be treated as model output rather than authoritative calculations.

**4. Why call Groq from Django instead of the browser?**  
The API key remains server-side, workspace access is checked before context is assembled, and the backend centralizes model configuration and provider error handling. The browser only calls the application’s authenticated AI endpoints.

**5. How are exports handled safely?**  
The report API generates PDF, CSV, and XLSX responses from authorized report/dataset content. Spreadsheet-like values are escaped to reduce formula-injection risk, and export actions are recorded in the audit log.

**6. What would you improve next?**  
I would add integration coverage for each tenant-scoped API, make business metrics explicitly configurable instead of inferring semantics from column types, and implement report scheduling/sharing and billing only with appropriate delivery, authorization, and operational controls.

## Repository map

```text
InsightsStack-Saas-platform/
├── backend/
│   ├── ai_insights/       # Workspace-scoped AI query and insights
│   ├── analytics/         # Dataset-derived analytics APIs
│   ├── audit/             # Audit events and API
│   ├── authentication/    # Registration, JWT, password, and MFA endpoints
│   ├── config/            # Django settings, URLs, and Celery configuration
│   ├── dashboards/        # Persisted dashboards and widgets
│   ├── datasets/          # Upload, parsing, dataset and row persistence
│   ├── organizations/     # Organization management
│   ├── reports/           # Report persistence and PDF/CSV/XLSX exports
│   ├── subscriptions/     # Subscription plan API
│   ├── users/             # User and profile APIs
│   └── workspaces/        # Workspace and membership APIs
└── frontend/
    └── src/
        ├── components/    # Shared UI
        ├── pages/         # Landing, auth, and application pages
        ├── services/      # Backend API client/services
        └── store/         # Client-side application state
```
