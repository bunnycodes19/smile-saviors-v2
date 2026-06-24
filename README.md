# Smile Saviours - Dental Clinic SaaS

Smile Saviours is a multi-tenant Dental Clinic Management SaaS built with **NestJS**, **React.js (Vite)**, **Drizzle ORM**, and **PostgreSQL**. The project is designed using **Clean Architecture** patterns.

---

## Repository Structure

```
smile_saviors/
├── backend/            # NestJS API Service (Core Domain, Application Use Cases, Drizzle Repositories)
├── frontend/           # React.js SPA (Vite, custom theme, interactive tooth chart, scheduler)
└── docker-compose.yml  # Local PostgreSQL 16 service definition
```

---

## Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher)
2. **npm** (v9 or higher)
3. **Docker Desktop** (running)

---

## Running the Application

There are two ways to run the application locally: using Docker Compose (simplest, production-like), or running services individually (ideal for development).

### Option A: Using Docker Compose (Single-Command Run)

This option boots the PostgreSQL database, NestJS API, and React frontend under an Nginx reverse-proxy on port `80`.

1. Ensure **Docker Desktop** is running.
2. In the root directory, run:
   ```bash
   docker compose up --build -d
   ```
3. Open your browser and navigate to `http://localhost`.
4. View service logs if needed:
   ```bash
   docker compose logs -f backend
   ```

### Option B: Running Services Individually (Development Mode)

If you wish to make changes with hot reloading:

#### Step 1: Start the Database Container
Launch the PostgreSQL service inside the root directory:
```bash
docker compose up postgres -d
```
*Note: The database runs on port `45433` locally to prevent conflicts with standard port `5432`.*

#### Step 2: Start the NestJS Backend API
1. Navigate into the `backend` folder:
   ```bash
   cd backend
   ```
2. Install packages and boot the server in dev mode:
   ```bash
   npm install
   npm run start:dev
   ```
   *The API runs on `http://localhost:43000` with auto-migration and seeding on startup.*

#### Step 3: Start the React Frontend App
1. Open a new terminal session and navigate into the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install packages and launch the development server:
   ```bash
   npm install
   npm run dev
   ```
   *The client app runs on `http://localhost:45173`.*

---

## Production Cloud Deployment Guide

To deploy Smile Saviours to a cloud environment:

### 1. Deploying on a Virtual Private Server (VPS) via Docker
A VPS deployment is the most straightforward way to use the existing `docker-compose.yml`:
1. Copy the project repository to your VPS (e.g. DigitalOcean, Linode, AWS EC2).
2. Install Docker and Docker Compose on the VPS.
3. Configure your production environment variables (e.g., secure `JWT_SECRET` and Postgres passwords) in the `docker-compose.yml` or an `.env` file.
4. Run:
   ```bash
   docker compose up --build -d
   ```
5. Point your domain DNS to the VPS IP address. The built-in Nginx proxy handles incoming traffic on port `80`.

### 2. Deploying on PaaS Providers (Railway, Render, etc.)
If you prefer serverless or managed container hosting:

#### Backend Service (NestJS + PostgreSQL)
- **Database**: Spin up a managed PostgreSQL instance on Render/Railway.
- **API Server**: Deploy the `backend` folder as a Web Service.
  - Set the Build Command/Dockerfile path to `backend/Dockerfile`.
  - Add Environment Variables: `DATABASE_URL` (pointing to your managed database connection string), `JWT_SECRET`, and `PORT` (usually `3000`).

#### Frontend Service (React SPA)
- **Static Hosting**: Deploy the `frontend` folder as a Static Site on Vercel, Netlify, or Render.
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables: Set `VITE_API_URL` to your backend service's public URL (e.g., `https://api.smilesaviours.com`).

---

## Demo Credentials & Roles

Once you load the app, use these pre-seeded accounts to experience **Role-Based Access Control (RBAC)** (Password is **`password`** for all):

| Role | Email | Permissions / Features |
| :--- | :--- | :--- |
| **Clinic Admin** | `admin@smile.com` | Full access to patients, scheduling calendar, clinical procedure logs, and invoice billing. |
| **Dentist** | `dentist@smile.com` | Clinical access. Can view patients, scheduled appointments, and **log new dental treatments** (with localized tooth charts). Restricted from configuration changes. |
| **Receptionist** | `receptionist@smile.com` | Front-desk access. Can register patient profiles, schedule bookings in the calendar grid, and **issue invoices/record payments**. Cannot log clinical treatments. |

---

## Clean Architecture Boundaries

- **Domain Layer**: Independent entities (`Patient`, `Appointment`, `Treatment`, `Invoice`) and ports (`IAuthRepository`, `IPatientsRepository`, etc.) defining business rules.
- **Application Layer**: Use Cases (e.g., creating appointment transactions, issuing invoices) and DTO validations.
- **Infrastructure Layer**: Framework implementations (Drizzle ORM, Passport-JWT strategies, global exception filters, database connection configurations).
- **Presentation Layer**: REST Controllers in NestJS and React Components in Vite.
