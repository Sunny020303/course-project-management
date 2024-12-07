import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  getTopics,
  registerTopic,
  deleteTopic,
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
} from "@mui/material";
import { Container } from "@mui/system";
import SearchIcon from "@mui/icons-material/Search";
import moment from "moment";
import { getGroup, createGroup } from "../../services/groupService";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Person as PersonIcon } from "@mui/icons-material";
import supabase from "../../services/supabaseClient";

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
  const [students, setStudents] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [userGroup, setUserGroup] = useState(null);

  const open = Boolean(anchorEl);

  const formattedSemester = useMemo(() => {
    return (semesterInt) => {
      const year = String(semesterInt).slice(0, 4);
      const semesterPart = String(semesterInt).slice(4);
      const semesterName =
        semesterPart === "3" ? "Hè" : `Học kỳ ${semesterPart}`;
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

  const showSnackbar = (message, severity = "success") => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleRegisterTopic = async (topic) => {
    setRegisterError(null);
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

        setTopics(
          topics.map((t) =>
            t.id === topic.id
              ? { ...t, registeredByUser: true, student_ids: [user.id] }
              : t
          )
        );
      } else {
        if (userGroup.topic_id) {
          setRegisterError("Nhóm của bạn đã đăng ký một đề tài khác.");
          setTimeout(() => {
            setRegisterError(null);
          }, 5000);
          return;
        }

        if (userGroup.student_ids.length > topic.max_members) {
          setRegisterError(
            `Nhóm của bạn có ${userGroup.student_ids.length} thành viên, vượt quá số lượng tối đa ${topic.max_members} cho đề tài này.`
          );
          setTimeout(() => {
            setRegisterError(null);
          }, 5000);

          return;
        }

        const { error: registerError } = await registerTopic(
          topic.id,
          userGroup.id
        );
        if (registerError) throw registerError;

        setTopics((prevTopics) =>
          prevTopics.map((t) =>
            t.id === topic.id
              ? {
                  ...t,
                  registeredByUser: true,
                  registered_group: userGroup.id,
                  student_ids: userGroup.student_ids,
                }
              : t
          )
        );
      }
      setRegistrationSuccess(true);
      showSnackbar("Đăng ký đề tài thành công!");

      setTimeout(() => {
        setRegistrationSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error registering topic:", error);
      showSnackbar("Đăng ký đề tài thất bại.", "error");
      if (error.code === "23505") {
        setRegisterError("Đề tài này đã có nhóm đăng ký.");
      } else if (error.code === "23503") {
        setRegisterError("Lớp học không hợp lệ");
      } else {
        setRegisterError("Đã có lỗi xảy ra. Vui lòng thử lại.");
      }
    } finally {
      setRegisterLoading(false);
      setRegistrationSuccess(false);
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

  const handleApproveTopic = async (topicId) => {
    setApprovingTopic(topicId);
    try {
      const { error } = await supabase
        .from("topics")
        .update({ approval_status: "approved" })
        .eq("id", topicId);
      if (error) throw error;

      setTopics(
        topics.map((topic) =>
          topic.id === topicId
            ? { ...topic, approval_status: "approved" }
            : topic
        )
      );
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
      const { error } = await supabase
        .from("topics")
        .update({ approval_status: "rejected" })
        .eq("id", topicId);
      if (error) throw error;

      setTopics(
        topics.map((topic) =>
          topic.id === topicId
            ? { ...topic, approval_status: "rejected" }
            : topic
        )
      );
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
      setTopics(topics.filter((topic) => topic.id !== topicId)); // remove deleted topic from UI

      showSnackbar("Xóa đề tài thành công");
    } catch (error) {
      showSnackbar("Xóa đề tài thất bại", "error");
      alert("Xóa đề tài thất bại.");
    } finally {
      setDeletingTopic(null);
    }
    handleClose();
  };

  const handleJoinGroup = () => {
    navigate(`/classes/${classId}/groups`);
  };

  const RegistrationStatus = ({ topic, user }) => {
    if (!user || user.role !== "student") {
      return null;
    }

    if (topic.registeredByUser) {
      return <Chip label="Đã đăng ký" color="success" />;
    }

    if (topic.approval_status === "rejected") {
      return (
        <Alert severity="warning" size="small">
          Đề tài đã bị từ chối.
        </Alert>
      );
    }

    if (
      topic.approval_status === "approved" &&
      !moment().isAfter(topic.registration_deadline)
    ) {
      return (
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => handleRegisterTopic(topic)}
          disabled={registerLoading}
        >
          {registerLoading ? <CircularProgress size={20} /> : "Đăng ký"}
        </Button>
      );
    }

    if (moment().isAfter(topic.registration_deadline)) {
      return <Alert severity="warning">Hết hạn đăng ký</Alert>;
    }

    return null;
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
          setError(error);
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
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await getTopics(classId, user);
        if (error) throw error;

        setTopics(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (currentClass) fetchTopics();
  }, [classId, currentClass, currentPage, searchQuery, selectedStatus, user]);

  const studentGroups = useMemo(() => {
    if (topics && topics.length > 0) {
      return topics.reduce((map, topic) => {
        if (topic.registered_group)
          map[topic.registered_group] = topic.student_ids;
        return map;
      }, {});
    }
  }, [topics]);

  const renderAvatarGroup = (members) => (
    <AvatarGroup max={3}>
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

  const renderStudentAvatars = useMemo(() => {
    return (members) => {
      if (!members || members.length === 0) {
        return (
          <Tooltip title="Chưa có sinh viên đăng ký">
            <PersonIcon />
          </Tooltip>
        );
      }

      const maxAvatars = 3;
      if (members.length <= maxAvatars) {
        return (
          <Tooltip
            title={members.map((member) => member.users.full_name).join(", ")}
          >
            {renderAvatarGroup(members)}
          </Tooltip>
        );
      }
      return (
        <Tooltip
          title={members.map((member) => member.users.full_name).join(", ")}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {renderAvatarGroup(members.slice(0, maxAvatars))}
            <Typography variant="body2" color="text.secondary" ml={1}>
              (+{members.length - maxAvatars})
            </Typography>
          </Box>
        </Tooltip>
      );
    };
  }, []);

  if (loading) {
    return (
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Container maxWidth="md" sx={{ flexGrow: 1, mt: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
            {currentClass?.name || <Skeleton />} -{" "}
            {currentClass ? (
              formattedSemester(currentClass?.semester)
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
    return <Alert severity="error">{error}</Alert>;
  }

  if (!currentClass) return <Typography>Không tìm thấy lớp học</Typography>;

  if (topics.length === 0 && !loading && !error) {
    return (
      <Alert
        severity="info"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
        }}
      >
        Không có đề tài nào.
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
          {currentClass?.name} - {formattedSemester(currentClass?.semester)}
        </Typography>
        {user?.role === "lecturer" && ( // Chỉ hiển thị nút thêm đề tài cho giảng viên
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
      <Alert
        severity="success"
        sx={{ display: registrationSuccess ? "flex" : "none" }}
      >
        Đăng ký thành công!
      </Alert>
      <Alert severity="error" sx={{ display: registerError ? "flex" : "none" }}>
        {registerError}
      </Alert>
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
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="pending">Chờ phê duyệt</MenuItem>
              <MenuItem value="approved">Đã phê duyệt</MenuItem>
              <MenuItem value="rejected">Bị từ chối</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
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
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Trạng thái:
                  </Typography>
                  {topic.approval_status === "pending" && (
                    <Chip label="Chờ phê duyệt" color="warning" size="small" />
                  )}
                  {topic.approval_status === "approved" && (
                    <Chip label="Đã phê duyệt" color="success" size="small" />
                  )}
                  {topic.approval_status === "rejected" && (
                    <Chip label="Bị từ chối" color="error" size="small" />
                  )}
                </Stack>
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
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Giảng viên:{" "}
                  {topic.lecturer?.full_name || "Chưa có giảng viên hướng dẫn"}
                </Typography>
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
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Số lượng thành viên đã đăng ký:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {topic.student_group_members?.length || 0}/
                      {topic.max_members}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {topic.registered_group && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", mt: 1 }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mr: 1 }}
                        >
                          Nhóm đăng ký:
                        </Typography>
                        {renderStudentAvatars(topic.student_group_members)}
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Hạn đăng ký:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body1">
                      {moment(topic.registration_deadline).format("DD/MM/YYYY")}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent:
                    user?.role === "lecturer" ? "space-between" : "flex-end",
                }}
              >
                <RegistrationStatus topic={topic} user={user} />

                {!userGroup && user.role === "student" && (
                  <Alert
                    severity="info"
                    action={
                      <Button color="inherit" onClick={handleJoinGroup}>
                        Tạo/Tham gia nhóm
                      </Button>
                    }
                  >
                    Bạn chưa tham gia nhóm nào. Vui lòng tạo hoặc tham gia một
                    nhóm để đăng ký đề tài.
                  </Alert>
                )}

                {user?.role === "lecturer" && (
                  <>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton
                        color="primary"
                        component={RouterLink}
                        to={`/classes/${classId}/topics/${topic.id}/edit`}
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
                    <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                      {selectedTopic && (
                        <>
                          <MenuItem
                            onClick={() => handleApproveTopic(selectedTopic.id)}
                            disabled={approvingTopic}
                          >
                            {approvingTopic === selectedTopic.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              "Phê duyệt"
                            )}
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleRejectTopic(selectedTopic.id)}
                            disabled={approvingTopic === selectedTopic.id}
                          >
                            {approvingTopic === selectedTopic.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              "Từ chối"
                            )}
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleDeleteTopic(selectedTopic.id)}
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
              </CardActions>
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                severity={snackbarSeverity}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ClassTopics;
