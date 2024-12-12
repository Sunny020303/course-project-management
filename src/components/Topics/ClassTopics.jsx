import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  getTopics,
  registerTopic,
  deleteTopic,
  approveTopic,
  rejectTopic,
  requestTopicSwap,
  getTopicSwapRequests,
  approveTopicSwap,
  rejectTopicSwap,
  cancelTopicRegistration,
  markAllSwapRequestsAsRead,
  subscribeToTopicSwapRequests,
} from "../../services/topicService";
import { getClassDetails } from "../../services/classService";
import { useAuth } from "../../context/AuthContext";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Skeleton,
  Tooltip,
  Stack,
  Link,
  Menu,
  MenuItem,
  AvatarGroup,
  Avatar,
  Select,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Snackbar,
  Badge,
} from "@mui/material";
import { Container } from "@mui/system";
import {
  Person as PersonIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Event as EventIcon,
  SwapHoriz as SwapHorizIcon,
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from "@mui/icons-material";
import moment from "moment";
import { getGroup, createGroup } from "../../services/groupService";
import GroupDialog from "./GroupDialog";
import RegistrationStatus from "./RegistrationStatus";
import supabase from "../../services/supabaseClient";

function ClassTopics() {
  const [registerLoading, setRegisterLoading] = useState(false);

  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [topics, setTopics] = useState([]);
  const [currentClass, setCurrentClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [approvingTopic, setApprovingTopic] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [userGroup, setUserGroup] = useState(null);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [openSwapRequestsDialog, setOpenSwapRequestsDialog] = useState(false);
  const [loadingSwapRequests, setLoadingSwapRequests] = useState(false);
  const [processingSwap, setProcessingSwap] = useState(false);
  const [unreadSwapRequestsCount, setUnreadSwapRequestsCount] = useState(0);

  const open = Boolean(anchorEl);

  const formattedSemester = useMemo(() => {
    return (semesterInt) => {
      const year = String(semesterInt).slice(0, 4);
      const semesterPart = String(semesterInt).slice(4);
      const semesterName =
        semesterPart === "3" ? "Học kỳ Hè" : `Học kỳ ${semesterPart}`;
      return `${year} - ${semesterName}`;
    };
  }, []);

  const fetchUserGroup = async () => {
    if (user) {
      try {
        const { data, error } = await getGroup(user.id, classId);
        if (error) throw error;
        setUserGroup(data);
      } catch (error) {
        console.error("Error getting user group", error);
      }
    }
  };

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await getTopics(classId, user);
      if (error) throw error;
      setTopics(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [classId, user]);

  const fetchSwapRequests = useCallback(async () => {
    setLoadingSwapRequests(true);
    try {
      if (!userGroup) return;
      const { data, error } = await getTopicSwapRequests(userGroup.id);
      if (error) throw error;

      fetchUnreadSwapRequestsCount();
      setSwapRequests(data);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      showSnackbar("Failed to fetch swap requests.", "error");
    } finally {
      setLoadingSwapRequests(false);
    }
  }, [userGroup]);

  const fetchUnreadSwapRequestsCount = useCallback(async () => {
    if (userGroup) {
      try {
        const { data, error } = await supabase
          .from("topic_swap_requests")
          .select("id", { count: "exact" })
          .eq("status", "pending")
          .eq("requested_group_id", userGroup.id)
          .eq("read", false);

        if (error) throw error;
        setUnreadSwapRequestsCount(data.length);
      } catch (error) {
        console.error("Error fetching unread swap requests count:", error);
      }
    }
  }, [userGroup]);

  const handleRetryFetchTopics = () => {
    setError(null);
    fetchTopics();
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
    setSnackbarMessage("");
  };

  const showSnackbar = (message, severity = "") => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleOpenGroupDialog = (members) => {
    setSelectedGroup(members);
    setOpenGroupDialog(true);
  };

  const handleCloseGroupDialog = () => {
    setOpenGroupDialog(false);
    setSelectedGroup(null);
  };

  const handleRegisterTopic = async (topic) => {
    setRegisterLoading(true);

    try {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      if (!userGroup) {
        const { data: newGroup, error: createGroupError } = await createGroup(
          classId,
          [user.id]
        );
        if (createGroupError) throw createGroupError;

        const { error: registerError } = await registerTopic(
          topic.id,
          newGroup.id
        );
        if (registerError) throw registerError;
        await fetchTopics();
        await fetchUserGroup();
      } else {
        if (userGroup.members.length > topic.max_members) {
          showSnackbar(
            `Nhóm của bạn có ${userGroup.members.length} thành viên, vượt quá số lượng tối đa ${topic.max_members} cho đề tài này.`,
            "error"
          );
          return;
        }

        const { error: registerError } = await registerTopic(
          topic.id,
          userGroup.id
        );
        if (registerError) throw registerError;
        await fetchTopics();
        await fetchUserGroup();
      }
      showSnackbar("Đăng ký đề tài thành công!", "success");
    } catch (error) {
      console.error("Error registering topic:", error);
      if (error.code === "23505") {
        showSnackbar("Đề tài này đã có nhóm đăng ký.", "error");
      } else if (error.code === "23503") {
        showSnackbar("Lớp học không hợp lệ", "error");
      } else {
        showSnackbar(
          error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
          "error"
        );
      }
    } finally {
      setRegisterLoading(true);
    }
  };

  const handleCancelRegistration = async (topic) => {
    try {
      if (!userGroup || !userGroup.topic_id) {
        showSnackbar("Nhóm của bạn chưa đăng ký đề tài nào.", "error");
        return;
      }

      const { error } = await cancelTopicRegistration(userGroup.id);
      if (error) throw error;

      await fetchTopics();
      await fetchUserGroup();
      showSnackbar("Hủy đăng ký đề tài thành công.", "success");
    } catch (error) {
      console.error("Error canceling topic registration:", error);
      showSnackbar("Hủy đăng ký đề tài thất bại.", "error");
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleClick = (event, topic) => {
    setAnchorEl(event.currentTarget);
    setSelectedTopic(topic);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTopic(null);
  };

  const handleEditTopic = (topicId) => {
    navigate(`/classes/${classId}/topics/${topicId}/edit`);
  };

  const handleApproveTopic = async (topicId) => {
    setApprovingTopic(topicId);
    try {
      const { error } = await approveTopic(topicId);
      if (error) throw error;

      await fetchTopics();
      showSnackbar("Phê duyệt đề tài thành công", "success");
    } catch (error) {
      console.error("Error approving topic:", error);
      showSnackbar("Phê duyệt đề tài thất bại.", "error");
    } finally {
      setApprovingTopic(null);
      handleClose();
    }
  };

  const handleRejectTopic = async (topicId) => {
    setApprovingTopic(topicId);

    try {
      const { error } = await rejectTopic(topicId);
      if (error) throw error;

      await fetchTopics();
      showSnackbar("Từ chối đề tài thành công", "success");
    } catch (error) {
      console.error("Error rejecting topic:", error);
      showSnackbar("Từ chối đề tài thất bại.", "error");
    } finally {
      setApprovingTopic(null);
      handleClose();
    }
  };

  const handleDeleteTopic = async (topicId) => {
    setDeletingTopic(topicId);
    try {
      const { error } = await deleteTopic(topicId);
      if (error) throw error;

      await fetchTopics();
      showSnackbar("Xóa đề tài thành công", "success");
    } catch (error) {
      showSnackbar("Xóa đề tài thất bại", "error");
      alert("Xóa đề tài thất bại.");
    } finally {
      setDeletingTopic(null);
      handleClose();
    }
  };

  const handleJoinGroup = () => {
    navigate(`/classes/${classId}/groups`);
  };

  const handleOpenSwapRequestsDialog = () => {
    setOpenSwapRequestsDialog(true);
  };

  const handleCloseSwapRequestsDialog = () => {
    setOpenSwapRequestsDialog(false);
    try {
      const { error } = markAllSwapRequestsAsRead(userGroup.id);
      if (error) throw error;
      setUnreadSwapRequestsCount(0);
    } catch (error) {
      console.error("Error marking all swap requests as read:", error);
    }
  };

  const handleRequestSwap = async (topic) => {
    try {
      if (!userGroup.topic_id) {
        showSnackbar("Nhóm của bạn chưa đăng ký đề tài nào.", "error");
        return;
      }

      const { error: requestError } = await requestTopicSwap(
        userGroup,
        topic.registered_group
      );
      if (requestError) throw requestError;

      showSnackbar("Đã gửi yêu cầu trao đổi đề tài.", "success");
      fetchSwapRequests();
    } catch (error) {
      console.error("Error requesting topic swap:", error);
      showSnackbar("Lỗi khi gửi yêu cầu trao đổi.", "error");
    }
  };

  const handleApproveSwap = async (request) => {
    setProcessingSwap(true);
    try {
      const { error } = await approveTopicSwap(request);
      if (error) throw error;

      await fetchTopics();
      await fetchSwapRequests();
      await fetchUserGroup();
      showSnackbar("Trao đổi đề tài thành công.", "success");
    } catch (error) {
      console.error("Error approving topic swap:", error);
      showSnackbar("Lỗi khi trao đổi đề tài.", "error");
    } finally {
      setProcessingSwap(false);
      handleCloseSwapRequestsDialog();
    }
  };

  const handleRejectSwap = async (request) => {
    setProcessingSwap(true);
    try {
      const { error } = await rejectTopicSwap(request);
      if (error) throw error;

      await fetchTopics();
      await fetchSwapRequests();
      showSnackbar("Đã từ chối yêu cầu trao đổi đề tài.", "success");
    } catch (error) {
      console.error("Error rejecting topic swap:", error);
      showSnackbar("Lỗi khi từ chối yêu cầu trao đổi.", "error");
    } finally {
      setProcessingSwap(false);
      handleCloseSwapRequestsDialog();
    }
  };

  const filteredTopics = useMemo(() => {
    if (!topics) {
      return [];
    }
    return topics.filter((topic) => {
      const searchMatch = topic.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const statusMatch = selectedStatus
        ? topic.approval_status === selectedStatus
        : true;
      return searchMatch && statusMatch;
    });
  }, [topics, searchQuery, selectedStatus]);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    fetchUserGroup();
  }, [classId, user]);

  useEffect(() => {
    const fetchClassDetails = async () => {
      if (classId) {
        setLoading(true);
        try {
          const { data, error } = await getClassDetails(classId);
          if (error) throw error;
          setCurrentClass(data);
        } catch (error) {
          setError(error.message);
          console.error("Error fetching class details:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError("Không tìm thấy lớp học.");
      }
    };

    fetchClassDetails();
  }, [classId]);

  useEffect(() => {
    fetchTopics();
  }, [currentClass, fetchTopics]);

  useEffect(() => {
    let unsubscribe;

    if (user && userGroup) {
      unsubscribe = subscribeToTopicSwapRequests(
        userGroup.id,
        fetchSwapRequests,
        showSnackbar
      );
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, userGroup, fetchSwapRequests]);

  const renderTopicStatus = useMemo(
    () => (topic) => {
      switch (topic.approval_status) {
        case "approved":
          return (
            <Chip
              label="Đã phê duyệt"
              color="success"
              size="small"
              icon={<CheckCircleIcon />}
            />
          );
        case "rejected":
          return (
            <Chip
              label="Bị từ chối"
              color="error"
              size="small"
              icon={<CancelIcon />}
            />
          );
        default:
          return (
            <Chip
              label="Chờ phê duyệt"
              color="warning"
              size="small"
              icon={<HourglassEmptyIcon />}
            />
          );
      }
    },
    []
  );

  const renderStudentAvatars = useMemo(
    () => (members, registeredGroup) => {
      if (!members || members.length === 0) {
        return (
          <Tooltip title="Chưa có sinh viên đăng ký">
            <PersonIcon />
          </Tooltip>
        );
      }

      const maxAvatars = 3;
      const avatarGroup = (
        <AvatarGroup max={maxAvatars}>
          {members.map((member) => (
            <Tooltip key={member.student_id} title={member.users.full_name}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                {member.users.full_name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </Avatar>
            </Tooltip>
          ))}
        </AvatarGroup>
      );

      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {registeredGroup?.group_name ? (
            <Tooltip title={`Nhóm: ${registeredGroup?.group_name}`}>
              <Button
                size="small"
                color="primary"
                onClick={() => handleOpenGroupDialog(members)}
                startIcon={<GroupIcon />}
                sx={{ marginRight: 1 }}
              >
                {registeredGroup?.group_name}
              </Button>
            </Tooltip>
          ) : (
            <Button
              size="small"
              color="primary"
              onClick={() => handleOpenGroupDialog(members)}
              startIcon={<GroupIcon />}
              sx={{ marginRight: 1 }}
            >
              Xem nhóm
            </Button>
          )}
          {members.length <= maxAvatars ? (
            avatarGroup
          ) : (
            <Tooltip
              title={members.map((member) => member.users.full_name).join(", ")}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {avatarGroup}
                <Typography variant="body2" color="text.secondary" ml={1}>
                  (+{members.length - maxAvatars})
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      );
    },
    [handleOpenGroupDialog]
  );

  if (!currentClass && !loading)
    return <Typography variant="body1">Không tìm thấy lớp học.</Typography>;

  if (
    !loading &&
    user.role === "lecturer" &&
    currentClass.lecturer_id !== user.id
  ) {
    return (
      <Alert severity="error">
        Bạn không phải là giảng viên của lớp học này.
      </Alert>
    );
  }

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, marginTop: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
          {currentClass?.name || <Skeleton />} -{" "}
          {currentClass ? (
            formattedSemester(currentClass?.semester)
          ) : (
            <Skeleton />
          )}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {user?.role === "student" && userGroup && (
            <Tooltip title="Yêu cầu trao đổi đề tài">
              <IconButton
                color="primary"
                onClick={handleOpenSwapRequestsDialog}
                sx={{ marginRight: 2 }}
              >
                <Badge
                  badgeContent={unreadSwapRequestsCount}
                  color="error"
                  overlap="circular"
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {user?.role === "lecturer" && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/classes/${classId}/topics/create`)}
          >
            Thêm đề tài
          </Button>
        )}
      </Box>
      {user?.role === "student" && !userGroup && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" onClick={handleJoinGroup}>
              Tạo/Tham gia nhóm
            </Button>
          }
        >
          Bạn chưa tham gia nhóm nào. Vui lòng tạo hoặc tham gia một nhóm để
          đăng ký đề tài.
        </Alert>
      )}
      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Tìm kiếm đề tài"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            placeholder="Tìm kiếm theo tên đề tài"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="status-select-label">Trạng thái</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={selectedStatus}
              label="Trạng thái"
              onChange={handleStatusChange}
              inputProps={{ "aria-label": "Without label" }}
            >
              <MenuItem value="">
                <em>Tất cả</em>
              </MenuItem>
              <MenuItem value="pending">Chờ phê duyệt</MenuItem>
              <MenuItem value="approved">Đã phê duyệt</MenuItem>
              <MenuItem value="rejected">Bị từ chối</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRetryFetchTopics}
            >
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      ) : loading ? (
        <Grid container spacing={2} mt={2}>
          {[...Array(3)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                  <Skeleton variant="text" sx={{ fontSize: "1.5rem" }} />
                  <Skeleton variant="rectangular" height={100} sx={{ mt: 1 }} />
                </CardContent>
                <CardActions>
                  <Skeleton variant="circular" width={40} height={40} />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : topics.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          Không có đề tài nào.
        </Alert>
      ) : (
        <Grid container spacing={2} mt={2}>
          {filteredTopics.map((topic) => (
            <Grid item xs={12} sm={6} md={4} key={topic.id}>
              <Card
                sx={{
                  borderColor: topic.registeredByUser ? "green" : "default",
                  borderWidth: topic.registeredByUser ? 2 : 1,
                  borderStyle: "solid",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Typography
                      variant="h6"
                      component="div"
                      color="primary.main"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      <Tooltip title={topic.name}>
                        <Link
                          component={RouterLink}
                          to={`/topics/details/${topic.id}`}
                          sx={{
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          {topic.name}
                        </Link>
                      </Tooltip>
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SchoolIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        Giảng viên:{" "}
                        {topic.lecturer?.full_name || (
                          <i>Chưa có giảng viên hướng dẫn</i>
                        )}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        display: "-webkit-box",
                        overflow: "hidden",
                        WebkitBoxOrient: "vertical",
                        WebkitLineClamp: 3,
                      }}
                    >
                      {topic.description || "Không có mô tả"}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <GroupIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Số lượng thành viên tối đa: {topic.max_members}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Hạn đăng ký:{" "}
                        {moment(topic.registration_deadline).format(
                          "DD/MM/YYYY"
                        )}
                      </Typography>
                    </Stack>
                    <Divider />
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mt={1}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Trạng thái:
                      </Typography>
                      {renderTopicStatus(topic)}
                    </Stack>
                    {topic.registered_group ? (
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        mt={1}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mr: 1 }}
                        >
                          Nhóm:
                        </Typography>
                        {renderStudentAvatars(
                          topic.student_group_members,
                          topic.registered_group
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Chưa có nhóm đăng ký
                      </Typography>
                    )}
                  </Stack>
                </CardContent>

                <CardActions
                  sx={{
                    justifyContent:
                      user?.role === "lecturer" ? "space-between" : "flex-end",
                  }}
                >
                  {user?.role === "lecturer" && (
                    <>
                      <Tooltip title="Chỉnh sửa">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditTopic(topic.id)}
                          size="small"
                          disabled={approvingTopic || deletingTopic}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Tùy chọn">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={(event) => handleClick(event, topic)}
                          disabled={deletingTopic || approvingTopic}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>

                      <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                      >
                        {selectedTopic && (
                          <>
                            <MenuItem
                              onClick={() =>
                                handleApproveTopic(selectedTopic.id)
                              }
                              disabled={approvingTopic === selectedTopic.id}
                            >
                              {approvingTopic === selectedTopic.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                "Phê duyệt"
                              )}
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleRejectTopic(selectedTopic.id)
                              }
                              disabled={approvingTopic === selectedTopic.id}
                            >
                              {approvingTopic === selectedTopic.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                "Từ chối"
                              )}
                            </MenuItem>
                            <MenuItem
                              onClick={() =>
                                handleDeleteTopic(selectedTopic.id)
                              }
                              disabled={deletingTopic === selectedTopic.id}
                            >
                              {deletingTopic === selectedTopic.id ? (
                                <CircularProgress size={20} />
                              ) : (
                                "Xóa"
                              )}
                            </MenuItem>
                          </>
                        )}
                      </Menu>
                    </>
                  )}

                  <Box>
                    <RegistrationStatus
                      topic={topic}
                      user={user}
                      handleRegisterTopic={handleRegisterTopic}
                      handleCancelRegistration={handleCancelRegistration}
                      registerLoading={registerLoading}
                      userGroup={userGroup}
                      handleRequestSwap={handleRequestSwap}
                    />
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        {snackbarSeverity ? (
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        ) : (
          snackbarMessage
        )}
      </Snackbar>
      <GroupDialog
        open={openGroupDialog}
        onClose={handleCloseGroupDialog}
        members={selectedGroup}
      />
      <Dialog
        open={openSwapRequestsDialog}
        onClose={handleCloseSwapRequestsDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            Yêu cầu trao đổi đề tài
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {loadingSwapRequests ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          ) : swapRequests.length > 0 ? (
            <List>
              {swapRequests.map((request) => {
                const requestingGroupMembers =
                  request.requesting_group?.student_group_members || [];
                const requestedGroupMembers =
                  request.requested_group?.student_group_members || [];
                return (
                  <ListItem key={request.id}>
                    <ListItemText
                      primary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body1"
                            color="text.primary"
                          >
                            Nhóm{" "}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body1"
                            color="primary"
                          >
                            {request.requesting_group?.group_name ??
                              (request.requesting_group_id === userGroup.id
                                ? "của bạn"
                                : request.requesting_group_id)}{" "}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body1"
                            color="text.primary"
                          >
                            muốn trao đổi đề tài{" "}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body1"
                            color="primary"
                          >
                            {request.topics.name}{" "}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body1"
                            color="text.primary"
                          >
                            với nhóm{" "}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body1"
                            color="primary"
                          >
                            {request.requested_group?.group_name ??
                              (request.requested_group_id === userGroup.id
                                ? "của bạn"
                                : request.requested_group_id)}{" "}
                          </Typography>
                          <Typography
                            component="span"
                            variant="body1"
                            color="text.primary"
                          >
                            .
                          </Typography>
                        </React.Fragment>
                      }
                      secondary={
                        <>
                          <Typography component="div" variant="body2">
                            Thành viên nhóm yêu cầu:{" "}
                            {requestingGroupMembers
                              .map((member) => member.users.full_name)
                              .join(", ")}
                          </Typography>
                          <Typography component="div" variant="body2">
                            Thành viên nhóm được yêu cầu:{" "}
                            {requestedGroupMembers
                              .map((member) => member.users.full_name)
                              .join(", ")}
                          </Typography>
                          <Typography component="div" variant="body2">
                            Trạng thái: {request.status}
                          </Typography>
                        </>
                      }
                    />

                    {userGroup &&
                      request.requested_group_id === userGroup.id && (
                        <ListItemSecondaryAction>
                          {request.status === "pending" && (
                            <>
                              <Tooltip title="Chấp nhận">
                                <IconButton
                                  edge="end"
                                  aria-label="approve"
                                  onClick={() => handleApproveSwap(request)}
                                  disabled={processingSwap}
                                >
                                  {processingSwap ? (
                                    <CircularProgress size={24} />
                                  ) : (
                                    <CheckCircleIcon color="success" />
                                  )}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Từ chối">
                                <IconButton
                                  edge="end"
                                  aria-label="reject"
                                  onClick={() => handleRejectSwap(request)}
                                  disabled={processingSwap}
                                >
                                  {processingSwap ? (
                                    <CircularProgress size={24} />
                                  ) : (
                                    <CancelIcon color="error" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </ListItemSecondaryAction>
                      )}
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <Typography>Không có yêu cầu trao đổi đề tài nào.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSwapRequestsDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ClassTopics;
