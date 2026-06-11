# Smart Waste Management System

Role-based waste management platform with three user roles:
- `Citizen`: create pickup requests, track status, report illegal dumping, earn eco points.
- `Collector`: accept jobs, complete pickups with photo evidence, manage active/history views.
- `Admin`: approve/reject requests, manage collectors, manage waste types, monitor activity.

## Tech Stack
- Frontend: React (Create React App), React Router, Axios
- Backend: Node.js, Express, MySQL (`mysql2`), JWT, Multer
- Other: Nodemailer (OTP/notifications), file uploads for photos

## Repository Structure
- `frontend/`: React app
- `backend/`: Express API + business logic
- `backend/uploads/`: uploaded images (profile, pickup, dumping, etc.)

## Prerequisites
- Node.js 18+
- npm 9+
- MySQL/MariaDB (XAMPP MySQL is also supported)

## Environment Setup

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=wastewise

JWT_SECRET=change_this_to_a_secure_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
MAIL_FALLBACK=false
```

Notes:
- Do not commit real credentials to Git.
- Ensure database `wastewise` exists and required tables are created.

## Install Dependencies

From project root:

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Run the Project

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd frontend
npm start
```

Default URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## Main Feature Areas

### Citizen
- Register/login with OTP and password reset
- Update profile with location/address
- Create pickup request (Normal/Special)
- Redirect to request details after submit
- Track request status timeline
- Cancel eligible requests
- Submit illegal dumping reports
- View notifications and eco tips

### Collector
- Register/login (OTP/password)
- View pickup offers and accept/reject
- Start/arrive/complete jobs with proof images
- View active job and history
- Handle illegal dumping offers/jobs

### Admin
- Admin login and profile management
- Approve/reject collector applications
- Waste type CRUD
- Pickup request queue and decision workflow
- Citizen listing/details
- Eco tips and site logo settings
- Illegal dumping queue management

## Key API Route Groups
- `backend/routes/citizenRoutes.js`
- `backend/routes/collectorRoutes.js`
- `backend/routes/adminRoutes.js`
- `backend/routes/pickupRequestRoutes.js`

All APIs are mounted under `/api` in backend server.

## Common Troubleshooting

### 1) `DB connectivity error: connect ETIMEDOUT`
- Verify MySQL is running on port `3306`.
- Confirm `.env` DB values are correct.
- Check DB service health/logs (XAMPP: `C:\xampp\mysql\data\mysql_error.log`).
- If InnoDB corruption appears, recover DB first before rerunning backend.

### 2) PowerShell blocks `npm` (`running scripts is disabled`)
Use:

```powershell
npm.cmd run dev
```

or adjust execution policy for your user.

### 3) `nodemon spawn EPERM` in restricted environments
Run backend directly:

```bash
node index.js
```

## Viva Quick Walkthrough
1. Explain 3-role architecture (Citizen, Collector, Admin).
2. Show pickup lifecycle: create -> admin approve -> collector accepts -> in progress -> completed.
3. Show illegal dumping lifecycle and photo proof flow.
4. Show notification + eco points behavior.
5. Discuss security basics: JWT, role-based middleware, file validation.

## Current Limitations
- Automated tests are minimal/not implemented across modules.
- Deployment scripts and CI pipeline are not yet standardized.
- Sensitive values should be moved to secure secret management in production.

