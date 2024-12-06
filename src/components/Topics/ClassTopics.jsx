import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Container } from "@mui/system";
import SearchIcon from "@mui/icons-material/Search";
import moment from "moment";
import { getGroup } from "../../services/groupService";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Person as PersonIcon } from "@mui/icons-material";
import supabase from "../../services/supabaseClient";

const TOPICS_PER_PAGE = 10; // Số lượng đề tài trên mỗi trang

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

  const open = Boolean(anchorEl);

  const formattedSemester = (semesterInt) => {
    const year = String(semesterInt).slice(0, 4);
    const semesterPart = String(semesterInt).slice(4);
    const semesterName =
      semesterPart === "3" ? "Học kỳ Hè" : `Học kỳ ${semesterPart}`;
    return `${year} - ${semesterName}`;
  };

  const handleRegisterTopic = async (topic) => {
    setRegisterError(null);
    setRegisterLoading(true);

    try {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: group, error: groupError } = await getGroup(
        user.id,
        classId
      );

      if (groupError) throw groupError;

      if (!group) {
        setRegisterError(
          "Bạn chưa tham gia nhóm nào trong lớp này. Vui lòng tạo hoặc tham gia một nhóm trước khi đăng ký đề tài."
        );

        setTimeout(() => {
          setRegisterError(null);
        }, 5000);
        return;
      }

      if (group.topic_id) {
        setRegisterError("Nhóm của bạn đã đăng ký một đề tài khác.");
        setTimeout(() => {
          setRegisterError(null);
        }, 5000);
        return;
      }

      // Kiểm tra số lượng nhóm đã đăng ký đề tài
      const {
        data: registeredGroups,
        error: countError,
        count,
      } = await supabase
        .from("student_groups")
        .select("id", { count: "exact" }) // select and count in 1 query
        .eq("topic_id", topic.id);
      if (countError) throw countError;

      if (count >= topic.max_members) {
        setRegisterError("Đề tài này đã đủ số lượng nhóm đăng ký.");
        setTimeout(() => {
          setRegisterError(null);
        }, 5000);
        return;
      }

      const { error: registerError } = await registerTopic(topic.id, group.id);
      if (registerError) throw registerError;

      setTopics(
        topics.map((t) =>
          t.id === topic.id ? { ...t, registeredByUser: true } : t
        )
      );

      setRegistrationSuccess(true);
      setTimeout(() => {
        setRegistrationSuccess(false);
      }, 5000);
    } catch (error) {
      setRegisterError(error.message);
      console.error("Error registering topic:", error);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
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
      alert("Phê duyệt đề tài thành công.");
    } catch (error) {
      console.error("Error approving topic:", error);
      alert("Phê duyệt đề tài thất bại.");
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
      alert("Từ chối đề tài thành công.");
    } catch (error) {
      console.error("Error rejecting topic:", error);
      alert("Từ chối đề tài thất bại.");
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

      alert("Xóa đề tài thành công!");
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("Xóa đề tài thất bại.");
    } finally {
      setDeletingTopic(null);
    }
    handleClose();
  };

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

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
  }, [classId, currentClass, searchQuery, selectedStatus, user]);

  const renderStudentAvatars = (members) => {
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
    }

    return (
      <Tooltip
        title={members.map((member) => member.users.full_name).join(", ")}
      >
        <AvatarGroup max={maxAvatars}>
          {members.slice(0, maxAvatars).map((member) => (
            <Tooltip key={member.student_id} title={member.users.full_name}>
              <Avatar sx={{ bgcolor: "primary.main" }}>
                {member.users.full_name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")}
              </Avatar>
            </Tooltip>
          ))}
          <Avatar>+{members.length - maxAvatars}</Avatar>
        </AvatarGroup>
      </Tooltip>
    );
  };

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

  if (topics.length === 0 && !loading && !error)
    return <Alert severity="info">Không có đề tài nào.</Alert>;

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
      <Grid container spacing={2}>
        {topics.map((topic) => (
          <Grid item xs={12} sm={6} md={4} key={topic.id}>
            <Card
              sx={{
                borderColor: topic.registeredByUser ? "green" : "default",
                borderWidth: topic.registeredByUser ? 2 : 1,
                borderStyle: "solid",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  component="div"
                  color="primary.main"
                  gutterBottom
                  sx={{ fontWeight: "bold" }}
                >
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
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Giảng viên: {topic.lecturer?.full_name || "Chưa có"}
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
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Hạn đăng ký:{" "}
                  {moment(topic.registration_deadline).format("DD/MM/YYYY")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    Nhóm đăng ký:
                  </Typography>
                  {renderStudentAvatars(
                    topic.student_groups?.[0]?.student_group_members || []
                  )}
                </Box>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent:
                    user?.role === "lecturer" ? "space-between" : "flex-end",
                }}
              >
                {user?.role === "student" && (
                  <Box>
                    {/* Nút đăng ký chỉ hiển thị cho sinh viên và khi đề tài được phê duyệt */}
                    {topic.approval_status === "approved" && (
                      <>
                        {!topic.registeredByUser && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleRegisterTopic(topic)}
                            disabled={
                              moment().isAfter(topic.registration_deadline) ||
                              registerLoading
                            }
                          >
                            {registerLoading ? (
                              <CircularProgress size={20} />
                            ) : (
                              "Đăng ký"
                            )}
                          </Button>
                        )}
                        {topic.registeredByUser && (
                          <Chip label="Đã đăng ký" color="success" />
                        )}
                      </>
                    )}
                  </Box>
                )}

                {user?.role === "lecturer" && (
                  <>
                    <IconButton
                      color="primary"
                      component={RouterLink}
                      to={`/classes/${classId}/topics/${topic.id}/edit`}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      color="error"
                      size="small"
                      onClick={(event) => handleClick(event, topic)}
                      disabled={deletingTopic || approvingTopic}
                    >
                      <MoreVertIcon />
                    </IconButton>
                    <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                      <MenuItem
                        onClick={() => handleApproveTopic(selectedTopic.id)}
                        disabled={approvingTopic === selectedTopic.id}
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
                    </Menu>
                  </>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ClassTopics;
