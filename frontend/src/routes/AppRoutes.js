import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import CitizenRegister from "../pages/auth/CitizenRegister";
import CollectorRegister from "../pages/auth/CollectorRegister";
import CitizenLogin from "../pages/auth/CitizenLogin";
import CollectorLogin from "../pages/auth/CollectorLogin";
import ForgotPassword from "../pages/Citizen/Citizen_Reset_Password/ForgotPassword";
import ResetPassword from "../pages/Citizen/Citizen_Reset_Password/ResetPassword";
import CitizenDashboard from "../pages/Citizen/CitizenDashboard";
import AdminLogin from "../pages/auth/AdminLogin";
import AdminDashboard from "../pages/admin/AdminDashboard";
import WasteType from "../pages/admin/wastetype/WasteType";
import AdminCollectorApproval from "../pages/admin/CollectorData/CollectorApproval";
import CollectorApprovalHistory from "../pages/admin/CollectorData/CollectorApprovalHistory";
import CitizenProfileUpdate from "../pages/Citizen/Citizen_Profile/CitizenProfileUpdate";
import CreatePickupRequest from "../pages/Citizen/PickUp_Request/CreatePickupRequest";
import MyPickupRequests from "../pages/Citizen/PickUp_Request/MyPickupRequests";
import PickupRequestDetails from "../pages/Citizen/PickUp_Request/PickupRequestDetails";
import AdminPickupQueue from "../pages/admin/PickupRequests/AdminPickupQueue";
import AdminPickupRequestDetails from "../pages/admin/PickupRequests/AdminPickupRequestDetails";
import AdminCitizens from "../pages/admin/CitizenData/AdminCitizens";
import AdminNotifications from "../pages/admin/Notification/AdminNotifications";
import CollectorOffersInbox from "../pages/Collector/Pickup_Request/CollectorOffersInbox";
import CitizenNotifications from "../pages/Citizen/Notification/CitizenNotifications";
// Collector නව components import කරන්න
import CollectorForgotPassword from "../pages/Collector/Collector_Password/ForgotPassword";
import CollectorDashboard from "../pages/Collector/CollectorDashboard";
import CollectorActiveJob from "../pages/Collector/Pickup_Request/CollectorActiveJob";
import CollectorCompletePickup from "../pages/Collector/Pickup_Request/CollectorCompletePickup";
import CollectorPickupHistory from "../pages/Collector/Pickup_Request/CollectorPickupHistory";
import CollectorProfileUpdate from "../pages/Collector/Collector_Profile/CollectorProfileUpdate";
import AdminAddEcoTip from "../pages/admin/Eco_Tips/AdminAddEcoTip";
import AdminProfileUpdate from "../pages/admin/Admin_Profile/AdminProfileUpdate";
import CreateSubAdmin from "../pages/admin/Sub_Admin/CreateSubAdmin";
import AdminChangeLogo from "../pages/admin/AdminLogo/AdminChangeLogo";
import CitizenEcoTips from "../pages/Citizen/Eco_Tips/CitizenEcoTips";
import CollectorEcoTips from "../pages/Collector/Eco_Tips/CollectorEcoTips";
import CitizenCreateDumpReport from "../pages/Citizen/Illegal_Dumping/CitizenCreateDumpReport";
import CitizenMyDumpReports from "../pages/Citizen/Illegal_Dumping/CitizenMyDumpReports";
import AdminDumpingQueue from "../pages/admin/Illegal_Dumping/AdminDumpingQueue";
import AdminDumpingHistory from "../pages/admin/Illegal_Dumping/AdminDumpingHistory";
import CollectorDumpingOffers from "../pages/Collector/Illegal_Dumping/CollectorDumpingOffers";
import CollectorDumpingActive from "../pages/Collector/Illegal_Dumping/CollectorDumpingActive";
import DumpingHistory from "../pages/Collector/Illegal_Dumping/DumpingHistory";

const clearRoleSession = (role) => {
  if (role === "admin") {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("admin");
    localStorage.removeItem("adminId");
    localStorage.removeItem("adminSession");
  } else if (role === "citizen") {
    localStorage.removeItem("citizenToken");
    localStorage.removeItem("citizen");
    localStorage.removeItem("citizenSession");
  } else if (role === "collector") {
    localStorage.removeItem("collectorToken");
    localStorage.removeItem("collectorData");
    localStorage.removeItem("collector");
    localStorage.removeItem("collectorSession");
  }
};

const hasValidSession = (role) => {
  const tokenKey =
    role === "admin" ? "adminToken" : role === "citizen" ? "citizenToken" : "collectorToken";
  const dataKey =
    role === "admin" ? "admin" : role === "citizen" ? "citizen" : "collectorData";
  const sessionKey =
    role === "admin" ? "adminSession" : role === "citizen" ? "citizenSession" : "collectorSession";

  const token = localStorage.getItem(tokenKey);
  const data = localStorage.getItem(dataKey);
  if (!token || !data) return false;

  const forceKey =
    role === "admin"
      ? "adminForceReauth"
      : role === "citizen"
      ? "citizenForceReauth"
      : "collectorForceReauth";
  if (localStorage.getItem(forceKey) === "1") {
    clearRoleSession(role);
    return false;
  }

  const sessionRaw = localStorage.getItem(sessionKey);
  // Strict mode: session metadata must exist.
  if (!sessionRaw) {
    clearRoleSession(role);
    return false;
  }

  try {
    const session = JSON.parse(sessionRaw);
    if (session?.expiresAt && Date.now() > Number(session.expiresAt)) {
      clearRoleSession(role);
      return false;
    }
  } catch {
    clearRoleSession(role);
    return false;
  }

  return true;
};

const SessionWatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    const role = path.startsWith("/admin")
      ? "admin"
      : path.startsWith("/citizen")
      ? "citizen"
      : path.startsWith("/collector")
      ? "collector"
      : null;

    if (!role) return;

    const loginPath =
      role === "admin"
        ? "/login/admin"
        : role === "citizen"
        ? "/login/citizen"
        : "/login/collector";

    const check = () => {
      if (!hasValidSession(role)) {
        navigate(loginPath, { replace: true, state: { from: path } });
      }
    };

    check();
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [location.pathname, navigate]);

  return null;
};

const RequireRole = ({ role, children }) => {
  const location = useLocation();
  if (!hasValidSession(role)) {
    const loginPath = role === "admin" ? "/login/admin" : role === "collector" ? "/login/collector" : "/login/citizen";
    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />;
  }
  return children;
};


function AppRoutes() {
  return (
    <>
      <SessionWatcher />
      <Routes>
        <Route path="/" element={<HomePage />} />

      {/* Citizen - No changes */}
      <Route path="/register/citizen" element={<CitizenRegister />} />
      <Route path="/login/citizen" element={<CitizenLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/citizen/dashboard" element={<RequireRole role="citizen"><CitizenDashboard /></RequireRole>} />
      <Route path="/citizen/profile/update" element={<RequireRole role="citizen"><CitizenProfileUpdate /></RequireRole>} />
      <Route path="/citizen/pickup-request/create" element={<RequireRole role="citizen"><CreatePickupRequest /></RequireRole>}/>
      <Route path="/citizen/pickup/requests" element={<RequireRole role="citizen"><MyPickupRequests /></RequireRole>}/>
      <Route path="/citizen/pickup/:requestId" element={<RequireRole role="citizen"><PickupRequestDetails /></RequireRole>}/>
      <Route path="/citizen/notifications" element={<RequireRole role="citizen"><CitizenNotifications /></RequireRole>}/>
      <Route path="/citizen/eco-tips" element={<RequireRole role="citizen"><CitizenEcoTips /></RequireRole>} />
      <Route path="/citizen/illegal-dumping/create" element={<RequireRole role="citizen"><CitizenCreateDumpReport /></RequireRole>} />
      <Route path="/citizen/illegal-dumping/my" element={<RequireRole role="citizen"><CitizenMyDumpReports /></RequireRole>} />


      {/* Admin - No changes */}
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/admin/logo-settings" element={<RequireRole role="admin"><AdminChangeLogo /></RequireRole>} />
      <Route path="/admin/dashboard" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
      <Route path="/admin/waste-types" element={<RequireRole role="admin"><WasteType /></RequireRole>} />
      <Route path="/admin/collector-approvals" element={<RequireRole role="admin"><AdminCollectorApproval /></RequireRole>} />
      <Route path="/admin/approval-history" element={<RequireRole role="admin"><CollectorApprovalHistory /></RequireRole>} />
      <Route path="/admin/pickup-queue" element={<RequireRole role="admin"><AdminPickupQueue /></RequireRole>} />
      <Route path="/admin/pickup-requests" element={<RequireRole role="admin"><AdminPickupRequestDetails /></RequireRole>} />
      <Route path="/admin/pickup-requests/:id" element={<RequireRole role="admin"><AdminPickupRequestDetails /></RequireRole>} />
      <Route path="/admin/citizens" element={<RequireRole role="admin"><AdminCitizens /></RequireRole>} />
      <Route path="/admin/notifications" element={<RequireRole role="admin"><AdminNotifications /></RequireRole>} />
      <Route path="/admin/eco-tips/add" element={<RequireRole role="admin"><AdminAddEcoTip /></RequireRole>} />
      <Route path="/admin/illegal-dumping" element={<RequireRole role="admin"><AdminDumpingQueue /></RequireRole>} />
      <Route path="/admin/illegal-dumping/history" element={<RequireRole role="admin"><AdminDumpingHistory /></RequireRole>} />
      <Route path="/admin/profile/update" element={<RequireRole role="admin"><AdminProfileUpdate /></RequireRole>} />
      <Route path="/admin/sub-admins/create" element={<RequireRole role="admin"><CreateSubAdmin /></RequireRole>} />
      <Route path="/admin/website-settings" element={<RequireRole role="admin"><AdminChangeLogo /></RequireRole>} />


      {/* Collector - Updated with new routes */}
      <Route path="/register/collector" element={<CollectorRegister />} />
      <Route path="/login/collector" element={<CollectorLogin />} />
      <Route path="/collector/offers" element={<RequireRole role="collector"><CollectorOffersInbox /></RequireRole>} />
      
      {/* New Collector Routes */}
      <Route path="/collector/forgot-password" element={<CollectorForgotPassword />} />
      <Route path="/collector/dashboard" element={<RequireRole role="collector"><CollectorDashboard /></RequireRole>} />
      <Route path="/collector/job" element={<RequireRole role="collector"><CollectorActiveJob /></RequireRole>} />
      <Route path="/collector/job/:requestId/complete" element={<RequireRole role="collector"><CollectorCompletePickup /></RequireRole>} />
      <Route path="/collector/history" element={<RequireRole role="collector"><CollectorPickupHistory /></RequireRole>} />
      <Route path="/collector/profile/update" element={<RequireRole role="collector"><CollectorProfileUpdate /></RequireRole>} />
      
      <Route path="/collector/eco-tips" element={<RequireRole role="collector"><CollectorEcoTips /></RequireRole>} />
      <Route path="/collector/illegal-dumping/offers" element={<RequireRole role="collector"><CollectorDumpingOffers /></RequireRole>} />
      <Route path="/collector/illegal-dumping/active" element={<RequireRole role="collector"><CollectorDumpingActive /></RequireRole>} />
      <Route path="/collector/illegal-dumping/history" element={<RequireRole role="collector"><DumpingHistory /></RequireRole>} />

      {/* About */}
        <Route path="/about" element={<HomePage />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
