import { Routes, Route } from "react-router-dom";
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
import CollectorProfileUpdate from "../pages/Collector/Collector_Profile/CollectorProfileUpdate";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Citizen - No changes */}
      <Route path="/register/citizen" element={<CitizenRegister />} />
      <Route path="/login/citizen" element={<CitizenLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
      <Route path="/citizen/profile/update" element={<CitizenProfileUpdate />} />
      <Route path="/citizen/pickup-request/create" element={<CreatePickupRequest />}/>
      <Route path="/citizen/pickup/requests" element={<MyPickupRequests />}/>
      <Route path="/citizen/pickup/:requestId" element={<PickupRequestDetails />}/>
      <Route path="/citizen/notifications" element={<CitizenNotifications />}/>


      {/* Admin - No changes */}
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/waste-types" element={<WasteType />} />
      <Route path="/admin/collector-approvals" element={<AdminCollectorApproval />} />
      <Route path="/admin/approval-history" element={<CollectorApprovalHistory />} />
      <Route path="/admin/pickup-queue" element={<AdminPickupQueue />} />
      <Route path="/admin/pickup-requests" element={<AdminPickupRequestDetails />} />
      <Route path="/admin/pickup-requests/:id" element={<AdminPickupRequestDetails />} />
      <Route path="/admin/citizens" element={<AdminCitizens />} />
      <Route path="/admin/notifications" element={<AdminNotifications />} />


      {/* Collector - Updated with new routes */}
      <Route path="/register/collector" element={<CollectorRegister />} />
      <Route path="/login/collector" element={<CollectorLogin />} />
      <Route path="/collector/offers" element={<CollectorOffersInbox />} />
      
      {/* New Collector Routes */}
      <Route path="/collector/forgot-password" element={<CollectorForgotPassword />} />
      <Route path="/collector/dashboard" element={<CollectorDashboard />} />
      <Route path="/collector/job" element={<CollectorActiveJob />} />
      <Route path="/collector/job/:requestId/complete" element={<CollectorCompletePickup />} />
      <Route path="/collector/profile/update" element={<CollectorProfileUpdate />} />


      {/* About */}
      <Route path="/about" element={<HomePage />} />
    </Routes>
  );
}

export default AppRoutes;
