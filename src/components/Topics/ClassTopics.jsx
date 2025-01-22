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
  markAllSwapRequestsAsRead,
  getUnreadSwapRequests,
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
  Menu,
  MenuItem,
  Avatar,
  AvatarGroup,
  Link,
  Stack,
  Snackbar,
  Select,
  InputLabel,
  FormControl,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Badge,
} from "@mui/material";
import { Container } from "@mui/system";
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  SwapCalls as SwapCallsIcon,
  SwapHoriz as SwapHorizIcon,
  Group as GroupIcon,
  Topic as TopicIcon,
} from "@mui/icons-material";
import moment from "moment";
import { getGroup, createGroup } from "../../services/groupService";
import TopicCard from "./TopicCard";
import GroupDialog from "./GroupDialog";

const TOPICS_PER_PAGE = 10;

function ClassTopics() {
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
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [approvingTopic, setApprovingTopic] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [userGroup, setUserGroup] = useState(null);
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [swapRequests, setSwapRequests] = useState([]);
  const [openSwapRequestsDialog, setOpenSwapRequestsDialog] = useState(false);
  const [loadingSwapRequests, setLoadingSwapRequests] = useState(false);
  const [processingSwap, setProcessingSwap] = useState(false);
  const [unreadSwapRequestsCount, setUnreadSwapRequestsCount] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [fetchTopicsError, setFetchTopicsError] = useState(null);
  const [topicsLoading, setTopicsLoading] = useState(false);

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

  const handleOpenGroupDialog = (topic) => {
    setSelectedTopic(topic);
    setOpenGroupDialog(true);
  };

  const handleCloseGroupDialog = () => {
    setOpenGroupDialog(false);
    setSelectedTopic(null);
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

      // Cập nhật danh sách topics sau khi phê duyệt thành công
      await fetchTopics();
      showSnackbar("Phê duyệt đề tài thành công");
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

      // Cập nhật danh sách topics sau khi từ chối thành công
      await fetchTopics();

      showSnackbar("Từ chối đề tài thành công");
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

      // Cập nhật danh sách topics sau khi xóa thành công
      await fetchTopics();

      showSnackbar("Xóa đề tài thành công");
    } catch (error) {
      console.error("Error deleting topic:", error);
      showSnackbar("Xóa đề tài thất bại.", "error");
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

  const handleApproveSwap = async (request) => {
    setProcessingSwap(true);
    try {
      const { error } = await approveTopicSwap(request);
      if (error) throw error;

      await Promise.all([fetchTopics(), fetchUserGroup(), fetchSwapRequests()]);
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

      await Promise.all([fetchTopics(), fetchSwapRequests()]);
      showSnackbar("Đã từ chối yêu cầu trao đổi đề tài.", "success");
    } catch (error) {
      console.error("Error rejecting topic swap:", error);
      showSnackbar("Lỗi khi từ chối yêu cầu trao đổi.", "error");
    } finally {
      setProcessingSwap(false);
      handleCloseSwapRequestsDialog();
    }
  };

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

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    setFetchTopicsError(null);
    try {
      const { data, error } = await getTopics(classId, user);
      if (error) throw error;
      setTopics(data);
    } catch (error) {
      setFetchTopicsError(error.message);
      console.error("Error fetching topics:", error);
    } finally {
      setTopicsLoading(false);
    }
  }, [classId, user]);

  useEffect(() => {
    fetchTopics();
  }, [currentClass, fetchTopics]);

  const fetchSwapRequests = useCallback(async () => {
    setLoadingSwapRequests(true);
    try {
      if (!userGroup) return;
      const { data, error } = await getTopicSwapRequests(userGroup.id);
      if (error) throw error;

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
        const { data, error } = await getUnreadSwapRequests(userGroup.id);
        if (error) throw error;
        setUnreadSwapRequestsCount(data.length);
      } catch (error) {
        console.error("Error fetching unread swap requests count:", error);
      }
    }
  }, [userGroup]);

  const fetchUserGroup = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await getGroup(user.id, classId);
        if (error) throw error;
        setUserGroup(data);
      } catch (error) {
        console.error("Error getting user group", error);
      }
    }
  }, [user, classId]);

  useEffect(() => {
    fetchUserGroup();
  }, [fetchUserGroup]);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [navigate, user]);

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

  const registeredTopics = useMemo(() => {
    return filteredTopics.filter((topic) => topic.registeredByUser);
  }, [filteredTopics]);

  const unregisteredTopics = useMemo(() => {
    return filteredTopics.filter((topic) => !topic.registeredByUser);
  }, [filteredTopics]);

  useEffect(() => {
    let unsubscribe;

    const fetchInitialData = async () => {
      if (user && userGroup) {
        await fetchSwapRequests();
        unsubscribe = subscribeToTopicSwapRequests(
          userGroup.id,
          fetchSwapRequests,
          showSnackbar
        );
      }
    };

    fetchInitialData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, userGroup, fetchSwapRequests]);

  useEffect(() => {
    fetchUnreadSwapRequestsCount();
  }, [
    user,
    userGroup,
    swapRequests,
    fetchSwapRequests,
    fetchUnreadSwapRequestsCount,
  ]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (userGroup && !openSwapRequestsDialog) {
        fetchUnreadSwapRequestsCount();
        fetchSwapRequests();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [
    fetchSwapRequests,
    fetchUnreadSwapRequestsCount,
    openSwapRequestsDialog,
    userGroup,
  ]);

  const handleRetryFetchTopics = () => {
    setFetchTopicsError(null);
    fetchTopics();
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Container maxWidth="md" sx={{ flexGrow: 1, mt: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
            {currentClass?.name || <Skeleton />} -{" "}
            {currentClass ? (
              formattedSemester(currentClass.semester)
            ) : (
              <Skeleton />
            )}
          </Typography>
          <Grid container spacing={2}>
            {[...Array(3)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ boxShadow: 2 }}>
                  <CardContent>
                    <Skeleton variant="text" sx={{ fontSize: "1.5rem" }} />
                    <Skeleton
                      variant="rectangular"
                      height={100}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="circular" width={40} height={40} />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={handleRetryFetchTopics}>
            Thử lại
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!currentClass) {
    return <Typography>Không tìm thấy lớp học</Typography>;
  }

  if (
    user &&
    ((user.role === "lecturer" && currentClass.lecturer_id !== user.id) ||
      (user.role === "admin" && !currentClass.is_final_project))
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
                sx={{ mr: 2 }}
              >
                <Badge
                  badgeContent={unreadSwapRequestsCount}
                  color="error"
                  overlap="circular"
                >
                  <SwapCallsIcon />
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
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Tìm kiếm đề tài"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Tìm kiếm theo tên đề tài"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
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
      {fetchTopicsError ? (
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
          {fetchTopicsError}
        </Alert>
      ) : topicsLoading ? (
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
        <>
          {registeredTopics.length > 0 && (
            <>
              <Grid container spacing={2} mt={2} justifyContent="center">
                {registeredTopics.map((topic) => (
                  <Grid item xs={12} sm={6} md={4} key={topic.id}>
                    <TopicCard
                      currentClass={currentClass}
                      topic={topic}
                      userGroup={userGroup}
                      swapRequests={swapRequests}
                      swapRequestId={
                        swapRequests.find(
                          (swapRequest) =>
                            swapRequest.requesting_group_id === userGroup.id &&
                            swapRequest.status === "pending"
                        )?.id
                      }
                      showSnackbar={showSnackbar}
                      fetchTopics={fetchTopics}
                      fetchUserGroup={fetchUserGroup}
                      fetchSwapRequests={fetchSwapRequests}
                      handleOpenGroupDialog={handleOpenGroupDialog}
                    />
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 3 }} />
            </>
          )}
          <Grid container spacing={2} mt={2}>
            {unregisteredTopics.map((topic) => (
              <Grid item xs={12} sm={6} md={4} key={topic.id}>
                <TopicCard
                  currentClass={currentClass}
                  topic={topic}
                  userGroup={userGroup}
                  swapRequests={swapRequests}
                  showSnackbar={showSnackbar}
                  fetchTopics={fetchTopics}
                  fetchUserGroup={fetchUserGroup}
                  fetchSwapRequests={fetchSwapRequests}
                  handleOpenGroupDialog={handleOpenGroupDialog}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
      <GroupDialog
        open={openGroupDialog}
        onClose={handleCloseGroupDialog}
        topic={selectedTopic}
      />
      <Dialog
        open={openSwapRequestsDialog}
        onClose={handleCloseSwapRequestsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ textAlign: "center" }}>
          <Typography variant="h5" component="div" gutterBottom>
            Yêu cầu trao đổi đề tài
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ padding: 3 }}>
          {loadingSwapRequests ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
              <CircularProgress />
            </Box>
          ) : swapRequests.length > 0 ? (
            <List>
              {swapRequests.map((request) => {
                return (
                  <ListItem
                    key={request.id}
                    sx={{ flexDirection: "column", alignItems: "flex-start" }}
                  >
                    <Box sx={{ width: "100%", mb: 2 }}>
                      <Typography
                        variant="body1"
                        color="text.secondary"
                        gutterBottom
                      >
                        Trạng thái:{" "}
                        <Chip
                          label={
                            request.status === "pending"
                              ? "Đang chờ"
                              : request.status === "approved"
                              ? "Đã chấp nhận"
                              : "Đã từ chối"
                          }
                          color={
                            request.status === "pending"
                              ? "primary"
                              : request.status === "approved"
                              ? "success"
                              : "error"
                          }
                          size="small"
                        />
                      </Typography>
                      <Box sx={{ width: "100%", mb: 1 }}>
                        <Typography variant="body1" color="text.secondary">
                          <TopicIcon
                            color="primary"
                            sx={{ verticalAlign: "middle", mr: 1 }}
                          />
                          <Box
                            component="span"
                            sx={{ fontWeight: "bold", mr: 1 }}
                          >
                            Đề tài yêu cầu:
                          </Box>
                          <Link
                            component={RouterLink}
                            to={`/topics/details/${request.topic_id}`}
                          >
                            {request.topics.name}
                          </Link>
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            <GroupIcon
                              color="secondary"
                              sx={{ verticalAlign: "middle", mr: 1 }}
                            />
                            <Box
                              component="span"
                              sx={{ fontWeight: "bold", mr: 1 }}
                            >
                              Nhóm yêu cầu:
                            </Box>
                            <Typography
                              component="span"
                              variant="body2"
                              color="primary"
                              sx={{ fontWeight: "bold" }}
                            >
                              {request.requesting_group?.group_name ||
                                request.requesting_group_id}
                            </Typography>
                          </Typography>
                          <List dense>
                            {(
                              request.requesting_group?.student_group_members ||
                              []
                            ).map((member) => (
                              <ListItem key={member.student_id} disablePadding>
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: "primary.main" }}>
                                    {member.users.full_name
                                      .split(" ")
                                      .map((name) => name[0])
                                      .join("")}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={member.users.full_name}
                                  secondary={`Mã số: ${
                                    member.users.student_code ||
                                    member.users.lecturer_code ||
                                    "Không có mã"
                                  }`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            <GroupIcon
                              color="secondary"
                              sx={{ verticalAlign: "middle", mr: 1 }}
                            />
                            <Box
                              component="span"
                              sx={{ fontWeight: "bold", mr: 1 }}
                            >
                              Nhóm được yêu cầu:
                            </Box>
                            <Typography
                              component="span"
                              variant="body2"
                              color="primary"
                              sx={{ fontWeight: "bold" }}
                            >
                              {request.requested_group?.group_name ||
                                request.requested_group_id}
                            </Typography>
                          </Typography>
                          <List dense>
                            {(
                              request.requested_group?.student_group_members ||
                              []
                            ).map((member) => (
                              <ListItem key={member.student_id} disablePadding>
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: "primary.main" }}>
                                    {member.users.full_name
                                      .split(" ")
                                      .map((name) => name[0])
                                      .join("")}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={member.users.full_name}
                                  secondary={`Mã số: ${
                                    member.users.student_code ||
                                    member.users.lecturer_code ||
                                    "Không có mã"
                                  }`}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Grid>
                      </Grid>
                    </Box>

                    {userGroup &&
                      request.requested_group_id === userGroup.id && (
                        <Box
                          sx={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-end",
                            mt: 2,
                          }}
                        >
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
                        </Box>
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
