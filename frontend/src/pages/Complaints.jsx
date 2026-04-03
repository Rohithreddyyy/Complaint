import { useEffect, useState } from "react";
import API from "../services/api";
import ComplaintCard from "../components/ComplaintCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import toast from "react-hot-toast";

const STATUS_COLORS = { OPEN: "#facc15", IN_PROGRESS: "#fb923c", CLOSED: "#4ade80" };
const PRIORITY_COLORS = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e" };

function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [showChart, setShowChart] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = () => {
    if (user.role === "ADMIN") {
      API.get("/complaints/all").then(res => setComplaints(res.data));
    } else {
      API.get("/complaints/my?userId=" + user.id)
        .then(res => setComplaints(res.data));
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = (id, status) => {
    API.put(`/complaints/${id}?status=${status}`)
      .then(() => { toast.success("Status updated!"); fetchData(); });
  };

  const deleteComplaint = (id) => {
    if (window.confirm("Delete complaint?")) {
      API.delete(`/complaints/${id}`)
        .then(() => { toast.success("Deleted!"); fetchData(); });
    }
  };

  const filtered = complaints
    .filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
    .filter(c => statusFilter ? c.status === statusFilter : true)
    .filter(c => priorityFilter ? c.priority === priorityFilter : true);

  // Chart data
  const statusChartData = ["OPEN", "IN_PROGRESS", "CLOSED"].map(s => ({
    name: s.replace("_", " "),
    value: complaints.filter(c => c.status === s).length,
    status: s
  })).filter(d => d.value > 0);

  const priorityChartData = ["HIGH", "MEDIUM", "LOW"].map(p => ({
    name: p,
    value: complaints.filter(c => c.priority === p).length,
    priority: p
  })).filter(d => d.value > 0);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>

      {/* Summary Chart Strip */}
      {complaints.length > 0 && (
        <div className="card" style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3>📊 Complaint Overview</h3>
            <button className="secondary-btn" style={{ width: "auto", padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => setShowChart(v => !v)}>
              {showChart ? "Hide Charts" : "Show Charts"}
            </button>
          </div>
          {showChart && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: 1 }}>By Status</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis type="number" stroke="#555" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff" }} />
                    <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]}>
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={STATUS_COLORS[entry.status] || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p style={{ color: "#888", fontSize: "0.8rem", marginBottom: "8px", textTransform: "uppercase", letterSpacing: 1 }}>By Priority</p>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={priorityChartData} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                    <XAxis type="number" stroke="#555" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="#888" fontSize={12} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff" }} />
                    <Bar dataKey="value" name="Count" radius={[0, 6, 6, 0]}>
                      {priorityChartData.map((entry, i) => (
                        <Cell key={i} fill={PRIORITY_COLORS[entry.priority] || "#6366f1"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter Controls */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="🔍 Search complaints..."
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: "200px" }}
          />
          <select onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select onChange={(e) => setPriorityFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <span style={{ color: "#888", fontSize: "0.85rem", whiteSpace: "nowrap" }}>
            {filtered.length} of {complaints.length} tickets
          </span>
        </div>
      </div>

      {/* Complaint List */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "3rem" }}>📭</div>
          <h3 style={{ marginTop: "15px", color: "#888" }}>No complaints found</h3>
        </div>
      ) : (
        filtered.map(c => (
          <ComplaintCard
            key={c.id}
            complaint={c}
            onUpdateStatus={updateStatus}
            onDelete={deleteComplaint}
          />
        ))
      )}
    </div>
  );
}

export default Complaints;