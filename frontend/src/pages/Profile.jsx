import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || {});
  const [name, setName] = useState(user.name || "");

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/users/profile?id=${user.id}&name=${encodeURIComponent(name)}`)
      .then((res) => {
        toast.success("Profile Updated!");
        localStorage.setItem("user", JSON.stringify(res.data));
        setUser(res.data);
      })
      .catch(() => toast.error("Update failed"));
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <div className="card">
        <h2>👤 My Profile</h2>
        <p style={{ color: "gray", fontSize: "0.9rem" }}>Manage your personal details and account standing.</p>

        <form onSubmit={handleUpdate} style={{ marginTop: "20px" }}>
          <label>Email Address (Immutable)</label>
          <input value={user.email} disabled style={{ opacity: 0.5 }} />

          <label>Role</label>
          <input value={user.role} disabled style={{ opacity: 0.5, marginBottom: "20px" }} />

          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <button type="submit" style={{ marginTop: "15px" }}>Save Changes</button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
