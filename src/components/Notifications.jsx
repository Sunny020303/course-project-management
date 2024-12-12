import React, { useState, useEffect, useCallback } from "react";
import {
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Divider,
  Badge,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import moment from "moment";
import { useAuth } from "../context/AuthContext";
import supabase from "../services/supabaseClient";

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotifications(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const notificationsSubscription = supabase
        .channel("notifications")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationsSubscription);
      };
    }
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton color="primary" onClick={handleClick}>
        <Badge
          badgeContent={notifications.filter((n) => !n.is_read).length}
          color="error"
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {loading ? (
          <MenuItem>Đang tải...</MenuItem>
        ) : error ? (
          <MenuItem>Lỗi: {error}</MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem>Không có thông báo mới.</MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleMarkAsRead(notification.id)}
              sx={{
                backgroundColor: notification.is_read
                  ? "transparent"
                  : "#e3f2fd",
              }}
            >
              <ListItemAvatar>
                <Avatar>
                  {notification.type === "swap_request" && <SwapHorizIcon />}
                  {notification.type === "swap_approved" && <CheckCircleIcon />}
                  {notification.type === "swap_rejected" && <CancelIcon />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={notification.message}
                secondary={moment(notification.created_at).fromNow()}
              />
              {!notification.is_read && (
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="mark as read"
                    onClick={() => handleMarkAsRead(notification.id)}
                    size="small"
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}

export default Notifications;
