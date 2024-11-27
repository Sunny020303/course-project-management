import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export default function Header() {
  return (
    <AppBar
      position="static"
      sx={{ bgcolor: "#f8f9fa", boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)" }}
    >
      <Toolbar>
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
        {/* Thêm nút "Đăng xuất" */}
      </Toolbar>
    </AppBar>
  );
}
