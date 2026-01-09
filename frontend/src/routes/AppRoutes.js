import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CitizenRegister from "../pages/auth/CitizenRegister";
import CollectorRegister from "../pages/auth/CollectorRegister";
import CitizenLogin from "../pages/auth/CitizenLogin";
import CitizenDashboard from "../pages/Citizen/CitizenDashboard";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import WasteType from "../pages/admin/wastetype/WasteType";

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
      <Route path="/admin/waste-types" element={<WasteType />} />

      {/* Collector */}
      <Route path="/register/collector" element={<CollectorRegister />} />

      {/* About */}
      <Route path="/about" element={<HomePage />} />
    </Routes>
  );
}

export default AppRoutes;
