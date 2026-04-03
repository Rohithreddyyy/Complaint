import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Chatbot from "./components/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Complaints from "./pages/Complaints";
import AddComplaint from "./pages/AddComplaint";
import ForgotPassword from "./pages/ForgotPassword";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";

function Layout(){

  const location = useLocation();

  const hideLayout =
    location.pathname === "/" ||
    location.pathname === "/register" ||
    location.pathname === "/forgot";

  return (
    <div className="appContainer">

      {!hideLayout && <Sidebar />}

      <div className={hideLayout ? "centerPage" : "mainContent"}>
        <Routes>

          <Route path="/" element={<Register />} />  {/* FIRST PAGE */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />

          <Route path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />

          <Route path="/complaints"
            element={<ProtectedRoute><Complaints /></ProtectedRoute>}
          />

          <Route path="/add"
            element={<ProtectedRoute><AddComplaint /></ProtectedRoute>}
          />

          <Route path="/admin"
            element={<ProtectedRoute><AdminPanel /></ProtectedRoute>}
          />

          <Route path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />

        </Routes>
      </div>

      {!hideLayout && <Chatbot />}

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}