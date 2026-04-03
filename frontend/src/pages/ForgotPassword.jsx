import { useState } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

function ForgotPassword(){

  const[email,setEmail] = useState("");
  const[newPassword,setNewPassword] = useState("");

  const handleReset = () => {

    API.post(
      "/users/forgot-password?email=" + email +
      "&newPassword=" + newPassword
    )
    .then(res => toast.success(res.data))
    .catch(()=>toast.error("Reset failed"));
  };

  return(
    <div>
      <h2>Reset Password</h2>

      <input
        placeholder="Enter Email"
        onChange={(e)=>setEmail(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="New Password"
        onChange={(e)=>setNewPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleReset}>
        Update Password
      </button>
    </div>
  );
}

export default ForgotPassword;