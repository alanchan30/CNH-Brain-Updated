import React from "react";
import logo from "@/assets/WhiteLogo.png";
import "./header.css";
import { useAuth } from "@/context/auth-context";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../constants";

interface HeaderProps {
  redirect: () => void;
  showButton: boolean;
  page: "upload" | "history" | "landing" | "results";
  fileName?:string;
}

export default function Header({ redirect, showButton, page, fileName }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const deleteFile = async() => {
    try {
      const res = await fetch(`${API_URL}/delete-temp-files/`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete temporary files");

      console.log("Temp files deleted");
    } catch (err) {
      console.error("Failed to delete files before redirecting:", err);
    }
  }

  const handleToUpload = async() => {
    if (page.startsWith("results") && fileName) {
      deleteFile()
    }
    navigate("/upload")
  }

  const handleLogout = async () => {
    if (page.startsWith("results") && fileName) {
      deleteFile()
    }
    await signOut();
    navigate("/login");
  };

  const handleToHistory = async () => {
    if (page.startsWith("results") && fileName) {
      deleteFile()
    }
    navigate("/history")
  }

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
              onClick={handleToUpload}
            >
              Upload
            </div>
            <div
              className={page === "history" ? "shaded" : "unshaded"}
              onClick={handleToHistory}
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
