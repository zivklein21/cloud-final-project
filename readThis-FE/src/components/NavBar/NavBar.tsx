import { Link, useNavigate } from "react-router-dom";
import styles from "./NavBar.module.css";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import logo from "../../assets/readThis_purple.svg";
import { logoutUser } from "../../Utils/user_service";

const NavBar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("No refresh token found");
      await logoutUser(refreshToken);
      navigate("/signin"); // Redirect to the sign-in page after logout
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className={styles.navbar}>
      <Link to="/">
        <img src={logo} alt="Logo" className={styles.logo} />
      </Link>
      <Link to="/" className={styles.title}>
        <h1>ReadThis</h1>
      </Link>
      <>
        <Link to="/profile">
          <FaUser className={styles.userIcon} />
        </Link>
        <FaSignOutAlt className={styles.logoutIcon} onClick={handleLogout} />
      </>
    </nav>
  );
};

export default NavBar;
