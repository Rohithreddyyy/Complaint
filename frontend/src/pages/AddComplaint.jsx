import { useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function AddComplaint() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    attachmentUrl: ""
  });

  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
        toast.error("Image too large! Please use a smaller file (<1MB).");
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, attachmentUrl: reader.result }));
        setIsUploading(false);
        toast.success("Image attached! 📸");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "description" && value.length > 3) {
      API.post("/complaints/analyze", { description: value })
        .then(res => setAiSuggestion(res.data))
        .catch(() => setAiSuggestion(null));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));

    API.post("/complaints", {
      ...form,
      userId: user.id,
      category: aiSuggestion?.category || "General",
      department: aiSuggestion?.department || "General",
      priority: aiSuggestion?.priority || "LOW"
    })
      .then(() => {
        toast.success("Complaint Submitted Successfully ✅");
        navigate("/complaints");
      })
      .catch(() => {
        toast.error("Error submitting complaint ❌");
      });
  };

  return (
    <div className="mainContent">
      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h2>Submit a Complaint</h2>
        <p style={{ color: "#888", marginBottom: "20px" }}>Describe your issue and attach a photo if necessary.</p>

        <form onSubmit={handleSubmit}>
          <input
            name="title"
            placeholder="Complaint Title (e.g., Broken WiFi)"
            value={form.title}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Please provide details about the issue..."
            value={form.description}
            onChange={handleChange}
            style={{ minHeight: "120px" }}
            required
          />

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", color: "#888", fontSize: "0.85rem", marginBottom: "8px" }}>
              🖼️ Attach Proof / Photo (Optional)
            </label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              style={{ padding: "10px", background: "rgba(255,255,255,0.03)", border: "1px dashed #333" }}
            />
            {isUploading && <p style={{ fontSize: "0.8rem", color: "#6366f1" }}>Processing image...</p>}
            {form.attachmentUrl && (
              <div style={{ marginTop: "10px", position: "relative" }}>
                <img 
                  src={form.attachmentUrl} 
                  alt="Preview" 
                  style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "10px", border: "1px solid #333" }} 
                />
                <button 
                  type="button" 
                  onClick={() => setForm(prev => ({ ...prev, attachmentUrl: "" }))}
                  style={{ position: "absolute", top: "5px", right: "5px", background: "rgba(0,0,0,0.7)", borderRadius: "50%", width: "24px", height: "24px", padding: 0, fontSize: "12px" }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {aiSuggestion && (
            <div className="fade-in" style={{
              marginBottom: "20px",
              padding: "15px",
              background: "rgba(99, 102, 241, 0.05)",
              borderLeft: "4px solid #6366f1",
              borderRadius: "8px"
            }}>
              <div style={{ fontWeight: "bold", fontSize: "0.85rem", color: "#6366f1", marginBottom: "8px" }}>🤖 AI ANALYSIS</div>
              <div style={{ display: "flex", gap: "15px", fontSize: "0.8rem" }}>
                <span>📁 {aiSuggestion.category}</span>
                <span>🏢 {aiSuggestion.department}</span>
                <span style={{ color: aiSuggestion.priority === "HIGH" ? "#ef4444" : "#888" }}>⚡ {aiSuggestion.priority}</span>
              </div>
            </div>
          )}

          <button type="submit" className="primary-btn">Submit Case</button>
        </form>
      </div>
    </div>
  );
}

export default AddComplaint;