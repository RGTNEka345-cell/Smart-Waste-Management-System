import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CitizenRegister from "../pages/auth/CitizenRegister";
import CollectorRegister from "../pages/auth/CollectorRegister";
import CitizenLogin from "../pages/auth/CitizenLogin";
import CitizenDashboard from "../pages/Citizen/CitizenDashboard";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Citizen */}
      <Route path="/register/citizen" element={<CitizenRegister />} />
      <Route path="/login/citizen" element={<CitizenLogin />} />
      <Route path="/citizen/dashboard" element={<CitizenDashboard />} />

      {/* Admin */}
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      
      {/* Collector */}
      <Route path="/register/collector" element={<CollectorRegister />} />
    </Routes>
  );
}

export default AppRoutes;
