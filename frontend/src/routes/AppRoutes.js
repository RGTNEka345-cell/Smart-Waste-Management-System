import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CitizenRegister from "../pages/auth/CitizenRegister";
import CollectorRegister from "../pages/auth/CollectorRegister";
import CitizenLogin from "../pages/auth/CitizenLogin";
import ForgotPassword from "../pages/Citizen/Citizen_Reset_Password/ForgotPassword";
import ResetPassword from "../pages/Citizen/Citizen_Reset_Password/ResetPassword";
import CitizenDashboard from "../pages/Citizen/CitizenDashboard";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import WasteType from "../pages/admin/wastetype/WasteType";
import AdminCollectorApproval from "../pages/admin/CollectorApproval";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Citizen */}
      <Route path="/register/citizen" element={<CitizenRegister />} />
      <Route path="/login/citizen" element={<CitizenLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/citizen/dashboard" element={<CitizenDashboard />} />

      {/* Admin */}
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/waste-types" element={<WasteType />} />
      <Route path="/admin/collector-approvals" element={<AdminCollectorApproval />} />
      
      {/* Collector */}
      <Route path="/register/collector" element={<CollectorRegister />} />

      {/* About */}
      <Route path="/about" element={<HomePage />} />
    </Routes>
  );
}

export default AppRoutes;
