import { useEffect, useState } from "react";
import API from "../services/api";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line
} from "recharts";

const COLORS = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#22c55e",
  OPEN: "#facc15",
  IN_PROGRESS: "#fb923c",
  CLOSED: "#4ade80",
  FRUSTRATED: "#dc2626",
  CRITICAL: "#f97316",
  NEUTRAL: "#6b7280",
};

const DEPT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(10,10,10,0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "10px 16px",
        color: "#fff",
        fontSize: "0.85rem"
      }}>
        <p style={{ fontWeight: "bold", marginBottom: "5px" }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ value, label, icon, color }) {
  return (
    <div className="metric-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: "2rem", marginBottom: "5px" }}>{icon}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-title">{label}</div>
    </div>
  );
}

function AdminDashboard({ complaints }) {
  const total = complaints.length;
  const open = complaints.filter(c => c.status === "OPEN").length;
  const progress = complaints.filter(c => c.status === "IN_PROGRESS").length;
  const closed = complaints.filter(c => c.status === "CLOSED").length;

  const ratedComplaints = complaints.filter(c => c.rating);
  const avgRating = ratedComplaints.length > 0 
    ? (ratedComplaints.reduce((acc, c) => acc + c.rating, 0) / ratedComplaints.length).toFixed(1)
    : "N/A";

  // Satisfaction Data (1-5 stars)
  const satisfactionData = [1, 2, 3, 4, 5].map(star => ({
    name: `${star} Star`,
    value: complaints.filter(c => c.rating === star).length
  })).filter(d => d.value > 0);

  const RATING_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e"];

  // Status Donut data
  const statusData = [
    { name: "Open", value: open },
    { name: "In Progress", value: progress },
    { name: "Closed", value: closed },
  ];

  // Priority Bar data
  const priorityData = [
    { name: "High", value: complaints.filter(c => c.priority === "HIGH").length },
    { name: "Medium", value: complaints.filter(c => c.priority === "MEDIUM").length },
    { name: "Low", value: complaints.filter(c => c.priority === "LOW").length },
  ];

  // Department breakdown
  const deptMap = {};
  complaints.forEach(c => {
    const dept = c.department || "General";
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

  // Sentiment Radar
  const sentimentData = [
    { subject: "Frustrated", value: complaints.filter(c => c.sentiment === "FRUSTRATED").length },
    { subject: "Critical", value: complaints.filter(c => c.sentiment === "CRITICAL").length },
    { subject: "Neutral", value: complaints.filter(c => c.sentiment === "NEUTRAL").length },
  ];

  // Resolution rate over last 7 days
  const now = new Date();
  const dailyMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    dailyMap[key] = { date: key, submitted: 0, resolved: 0 };
  }
  complaints.forEach(c => {
    if (c.createdDate) {
      const key = new Date(c.createdDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (dailyMap[key]) dailyMap[key].submitted += 1;
    }
    if (c.updatedDate && c.status === "CLOSED") {
      const key = new Date(c.updatedDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      if (dailyMap[key]) dailyMap[key].resolved += 1;
    }
  });
  const lineData = Object.values(dailyMap);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* KPI Cards */}
      <div className="dashboard-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <StatCard value={total} label="Total Tickets" icon="🎫" color="#6366f1" />
        <StatCard value={open} label="Open" icon="🔴" color="#facc15" />
        <StatCard value={progress} label="In Progress" icon="🔄" color="#fb923c" />
        <StatCard value={closed} label="Resolved" icon="✅" color="#4ade80" />
        <StatCard value={avgRating} label="Avg Rating" icon="⭐" color="#fbbf24" />
      </div>

      {/* Row 1: Status Donut + Satisfaction Donut */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>📊 Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                <Cell fill={COLORS.OPEN} />
                <Cell fill={COLORS.IN_PROGRESS} />
                <Cell fill={COLORS.CLOSED} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>🌟 Satisfaction Index (CSAT)</h3>
          {satisfactionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={satisfactionData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} label={({ name }) => name}>
                  {satisfactionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: "260px", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
              No ratings received yet.
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Priority Bar + Sentiment Radar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>⚡ Priority Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priorityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Complaints" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry, i) => (
                  <Cell key={i} fill={[COLORS.HIGH, COLORS.MEDIUM, COLORS.LOW][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>🧠 Sentiment Analysis</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={sentimentData}>
              <PolarGrid stroke="#1f1f1f" />
              <PolarAngleAxis dataKey="subject" stroke="#aaa" fontSize={12} />
              <PolarRadiusAxis stroke="#555" angle={30} domain={[0, Math.max(...sentimentData.map(d => d.value), 1)]} />
              <Radar name="Complaints" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Department + Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>🏛️ Department Allocation</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={deptData} dataKey="value" cx="50%" cy="50%" outerRadius={100} paddingAngle={3} label={({ name }) => name}>
                {deptData.map((_, i) => (
                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>📈 7-Day Complaint Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#4ade80" strokeWidth={2} dot={{ fill: "#4ade80", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 4: Recent Feedback */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>💬 Recent User Feedback</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "15px" }}>
          {complaints.filter(c => c.userFeedback).slice(0, 6).map((c, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", borderLeft: `3px solid ${RATING_COLORS[c.rating-1]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ fontWeight: "bold", fontSize: "0.85rem" }}>Tkt #{c.id}</span>
                <span style={{ color: "#fbbf24" }}>{"⭐".repeat(c.rating)}</span>
              </div>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#888", fontStyle: "italic" }}>"{c.userFeedback}"</p>
            </div>
          ))}
          {complaints.filter(c => c.userFeedback).length === 0 && <p style={{ color: "#555" }}>No feedback comments yet.</p>}
        </div>
      </div>
    </div>
  );
}

function UserDashboard({ user }) {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    API.get(`/complaints/my?userId=${user.id}`).then(res => setComplaints(res.data));
  }, []);

  const open = complaints.filter(c => c.status === "OPEN").length;
  const progress = complaints.filter(c => c.status === "IN_PROGRESS").length;
  const closed = complaints.filter(c => c.status === "CLOSED").length;

  const statusData = [
    { name: "Open", value: open },
    { name: "In Progress", value: progress },
    { name: "Closed", value: closed },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: "High", value: complaints.filter(c => c.priority === "HIGH").length },
    { name: "Medium", value: complaints.filter(c => c.priority === "MEDIUM").length },
    { name: "Low", value: complaints.filter(c => c.priority === "LOW").length },
  ].filter(d => d.value > 0);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      {/* Welcome Banner */}
      <div className="card" style={{ marginBottom: "20px", borderLeft: "4px solid #6366f1" }}>
        <h2>👋 Welcome back, {user.name}!</h2>
        <p style={{ color: "#888", marginTop: "5px" }}>Here's an overview of your complaint history and resolution status.</p>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "30px" }}>
        <StatCard value={complaints.length} label="Total Submitted" icon="📋" color="#6366f1" />
        <StatCard value={open} label="Awaiting" icon="⏳" color="#facc15" />
        <StatCard value={progress} label="In Progress" icon="🔄" color="#fb923c" />
        <StatCard value={closed} label="Resolved" icon="✅" color="#4ade80" />
      </div>

      {complaints.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "3rem" }}>📭</div>
          <h3 style={{ marginTop: "15px", color: "#888" }}>No complaints submitted yet</h3>
          <p style={{ color: "#555" }}>Use the sidebar to submit your first complaint and track its resolution.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div className="card">
            <h3 style={{ marginBottom: "20px" }}>📊 My Ticket Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusData.map((entry, index) => (
                    <Cell key={index} fill={[COLORS.OPEN, COLORS.IN_PROGRESS, COLORS.CLOSED][index % 3]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: "20px" }}>⚡ My Complaints by Priority</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Complaints" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={[COLORS.HIGH, COLORS.MEDIUM, COLORS.LOW][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [complaints, setComplaints] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (user.role === "ADMIN") {
      API.get("/complaints").then(res => setComplaints(res.data));
    }
  }, []);

  if (user.role === "ADMIN") {
    return <AdminDashboard complaints={complaints} />;
  }
  return <UserDashboard user={user} />;
}

export default Dashboard;