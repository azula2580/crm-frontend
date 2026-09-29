import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg"

export default function Topbar({ subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  return (
    <div className="topbar">
      <div className="brand">
        <img src={logo} alt="Эрүүл мэндийн хөгжлийн төв" className="mark" />CRM систем
      </div>
      <div className="who">
        <span>
          <b>{user?.name}</b> <span className="email"> - {subtitle}</span>
        </span>
        <button className="logout" onClick={handleLogout}>Гарах</button>
      </div>
    </div>
  );
}
