import React from "react";
import logo from "@/assets/WhiteLogo.png";
import "./header.css";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  redirect: () => void;
  showButton: boolean;
  page: "upload" | "history" | "landing";
}

export default function Header({ redirect, showButton, page }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="header">
      <div className="button-row">
        <div className="redirect" onClick={redirect}>
          <img
            className="logo"
            src={logo}
            alt="logo"
            width={240}
            height={156}
          />
        </div>
        {showButton ? (
          <>
            <div
              className={page === "upload" ? "shaded" : "unshaded"}
              onClick={() => navigate("/upload")}
            >
              Upload
            </div>
            <div
              className={page === "history" ? "shaded" : "unshaded"}
              onClick={() => navigate("/history")}
            >
              History
            </div>
          </>
        ) : (
          <></>
        )}
      </div>

      <button onClick={handleLogout} className="header-button">
        {user?.email || "Loading..."}
      </button>
    </div>
  );
}
