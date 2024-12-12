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
  CircularProgress,
  Button,
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

const PAGE_SIZE = 10;

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(
    async (page) => {
      setLoading(true);
      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const {
          data,
          error: fetchError,
          count,
        } = await supabase
          .from("notifications")
          .select("*", { count: "estimated" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(from, to);

        if (fetchError) throw fetchError;

        if (error) {
          setError(error.message);
        } else {
          setError(null);
          setNotifications((prevNotifications) =>
            page === 1 ? data : [...prevNotifications, ...data]
          );
          setHasMore(data.length === PAGE_SIZE);
          setPage(page + 1);
        }
      } catch (error) {
        setError(error.message);
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (user) {
      fetchNotifications(1);

      const notificationListener = supabase
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
            fetchNotifications(1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(notificationListener);
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
      setNotifications(
        notifications.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
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

  const handleLoadMore = () => {
    fetchNotifications(page);
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
        PaperProps={{ style: { maxHeight: "400px", width: "350px" } }}
      >
        {loading ? (
          <MenuItem>
            <CircularProgress size={24} />
          </MenuItem>
        ) : error ? (
          <MenuItem>
            <Typography color="error">Lỗi: {error}</Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem>Không có thông báo mới.</MenuItem>
        ) : (
          notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <MenuItem
                onClick={() => handleMarkAsRead(notification.id)}
                sx={{
                  whiteSpace: "normal",
                  backgroundColor: notification.is_read
                    ? "transparent"
                    : "#e3f2fd",
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    {notification.type === "swap_request" && <SwapHorizIcon />}
                    {notification.type === "swap_approved" && (
                      <CheckCircleIcon />
                    )}
                    {notification.type === "swap_rejected" && <CancelIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ wordWrap: "break-word" }}>
                      {notification.message}
                    </Typography>
                  }
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
              <Divider />
            </React.Fragment>
          ))
        )}
        {hasMore && (
          <MenuItem onClick={handleLoadMore} sx={{ justifyContent: "center" }}>
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              <Button>Xem thêm</Button>
            )}
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default Notifications;
