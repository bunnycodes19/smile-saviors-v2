# Run Scripts & Copy-Paste Commands

This directory contains resources to help you run all components of the Smile Saviours Dental SaaS application locally in development mode.

## 1. Copy-Paste Command Files (For PowerShell / Terminal)
If you prefer to manually run commands in separate terminal sessions, you can open these text files, copy the contents, and paste them into PowerShell:

*   **[1_start_database.txt](file:///c:/Users/FSSAI/Desktop/bunnycodes/smile_saviors/scripts/1_start_database.txt)**: Commands to CD to root and start the PostgreSQL container.
*   **[2_start_backend.txt](file:///c:/Users/FSSAI/Desktop/bunnycodes/smile_saviors/scripts/2_start_backend.txt)**: Commands to CD to `backend/` and start the NestJS API.
*   **[3_start_frontend.txt](file:///c:/Users/FSSAI/Desktop/bunnycodes/smile_saviors/scripts/3_start_frontend.txt)**: Commands to CD to `frontend/` and start the Vite dev server.

## 2. Automation Scripts

*   **`run_dev.bat`** (Windows CMD/PowerShell)
   - Double-click to automatically start database and launch backend/frontend in new windows.
*   **`run_dev.sh`** (Bash / macOS / Linux / Git Bash)
   - Starts all services in the background under one terminal window.
