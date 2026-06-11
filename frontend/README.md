# Frontend - Smart Waste Management System

React client for Citizen, Collector, and Admin interfaces.

## Scripts
- `npm start`: run dev server on `http://localhost:3000`
- `npm run build`: production build
- `npm test`: run tests

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start frontend:
   ```bash
   npm start
   ```

Backend must be running on `http://localhost:5000` for API calls.

## Main Areas
- `src/pages/Citizen/`: citizen flows (pickup, profile, notifications, dumping)
- `src/pages/Collector/`: collector flows (offers, jobs, profile, dumping)
- `src/pages/admin/`: admin dashboards, approvals, queue handling
- `src/routes/AppRoutes.js`: application routing and role guards

## Notes
- This app currently uses direct API URLs (`http://localhost:5000/...`) in multiple pages.
- For viva/project presentation, refer to root project documentation:
  - `../README.md`

