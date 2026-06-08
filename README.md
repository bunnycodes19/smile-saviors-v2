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

## End-to-End Running Guide

Follow these steps to run the application locally:

### Step 1: Start the Database Container
Launch the PostgreSQL service inside the root directory:
```bash
docker compose up -d
```
*Note: The database is configured to run on port `5433` to prevent conflicts with other projects running PostgreSQL on standard port `5432`.*

---

### Step 2: Start the NestJS Backend API
1. Navigate into the `backend` folder:
   ```bash
   cd backend
   ```
2. Install packages (already installed in workspace):
   ```bash
   npm install
   ```
3. Boot the backend server:
   ```bash
   npm run start
   ```
   *The server runs on `http://localhost:3000`. On boot, the server will check the database and automatically seed all demo clinic data if empty.*

---

### Step 3: Start the React Frontend App
1. Open a new terminal session and navigate into the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install packages (already installed in workspace):
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```
   *The client app runs on `http://localhost:5173`.*

---

## Demo Credentials & Roles

Once you load `http://localhost:5173`, use these pre-seeded accounts to experience **Role-Based Access Control (RBAC)** (Password is **`password`** for all):

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
