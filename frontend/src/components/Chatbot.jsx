import { useState, useEffect, useRef } from "react";
import API from "../services/api";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const QUICK_ACTIONS = [
  { label: "📶 WiFi Issue", text: "The WiFi is not working in my hostel room" },
  { label: "💧 Water Problem", text: "There is no water supply in Block B" },
  { label: "⚡ Electricity", text: "Frequent power cuts in the lab building" },
  { label: "🍽️ Food Quality", text: "The food quality in mess is very poor today" },
  { label: "📚 Academic", text: "I have a concern about my exam marks" },
  { label: "🧹 Sanitation", text: "The washroom on 3rd floor is very dirty" },
];

function Chatbot() {
  const user = JSON.parse(localStorage.getItem("user"));
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      text: `Greetings ${user?.name || "there"}! 👋\n\nI am your AI Assistant.\n\nI can help you:\n• 📝 Register formal grievances\n• 🏢 Categorize issues to the right department\n• 📸 Guide you on adding multimedia proof\n• ⭐ Track status and provide satisfaction ratings\n\nPlease describe your issue below.`,
      bot: true,
      time: new Date()
    }
  ]);

  const [draftComplaint, setDraftComplaint] = useState(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addBot = (text) =>
    setMessages(prev => [...prev, { text, bot: true, time: new Date() }]);

  const addUser = (text) =>
    setMessages(prev => [...prev, { text, bot: false, time: new Date() }]);

  const [isConnected, setIsConnected] = useState(false);

  // WebSocket realtime updates
  useEffect(() => {
    let stompClient = null;
    let socket = null;

    try {
      socket = new SockJS("http://localhost:8081/ws");
      stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 10000, // Retry every 10 seconds
        onConnect: () => {
          setIsConnected(true);
          console.log("WebSocket connected ✅");
          stompClient.subscribe("/topic/complaints", msg => {
            const c = JSON.parse(msg.body);
            addBot(`📢 Realtime Update!\nComplaint #${c.id} → Status: ${c.status}\nTitle: "${c.title}"`);
          });
        },
        onDisconnect: () => {
          setIsConnected(false);
          console.log("WebSocket disconnected ❌");
        },
        onStompError: (frame) => {
          console.error("Broker reported error: " + frame.headers["message"]);
          console.error("Additional details: " + frame.body);
        },
        onWebSocketError: (event) => {
          console.warn("WebSocket Connection Failed: Ensure Backend is running on port 8081.");
          setIsConnected(false);
        }
      });
      stompClient.activate();
    } catch (e) {
      console.warn("WebSocket initialization failed");
    }

    return () => {
      if (stompClient) stompClient.deactivate();
    };
  }, []);

  const sendMessage = (overrideText) => {
    const text = overrideText || input;
    if (!text.trim()) return;

    const lower = text.toLowerCase();
    addUser(text);
    setInput("");
    setShowQuickActions(false);
    setIsTyping(true);

    // YES confirmation flow
    if ((lower === "yes" || lower === "y") && draftComplaint) {
      API.post("/complaints", draftComplaint)
        .then(res => {
          setIsTyping(false);
          addBot(
            `✅ Complaint Registered Successfully!\n\n` +
            `🎫 Ticket ID: #${res.data.id}\n` +
            `📂 Category: ${res.data.category}\n` +
            `🏢 Department: ${res.data.department}\n` +
            `⚡ Priority: ${res.data.priority}\n` +
            `🧠 Sentiment: ${res.data.sentiment}\n\n` +
            `You can track it from the "My Complaints" page. What else can I help with?`
          );
        })
        .catch(() => {
          setIsTyping(false);
          addBot("❌ Failed to register. Please try again or use the Add Complaint page.");
        });
      setDraftComplaint(null);
      return;
    }

    // NO cancellation
    if ((lower === "no" || lower === "cancel") && draftComplaint) {
      setIsTyping(false);
      setDraftComplaint(null);
      addBot("No problem! 😊 Your complaint draft has been discarded. Feel free to describe another issue anytime.");
      return;
    }

    // AI conversational reply via Groq
    API.post("/complaints/chat-ai", { message: text })
      .then(res => {
        const aiReply = res.data;
        setIsTyping(false);
        addBot(aiReply);

        // Silently analyze complaint structure
        API.post("/complaints/analyze", { description: text })
          .then(r => {
            const ai = r.data;
            setDraftComplaint({
              title: text.substring(0, 50),
              description: text,
              userId: user.id
            });
            addBot(
              `📌 Ready to Register!\n\n` +
              `📂 Category: ${ai.category}\n` +
              `🏢 Department: ${ai.department}\n` +
              `⚡ Priority: ${ai.priority}\n\n` +
              `Type YES to submit or NO to cancel.`
            );
          })
          .catch(() => {});
      })
      .catch(() => {
        setIsTyping(false);
        addBot("⚠️ AI service is temporarily unavailable. Please try again in a moment.");
      });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbot-container">
      {open && (
        <div className="chatbot-window" style={{
          width: "400px",
          height: "560px",
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.4)"
        }}>
          {/* Header */}
          <div className="chatbot-header" style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isConnected ? "#22c55e" : "#ef4444",
                boxShadow: isConnected ? "0 0 6px #22c55e" : "0 0 6px #ef4444",
                animation: "pulse 2s infinite"
              }} />
              <div>
                <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>AI Assistant</div>
                <div style={{ fontSize: "0.7rem", color: "#888" }}>
                  {isConnected ? "Online • Connected" : "Offline • Ensure Backend is running"}
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: "transparent",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "1.2rem"
            }}>✕</button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages" style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: "12px" }}>
                <div className={m.bot ? "msg-bot fade-in" : "msg-user fade-in"}
                  style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {m.text}
                </div>
                <div style={{
                  fontSize: "0.65rem",
                  color: "#555",
                  marginTop: "4px",
                  textAlign: m.bot ? "left" : "right"
                }}>
                  {formatTime(m.time)}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="msg-bot fade-in" style={{
                display: "flex",
                gap: "4px",
                padding: "12px 16px",
                width: "fit-content"
              }}>
                <span style={{ animation: "blink 1.4s infinite 0s", fontSize: "1.2rem" }}>•</span>
                <span style={{ animation: "blink 1.4s infinite 0.2s", fontSize: "1.2rem" }}>•</span>
                <span style={{ animation: "blink 1.4s infinite 0.4s", fontSize: "1.2rem" }}>•</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {showQuickActions && (
            <div style={{
              padding: "8px 12px",
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              borderTop: "1px solid rgba(255,255,255,0.06)"
            }}>
              {QUICK_ACTIONS.map((qa, i) => (
                <button key={i} onClick={() => sendMessage(qa.text)} style={{
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "#a5b4fc",
                  padding: "5px 10px",
                  borderRadius: "20px",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}>
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="chatbot-input" style={{
            display: "flex",
            gap: "8px",
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={draftComplaint ? "Type YES or NO..." : "Describe your issue..."}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={isTyping}
              style={{ flex: 1 }}
            />
            <button onClick={() => sendMessage()} disabled={isTyping}>
              {isTyping ? "..." : "Send"}
            </button>
          </div>
        </div>
      )}

      <button
        className="chatbot-btn"
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "60px",
          height: "60px",
          fontSize: "1.5rem",
          zIndex: 1000,
        }}
      >
        {open ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default Chatbot;