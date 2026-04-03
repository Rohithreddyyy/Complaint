import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import API from "../services/api";

function ComplaintCard({ complaint, onUpdateStatus, onDelete }) {
  const [isOverdue, setIsOverdue] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [localComplaint, setLocalComplaint] = useState(complaint);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (localComplaint.createdDate && localComplaint.status !== "CLOSED") {
      const created = new Date(localComplaint.createdDate);
      const now = new Date();
      const diffTime = Math.abs(now - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays > 2) {
        setIsOverdue(true);
      }
    }
  }, [localComplaint]);

  const handleRate = () => {
    setIsSubmittingRating(true);
    API.put(`/complaints/${localComplaint.id}/rate?rating=${rating}&feedback=${encodeURIComponent(feedback)}`)
      .then(res => {
        setLocalComplaint(res.data);
        toast.success("Thank you for your feedback! ⭐");
        setShowRatingForm(false);
      })
      .catch(() => toast.error("Failed to submit rating."))
      .finally(() => setIsSubmittingRating(false));
  };

  const getSummary = () => {
    toast("AI Suggestion running...", { icon: "🧠" });
    API.post("/complaints/chat-ai", { message: "Provide a very short suggestion to resolve this issue: " + localComplaint.description })
      .then(res => {
        toast.success(res.data, { duration: 6000 });
      })
      .catch(() => {
        toast.error("AI service currently unavailable.");
      });
  };

  const sentimentColors = {
    FRUSTRATED: "#ef4444",
    CRITICAL: "#f97316",
    NEUTRAL: "#6b7280"
  };

  return (
    <div className={`card ${isOverdue ? "overdue-highlight" : ""}`} style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
      {isOverdue && (
        <span className="badge" style={{ position: "absolute", top: "15px", right: "15px", background: "#ef4444", color: "#fff", border: "none" }}>
          ⚠️ OVERDUE
        </span>
      )}
      
      <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, padding: 0 }}>{localComplaint.title}</h3>
        <span className={`badge badge-${localComplaint.priority?.toLowerCase()}`}>
          {localComplaint.priority}
        </span>
        <span className={`badge badge-${localComplaint.status?.toLowerCase().replace('_','-')}`}>
          {localComplaint.status?.replace('_', ' ')}
        </span>
        {localComplaint.sentiment && (
          <span style={{ fontSize: "0.65rem", padding: "2px 8px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${sentimentColors[localComplaint.sentiment] || "#555"}`, color: sentimentColors[localComplaint.sentiment] || "#fff" }}>
            {localComplaint.sentiment}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: "var(--color-text-secondary)", fontStyle: "italic", fontSize: "0.95rem" }}>{localComplaint.description}</p>
          
          <div style={{ display: "flex", gap: "20px", fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "5px", flexWrap: "wrap" }}>
            <span><b>Category:</b> {localComplaint.category || "Uncategorized"}</span>
            <span><b>Department:</b> {localComplaint.department || "General"}</span>
            {localComplaint.createdDate && (
              <span><b>Submitted:</b> {new Date(localComplaint.createdDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {localComplaint.attachmentUrl && (
          <div style={{ width: "120px", height: "80px", flexShrink: 0 }}>
            <img 
              src={localComplaint.attachmentUrl} 
              alt="attachment" 
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: "1px solid #333" }}
              onClick={() => window.open(localComplaint.attachmentUrl, '_blank')}
              title="Click to view full image"
            />
          </div>
        )}
      </div>

      {localComplaint.resolutionNote && (
        <div style={{ background: "rgba(34, 197, 94, 0.05)", padding: "12px", borderRadius: "8px", borderLeft: "4px solid #22c55e", marginTop: "10px" }}>
          <div style={{ fontWeight: "bold", fontSize: "0.8rem", color: "#22c55e", marginBottom: "5px" }}>✅ RESOLUTION</div>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#ccc" }}>{localComplaint.resolutionNote}</p>
        </div>
      )}

      {/* Rating Interface */}
      {localComplaint.status === "CLOSED" && (
        <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {localComplaint.rating ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "0.85rem", color: "#888" }}>Resolution Rating:</span>
              <span style={{ color: "#fbbf24", fontSize: "1.1rem" }}>{"⭐".repeat(localComplaint.rating)}</span>
              {localComplaint.userFeedback && <span style={{ fontSize: "0.85rem", color: "#666", fontStyle: "italic" }}>— "{localComplaint.userFeedback}"</span>}
            </div>
          ) : user.role === "USER" && !showRatingForm ? (
            <button className="secondary-btn" style={{ width: "auto", borderColor: "#fbbf24", color: "#fbbf24" }} onClick={() => setShowRatingForm(true)}>
              ⭐ How was the resolution? Rate us
            </button>
          ) : showRatingForm && (
            <div className="fade-in" style={{ background: "rgba(251, 191, 36, 0.03)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(251, 191, 36, 0.1)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontWeight: "bold", fontSize: "0.9rem" }}>Rate your experience</span>
                <div style={{ display: "flex", gap: "5px" }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <span 
                      key={s} 
                      onClick={() => setRating(s)} 
                      style={{ cursor: "pointer", fontSize: "1.3rem", filter: rating >= s ? "none" : "grayscale(100%)", opacity: rating >= s ? 1 : 0.4 }}
                    >⭐</span>
                  ))}
                </div>
              </div>
              <textarea 
                placeholder="Any additional feedback? (Optional)" 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                style={{ fontSize: "0.85rem", padding: "10px", minHeight: "60px", marginBottom: "10px" }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="primary-btn" 
                  style={{ width: "auto", background: "#fbbf24", borderColor: "#fbbf24", color: "#000", padding: "6px 20px" }}
                  onClick={handleRate}
                  disabled={isSubmittingRating}
                >
                  {isSubmittingRating ? "Submitting..." : "Submit Rating"}
                </button>
                <button className="secondary-btn" style={{ width: "auto" }} onClick={() => setShowRatingForm(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {!showRatingForm && (
        <div style={{ display: "flex", gap: "10px", marginTop: "5px", flexWrap: "wrap", alignItems: "center" }}>
          {user.role === "ADMIN" && (
            <>
              {localComplaint.status === "OPEN" && (
                <button className="secondary-btn" style={{ width: "auto" }} onClick={() => onUpdateStatus(localComplaint.id, "IN_PROGRESS")}>
                  Start Work
                </button>
              )}
              {localComplaint.status !== "CLOSED" && (
                <button className="secondary-btn" style={{ width: "auto" }} onClick={() => onUpdateStatus(localComplaint.id, "CLOSED")}>
                  Mark Closed
                </button>
              )}
              <button className="secondary-btn" style={{ width: "auto", border: "1px solid #ef4444", color: "#ef4444" }} onClick={() => onDelete(localComplaint.id)}>
                Delete
              </button>
            </>
          )}
          <button className="secondary-btn" style={{ width: "auto", borderColor: "#6366f1", color: "#818cf8" }} onClick={getSummary}>
            🧠 AI Suggest
          </button>
        </div>
      )}
    </div>
  );
}

export default ComplaintCard;