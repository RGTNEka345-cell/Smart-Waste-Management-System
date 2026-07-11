export const getMessageSession = (role) => {
  const normalized = String(role || "").toLowerCase();

  if (normalized === "admin") {
    const admin = JSON.parse(localStorage.getItem("admin") || "null");
    return {
      role: "ADMIN",
      userId: admin?.admin_id || localStorage.getItem("adminId"),
      token: localStorage.getItem("adminToken")
    };
  }

  if (normalized === "collector") {
    const collector = JSON.parse(
      localStorage.getItem("collectorData") ||
        localStorage.getItem("collector") ||
        "null"
    );
    return {
      role: "COLLECTOR",
      userId: collector?.collector_id || collector?.id,
      token: localStorage.getItem("collectorToken")
    };
  }

  const citizen = JSON.parse(localStorage.getItem("citizen") || "null");
  return {
    role: "CITIZEN",
    userId: citizen?.id || citizen?.userId,
    token: localStorage.getItem("citizenToken")
  };
};

export const getMessageHeaders = (role) => {
  const session = getMessageSession(role);
  const headers = {
    "x-user-role": session.role,
    "x-user-id": session.userId
  };

  if (session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  return headers;
};
