import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    API.post("/users/register", formData)
      .then(() => {
        toast.success("Registration Successful ✅");
        navigate("/");   // go to login
      })
      .catch((err) => {
        if (err.code === "ERR_NETWORK" || !err.response) {
          toast.error("Backend server is OFFLINE. Ensure port 8081 is running. ⚠️");
        } else {
          toast.error(err.response?.data || "Registration Failed ❌");
        }
      });
  };

  return (
    <div className="centerPage">

      <div className="card" style={{maxWidth:"400px", width:"100%"}}>

        <h2>Register</h2>

        <form onSubmit={handleSubmit}>

          <input
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />

          <button type="submit">Register</button>

        </form>

        <p style={{marginTop:"10px"}}>
          Already have an account?{" "}
          <span
            onClick={()=>navigate("/login")}
            style={{color:"#38bdf8", cursor:"pointer"}}
          >
            Login
          </span>
        </p>

      </div>

    </div>
  );
}

export default Register;