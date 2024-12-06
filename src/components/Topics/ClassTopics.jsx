import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTopics, registerTopic } from "../../services/topicService";
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
  Avatar,
  AvatarGroup,
  Tooltip,
} from "@mui/material";
import { Link, Link as RouterLink } from "react-router-dom";
import { Container } from "@mui/system";
import SearchIcon from "@mui/icons-material/Search";
import moment from "moment";
import { getGroup, createGroup } from "../../services/groupService";
import { Add as AddIcon } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import { Person as PersonIcon } from "@mui/icons-material";

const TOPICS_PER_PAGE = 10; // Số lượng đề tài trên mỗi trang

function ClassTopics() {
  const { classId } = useParams();
  const navigate = useNavigate();
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
  const { user } = useAuth();

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

  const renderStudentAvatars = (studentIds) => {
    if (!studentIds || studentIds.length === 0) {
      return (
        <Tooltip title="Chưa có sinh viên đăng ký">
          <PersonIcon />
        </Tooltip>
      );
    }

    if (studentIds.length <= 5) {
      return (
        <AvatarGroup max={5}>
          {studentIds.map((studentId) => (
            <Avatar key={studentId} sx={{ bgcolor: "primary.main" }}>
              {studentId}
            </Avatar>
          ))}
        </AvatarGroup>
      );
    }

    return (
      <Tooltip title={studentIds.map((id) => id).join(", ")}>
        <AvatarGroup max={5}>
          {studentIds.slice(0, 5).map((studentId) => (
            <Avatar key={studentId} sx={{ bgcolor: "primary.main" }}>
              {studentId}
            </Avatar>
          ))}
        </AvatarGroup>
      </Tooltip>
    );
  };

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const fetchClassDetails = async () => {
      console.log("Fetching class details...", classId);
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
        if (user) {
          const registrations = await supabase
            .from("topic_registrations")
            .select("topic_id")
            .eq("student_id", user.id);
          const registeredTopicIds = registrations.data.map((r) => r.topic_id);
          data.forEach((topic) => {
            topic.registeredByUser = registeredTopicIds.includes(topic.id);
          });
        }

        setTopics(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentClass) fetchTopics();
  }, [classId, currentClass, currentPage, searchQuery, selectedStatus, user]);

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

  if (!currentClass) {
    return <Typography>Không tìm thấy lớp học</Typography>;
  }

  if (topics.length === 0 && !loading && !error) {
    return <Alert severity="info">Không có đề tài nào.</Alert>;
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
                  Giảng viên: {topic.lecturers?.full_name || "Chưa có"}
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
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 1 }}
                  >
                    Nhóm đăng ký:
                  </Typography>
                  {renderStudentAvatars(topic.student_ids)}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Hạn đăng ký:{" "}
                  {moment(topic.registration_deadline).format("DD/MM/YYYY")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Học kỳ: {formattedSemester(currentClass.semester)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Trạng thái:{" "}
                  {topic.approval_status === "pending"
                    ? "Chờ phê duyệt"
                    : topic.approval_status === "approved"
                    ? "Đã phê duyệt"
                    : "Bị từ chối"}
                </Typography>
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

                {user?.role === "lecturer" && ( // hiển thị nút Edit và Delete cho giảng viên
                  <>
                    <IconButton
                      color="primary"
                      component={RouterLink}
                      to={`/classes/${classId}/topics/${topic.id}/edit`}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
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
