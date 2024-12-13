import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ListItemIcon,
  Avatar,
  Typography,
  Divider,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Button,
  Box,
  Grid,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SwapHoriz as SwapHorizIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
} from "@mui/icons-material";
import moment from "moment";
import { useAuth } from "../context/AuthContext";
import * as notificationService from "../services/notificationService";
import supabase from "../services/supabaseClient";
import { Howl } from "howler";

const PAGE_SIZE = 10;

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user } = useAuth();
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const sound = useMemo(
    () =>
      new Howl({
        src: ["/notification.mp3"],
      }),
    []
  );

  const playNotificationSound = useCallback(() => {
    sound.play();
  }, [sound]);

  const fetchNotifications = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const { data, error: fetchError } =
          await notificationService.fetchNotifications(
            user.id,
            page,
            PAGE_SIZE
          );

        if (fetchError) throw fetchError;

        if (error) {
          setError(error.message);
        } else {
          setError(null);
          setNotifications((prevNotifications) =>
            page === 1 ? data : [...prevNotifications, ...data]
          );
          if (data && data.length > 0) {
            const newNotifications = data.filter(
              (n) =>
                !n.is_read && !notifications.some((oldN) => oldN.id === n.id)
            );
            if (newNotifications.length > 0) {
              playNotificationSound();
            }
          }
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
    [user, error, notifications, playNotificationSound]
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
      const { error } = await notificationService.markNotificationAsRead(id);

      if (error) throw error;
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAsUnread = async (id) => {
    try {
      const { error } = await notificationService.markNotificationAsUnread(id);
      if (error) throw error;
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: false } : n))
      );
    } catch (error) {
      console.error("Error marking notification as unread:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await notificationService.markAllNotificationsAsRead(
        user.id
      );
      if (error) throw error;

      setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await notificationService.deleteNotification(id);
      if (error) throw error;

      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      const { error } = await notificationService.deleteAllNotifications(
        user.id
      );
      if (error) throw error;

      setNotifications([]);
    } catch (error) {
      console.error("Error deleting all notifications:", error);
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

  if (!user) {
    return null;
  }

  return (
    <>
      <IconButton
        color="primary"
        onClick={handleClick}
        aria-label="notifications"
        aria-controls="notification-menu"
        aria-haspopup="true"
      >
        <Badge
          badgeContent={
            open ? 0 : notifications.filter((n) => !n.is_read).length
          }
          color="error"
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="notification-menu"
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            width: "100%",
            p: 1,
          }}
        >
          <Button
            onClick={handleMarkAllAsRead}
            variant="outlined"
            color="primary"
          >
            Đánh dấu đã đọc
          </Button>
          <Button onClick={handleDeleteAll} variant="outlined" color="error">
            Xóa tất cả
          </Button>
        </Box>
        <Divider />
        {loading && page === 1 ? (
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
                  "&:hover": {
                    backgroundColor: notification.is_read
                      ? "action.hover"
                      : "#c8e6f8",
                  },
                  display: "flex",
                  alignItems: "flex-start",
                  paddingRight: "96px",
                  position: "relative",
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", marginRight: 2 }}>
                  <Avatar>
                    {notification.type === "swap_request" && <SwapHorizIcon />}
                    {notification.type === "swap_approved" && (
                      <CheckCircleIcon />
                    )}
                    {notification.type === "swap_rejected" && <CancelIcon />}
                  </Avatar>
                </ListItemIcon>
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                  <Typography
                    variant="body1"
                    sx={{
                      wordWrap: "break-word",
                      fontWeight: notification.is_read ? "normal" : "bold",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {moment(notification.created_at).fromNow()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item>
                      <IconButton
                        aria-label="mark as read/unread"
                        onClick={(e) => {
                          e.stopPropagation();
                          notification.is_read
                            ? handleMarkAsUnread(notification.id)
                            : handleMarkAsRead(notification.id);
                        }}
                        size="small"
                      >
                        {notification.is_read ? (
                          <MarkEmailReadIcon fontSize="small" />
                        ) : (
                          <MarkEmailUnreadIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Grid>
                    <Grid item>
                      <IconButton
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification);
                        }}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Box>
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
