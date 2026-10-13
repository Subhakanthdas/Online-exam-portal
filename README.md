# ExamForge — Online Exam Portal

A local React + Vite + Express + SQLite exam portal.

## Quick start (Windows)

1. Install **Node.js 20 or 22 LTS** from https://nodejs.org/ if you do not already have it.
2. Extract this ZIP to a normal writable folder (for example, `Desktop\ExamForge`). Do not run it from inside the ZIP or a read-only folder.
3. Double-click **`START-EXAMFORGE.bat`**. On first run it installs dependencies, pins `better-sqlite3` to version `11.10.0`, creates a local `backend/.env` with a random JWT secret, initializes the SQLite database, seeds sample data, and starts both servers.
4. Open **http://127.0.0.1:5173** in your browser. Keep the terminal window open while using the portal.

The first dependency install requires an internet connection. The setup script stops and displays an error if a dependency install fails; it does not silently claim success.

## Demo accounts and sample data

A demo creator account is created automatically:

- Email: `creator@examforge.demo`
- Password: `CreatorDemo123!`

Use it to create exams and see the three sample exams. Sample exams are also visible to student accounts. Register a student account through the portal to take an exam and view results.

The demo credentials are for local evaluation only. Do not expose this development server to the public internet or reuse this password outside the demo.

## Features

- Student and Exam Creator registration options
- Login and authenticated API requests
- Six seeded subjects
- Three sample published exams (Java, Python, Data Structures), five multiple-choice questions each
- Creator dashboard to create and publish exams with answer choices and correct answers
- Exam access codes, exam taking, scoring, and results/submissions views
- SQLite persistence and additive legacy-schema migration
- API health endpoint at `http://127.0.0.1:3000/api/health`

## Troubleshooting

- **Port already in use:** close the older ExamForge terminal or stop the process using port 3000/5173, then rerun the batch file.
- **`better-sqlite3` install fails:** use Node.js 20 or 22 LTS (not an experimental/current release), ensure internet access, close terminals that may lock `node_modules`, and rerun `START-EXAMFORGE.bat`. The project pins version `11.10.0` to use compatible prebuilt binaries where available. If npm reports a Visual Studio C++ build-tools error, install Visual Studio Build Tools with the **Desktop development with C++** workload, then rerun.
- **Need a clean database:** stop the server first, then back up and remove `backend/data/examforge.sqlite` plus its `-shm` and `-wal` companions. Restart to recreate seeded demo data. This removes local accounts and exam attempts, so do not do it unless you want a reset.
- **Existing `.env`:** the startup script preserves it and never overwrites your JWT secret.

## Commands (optional)

From the extracted project folder:

```powershell
npm install --prefix backend
npm install --prefix frontend
npm install
npm run dev
```

Backend tests: `npm --prefix backend test`
Frontend production build: `npm --prefix frontend run build`
