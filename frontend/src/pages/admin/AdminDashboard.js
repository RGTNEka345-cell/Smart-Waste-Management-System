import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin) {
      setAdmin(JSON.parse(storedAdmin));
    }
  }, []);

  if (!admin) return <h3>Unauthorized</h3>;

  return (
    <div>
      <h2>Welcome {admin.fullname}</h2>
      <p>Admin ID: {admin.admin_id}</p>
      <p>Role: {admin.role}</p>
    </div>
  );
};

export default AdminDashboard;
