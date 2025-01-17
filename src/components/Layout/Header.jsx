import * as React from "react";
import { AppBar, Toolbar, Typography, IconButton, Menu, MenuItem } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Notifications from "../Notifications";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  //For user menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  //end

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      alert("Đăng xuất thất bại.");
      return false
    };

    return true
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
         
            <Typography variant="h6" component="div" color="primary" onClick={()=> navigate('/classes')}>
              Hệ thống Quản Lý Đề Tài
            </Typography>
          
        </div>
        {user && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <Notifications />

            <IconButton
              color="primary"
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleClick}
            >
              <AccountCircleIcon />
            </IconButton>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem onClick={() => {
                navigate(`/account/${user.id}`);
                handleClose();
              }}>Hồ sơ</MenuItem>
              {user.role === 'admin' && <MenuItem onClick={() => {
                navigate("/adminaccountmanagement");
                handleClose();
              }}>Quản lý tài khoản admin
              </MenuItem>}
              {user.role === 'admin' && <MenuItem onClick={() => {
                navigate("/adminclassmanagement");
                handleClose();
              }}>Quản lý lớp học
              </MenuItem>}
              <MenuItem onClick={() => {
                if (handleLogout()) {
                  navigate("/login");
                  console.log("dang xuat thanh cong")
                }
                handleClose();
              }}>Đăng xuất</MenuItem>
            </Menu>
          </div>
        )}
      </Toolbar>
    </AppBar>
  );
}
