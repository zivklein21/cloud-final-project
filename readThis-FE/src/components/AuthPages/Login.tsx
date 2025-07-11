// React + Packages
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import styles from "./Auth.module.css";
import readThis from "../../assets/readThis.svg";
import { AxiosError } from "axios";
import { loginUser, googleSignin } from "../../Utils/user_service";


const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const handlePasswordToggle = () => setShowPassword(!showPassword);
  const handleSignIn = async () => {
    try {
      setError("");
      console.log("Attempting login...");
      
      const data = await loginUser(username, password);
      console.log("Login successful:", data);

      
    
      navigate("/");
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
  
      console.error("Login failed:", axiosError);
  
      setError(axiosError.response?.data?.message || "Incorrect Username or password");
    }
  };

  const handleGoogleLogin = async (response: any) => {
    try {
      const userData = await googleSignin(response.credential);
      console.log("Google Login Success:", userData);
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  const googleErrorMessage = () => {
    console.log("Google sign-in error");
    setError("Google sign-in failed.");
  };

  return (
    <div className={styles.pageContainer}>
      <img src={readThis} className={styles.logo} />
      <div className={styles.authForm}>
        <h2 className={styles.formTitle}>Sign In</h2>
        
        {error && <p className={styles.error}>{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className={styles.formInput}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className={styles.passwordContainer}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.passwordInput}
          />
          <span className={styles.eyeIcon} onClick={handlePasswordToggle}>
            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </span>
        </div>

        <button
          className={styles.actionButton}
          onClick={handleSignIn}
        >
          Sign In
        </button>

        <GoogleLogin
          onSuccess={handleGoogleLogin} onError={googleErrorMessage}
        />

        <p className={styles.text}>
          Don't have an account?{" "}
          <Link to="/signup" className={styles.formToggle}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;