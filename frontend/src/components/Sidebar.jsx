import { NavLink, useNavigate } from "react-router-dom";

function Sidebar() {

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="sidebar">

      <h2>🚀 Complaint AI</h2>

      {user && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", marginBottom: "20px" }}>
            <div style={{ width: "35px", height: "35px", borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
              {user.name?.charAt(0) || "U"}
            </div>
            <div>
              <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{user.name}</div>
              <div style={{ fontSize: "0.75rem", color: "gray" }}>{user.role}</div>
            </div>
          </div>

          <NavLink to="/profile">👤 Profile</NavLink>
          <NavLink to="/dashboard">📊 Dashboard</NavLink>

          {user.role === "USER" && (
            <>
              <NavLink to="/complaints">📄 My Complaints</NavLink>
              <NavLink to="/add">➕ Add Complaint</NavLink>
            </>
          )}

          {user.role === "ADMIN" && (
            <>
              <NavLink to="/admin">🛠 Admin Panel</NavLink>
              <NavLink to="/complaints">📋 All Complaints</NavLink>
            </>
          )}

          <button onClick={handleLogout} className="secondary-btn" style={{marginTop: "30px"}}>Logout</button>
        </>
      )}

    </div>
  );
}

export default Sidebar;