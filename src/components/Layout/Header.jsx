import * as React from "react";
import { AppBar, Toolbar, Typography, IconButton } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import LogoutIcon from "@mui/icons-material/Logout";
import Notifications from "../Notifications";

export default function Header() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) alert("Đăng xuất thất bại.");
  };

  return (
    <AppBar
      position="static"
      sx={{ bgcolor: "#f8f9fa", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <img
            src="/logo_uit.png"
            alt="Logo UIT"
            style={{ height: "40px", marginRight: "1rem" }}
          />
          <Typography variant="h6" component="div" color="primary">
            Hệ thống Quản Lý Đề Tài
          </Typography>
        </div>
        {user && (
          <>
            <Notifications />
            <IconButton
              color="primary"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogoutIcon />
            </IconButton>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
