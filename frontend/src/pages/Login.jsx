import { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";



let isGoogleInitialized = false;

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

const handleLogin = () => {

  if (!email || !password) {
    toast.error("Enter email & password");
    return;
  }

  API.post("/users/login", { email, password })
    .then(res => {
      console.log("LOGIN RESPONSE:", res.data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Login successful ✅");
      navigate("/dashboard");
    })
    .catch((err) => {
      console.log("LOGIN ERROR:", err);
      if (err.code === "ERR_NETWORK" || !err.response) {
        toast.error("Backend server is OFFLINE. Ensure port 8081 is running. ⚠️");
      } else {
        toast.error("Invalid Email or Password ❌");
      }
    });
};
  // ⭐ GOOGLE RESPONSE
  const handleGoogleResponse = (response) => {

    const decoded = JSON.parse(
      atob(response.credential.split('.')[1])
    );

    API.post("/users/google-login", {
      email: decoded.email,
      name: decoded.name
    })
    .then(res => {

      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      toast.success("Google Login Successful ✅");
      navigate("/dashboard");

    })
    .catch(() => {
      toast.error("Google Login Failed ❌");
    });
  };

  // ⭐ GOOGLE BUTTON INIT
  useEffect(() => {
    if (!window.google) return;

    // Use a global flag to ensure initialization ONLY happens once across mounts (Fix for React StrictMode)
    if (!isGoogleInitialized) {
      window.google.accounts.id.initialize({
        client_id: "512956986192-50a4seov98krl5ivq6gjhs1391kbgng2.apps.googleusercontent.com",
        callback: handleGoogleResponse
      });
      isGoogleInitialized = true;
    }

    window.google.accounts.id.renderButton(
      document.getElementById("googleBtn"),
      {
        theme: "outline",
        size: "large"
      }
    );

    return () => {
      // We don't Reset 'isGoogleInitialized' here because we don't need to re-initialize it
      // when the component re-mounts (as it stays in the browser session).
    };
  }, []);
  return (
  <div className="centerPage">

    <div className="card" style={{ maxWidth: "400px", width: "100%" }}>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Login
      </button>

      <p
        onClick={() => navigate("/forgot")}
        style={{ cursor: "pointer", color: "#38bdf8", marginTop: "10px" }}
      >
        Forgot Password?
      </p>

      {/* Google Button */}
      <div id="googleBtn" style={{ marginTop: "20px" }}></div>

<p style={{ marginTop: "10px" }}>
  Don’t have an account?{" "}
  <span
    onClick={() => navigate("/register")}
    style={{ color: "#38bdf8", cursor: "pointer" }}
  >
    Register
  </span>
</p>
    </div>

  </div>
);
}

export default Login;
