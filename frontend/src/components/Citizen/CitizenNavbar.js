import { Link } from "react-router-dom";
import "./CitizenNavbar.css";

const CitizenNavbar = ({ setActiveTab }) => {
  return (
    <nav className="citizen-navbar">
      {/* Left */}
      <div className="nav-left">
        <h2>WasteWise</h2>
      </div>

      {/* Center */}
      <ul className="nav-center">
        <li onClick={() => setActiveTab("dashboard")}>Dashboard</li>
        <li onClick={() => setActiveTab("request")}>Request Collection</li>
        <li onClick={() => setActiveTab("track")}>Track Requests</li>
        <li onClick={() => setActiveTab("history")}>History</li>
      </ul>

      {/* Right */}
      <div className="nav-right">
          <div className="profile-dropdown">
             <Link to="/citizen/profile/update" className="profile-link">
                 My Account ▾
           </Link>
          </div>
      </div>
    </nav>
  );
};

export default CitizenNavbar;
