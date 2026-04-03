import { useEffect, useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from "recharts";

function AdminPanel() {
  const [activeTab, setActiveTab] = useState("complaints");
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);

  const loadComplaints = () => {
    API.get("/complaints").then((res) => setComplaints(res.data));
  };
  const loadUsers = () => {
    API.get("/users/all").then((res) => setUsers(res.data));
  };

  useEffect(() => {
    loadComplaints();
    loadUsers();
  }, []);

  const changeStatus = (id, currentStatus, newStatus) => {
    if (newStatus === currentStatus) return;

    let note = "";
    if (newStatus === "CLOSED") {
      note = window.prompt("Enter an official Resolution Note (optional):") || "";
    }

    API.put(`/complaints/${id}?status=${newStatus}&resolutionNote=${encodeURIComponent(note)}`)
      .then(() => {
        toast.success(`Complaint marked as ${newStatus}`);
        loadComplaints();
      });
  };

  const deleteComplaint = (id) => {
    if (window.confirm("WARNING: Are you sure you want to delete this ticket?")) {
      API.delete(`/complaints/${id}`).then(() => {
        toast.success("Ticket deleted");
        loadComplaints();
      });
    }
  };

  const exportCSV = () => {
    if (complaints.length === 0) return toast.error("No data to export");
    const headers = ["ID", "Title", "Category", "Department", "Priority", "Sentiment", "Status", "Resolution Note"];
    const csvContent = [
      headers.join(","),
      ...complaints.map(c => [
        c.id, `"${c.title}"`, c.category, c.department, c.priority, c.sentiment || "NEUTRAL", c.status, `"${c.resolutionNote || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "complaints_export.csv";
    a.click();
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>🛡️ Enterprise Admin Dashboard</h2>
          <div>
            <button className={activeTab === "complaints" ? "primary-btn" : "secondary-btn"} onClick={() => setActiveTab("complaints")} style={{ marginRight: "10px" }}>
              Complaints Data
            </button>
            <button className={activeTab === "users" ? "primary-btn" : "secondary-btn"} onClick={() => setActiveTab("users")}>
              User Roster
            </button>
          </div>
        </div>

        {activeTab === "complaints" && (
          <>
            {/* Mini Stats Visualization */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
              {[
                { label: "Total", value: complaints.length, color: "#6366f1" },
                { label: "Open", value: complaints.filter(c => c.status === "OPEN").length, color: "#facc15" },
                { label: "In Progress", value: complaints.filter(c => c.status === "IN_PROGRESS").length, color: "#fb923c" },
                { label: "Resolved", value: complaints.filter(c => c.status === "CLOSED").length, color: "#4ade80" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "14px", borderTop: `3px solid ${s.color}`, textAlign: "center" }}>
                  <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "0.75rem", color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Department & Sentiment Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "15px" }}>
                <p style={{ color: "#888", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: "10px" }}>Dept. Breakdown</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={Object.entries(
                    complaints.reduce((acc, c) => { const d = c.department || "General"; acc[d] = (acc[d] || 0) + 1; return acc; }, {})
                  ).map(([name, value]) => ({ name, value }))} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="name" stroke="#555" fontSize={11} />
                    <YAxis stroke="#555" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff", fontSize: "0.8rem" }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "15px" }}>
                <p style={{ color: "#888", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: 1, marginBottom: "10px" }}>Sentiment Map</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={[
                    { name: "Neutral", value: complaints.filter(c => c.sentiment === "NEUTRAL" || !c.sentiment).length },
                    { name: "Critical", value: complaints.filter(c => c.sentiment === "CRITICAL").length },
                    { name: "Frustrated", value: complaints.filter(c => c.sentiment === "FRUSTRATED").length },
                  ]} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis dataKey="name" stroke="#555" fontSize={11} />
                    <YAxis stroke="#555" allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff", fontSize: "0.8rem" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill="#6b7280" />
                      <Cell fill="#f97316" />
                      <Cell fill="#dc2626" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <button onClick={exportCSV} className="secondary-btn" style={{ marginBottom: "20px" }}>📥 Export CSV</button>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    <th style={{ padding: "10px" }}>ID</th>
                    <th style={{ padding: "10px" }}>Title / Department</th>
                    <th style={{ padding: "10px" }}>Priority & Sentiment</th>
                    <th style={{ padding: "10px" }}>Status</th>
                    <th style={{ padding: "10px" }}>Resolution Note</th>
                    <th style={{ padding: "10px" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id} style={{ borderBottom: "1px solid #222" }}>
                      <td style={{ padding: "10px" }}>{c.id}</td>
                      <td style={{ padding: "10px" }}>
                        <strong>{c.title}</strong><br/>
                        <span style={{ fontSize: "0.8rem", color: "gray" }}>{c.department || "General"}</span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", gap: "5px", flexDirection: "column" }}>
                          <span className={`badge badge-${c.priority?.toLowerCase()}`}>{c.priority}</span>
                          {c.sentiment && (
                            <span className={`badge`} style={{ background: c.sentiment === "FRUSTRATED" || c.sentiment === "CRITICAL" ? "#dc2626" : "#4b5563" }}>
                              {c.sentiment}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "10px" }}>
                        <select value={c.status} onChange={(e) => changeStatus(c.id, c.status, e.target.value)} style={{ background: "transparent", color: "white", padding: "5px" }}>
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                      <td style={{ padding: "10px", fontSize: "0.85rem", color: "lightgreen" }}>{c.resolutionNote || "-"}</td>
                      <td style={{ padding: "10px" }}>
                        <button style={{ background: "transparent", border: "1px solid #dc2626", color: "#dc2626", padding: "5px 10px", cursor: "pointer", borderRadius: "5px" }} onClick={() => deleteComplaint(c.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "users" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={{ padding: "10px" }}>User ID</th>
                  <th style={{ padding: "10px" }}>Name</th>
                  <th style={{ padding: "10px" }}>Email</th>
                  <th style={{ padding: "10px" }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "10px" }}>{u.id}</td>
                    <td style={{ padding: "10px", fontWeight: "bold" }}>{u.name}</td>
                    <td style={{ padding: "10px", color: "gray" }}>{u.email}</td>
                    <td style={{ padding: "10px" }}><span className="badge">{u.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;