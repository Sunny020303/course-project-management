import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import supabase from "../../services/supabaseClient";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Pagination,
  TextField,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Link, Link as RouterLink } from "react-router-dom";
import { Container } from "@mui/system";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { getTopics, registerTopic } from "../../services/topicService";

const TOPICS_PER_PAGE = 10; // Số lượng đề tài trên mỗi trang

function ClassTopics() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // Trạng thái đề tài
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Lắng nghe thay đổi trạng thái đăng nhập
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await getTopics(
          classId,
          searchQuery,
          selectedStatus,
          currentPage,
          TOPICS_PER_PAGE
        );
        if (error) throw error;

        // Kiểm tra đăng ký của người dùng hiện tại
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

    fetchTopics();
  }, [classId, currentPage, searchQuery, selectedStatus, user]);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  async function handleRegisterTopic(topicId) {
    if (!user) {
      // Chưa đăng nhập, chuyển hướng đến trang đăng nhập
      navigate("/login");
      return;
    }

    try {
      // Thêm bản ghi vào bảng topic_registrations
      const { error } = await registerTopic(topicId, user.id);

      if (error) {
        throw error;
      }

      // Cập nhật lại danh sách đề tài sau khi đăng ký thành công
      const updatedTopics = topics.map((topic) => {
        if (topic.id === topicId) {
          return { ...topic, registeredByUser: true };
        }
        return topic;
      });
      setTopics(updatedTopics);

      // Hiển thị thông báo đăng ký thành công (có thể sử dụng Snackbar hoặc Alert)
      alert("Đăng ký đề tài thành công"); // nên thay bằng snackbar hoặc alert
    } catch (error) {
      console.error("Error registering topic:", error);
      alert("Đăng ký đề tài thất bại"); // nên thay bằng snackbar hoặc alert
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container maxWidth="md" sx={{ flexGrow: 1, marginTop: 2 }}>
        <TextField
          label="Tìm kiếm đề tài"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="status-select-label">Trạng thái</InputLabel>
          <Select
            labelId="status-select-label"
            id="status-select"
            value={selectedStatus}
            label="Trạng thái"
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="pending">Chờ phê duyệt</MenuItem>
            <MenuItem value="approved">Đã phê duyệt</MenuItem>
            <MenuItem value="rejected">Bị từ chối</MenuItem>
          </Select>
        </FormControl>
        <Grid container spacing={2}>
          {topics.map((topic) => (
            <Grid item xs={12} sm={6} md={4} key={topic.id}>
              <Card
                sx={{
                  borderColor: topic.registeredByUser ? "green" : "default", // Đổi màu border nếu đã đăng ký
                  borderWidth: topic.registeredByUser ? 2 : 1,
                  borderStyle: "solid",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    component="div"
                    color="primary.dark"
                    gutterBottom
                  >
                    <Link
                      component={RouterLink}
                      to={`/topics/${topic.id}`}
                      sx={{
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {topic.name}
                    </Link>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topic.lecturers?.full_name || "Chưa có"}
                  </Typography>
                  {/* Hiển thị thêm thông tin khác nếu cần */}
                </CardContent>
                <CardActions>
                  <CardActions>
                    <Button
                      size="small"
                      variant="outlined"
                      component={RouterLink}
                      to={`/topics/${topic.id}`}
                    >
                      Xem chi tiết
                    </Button>
                    {!topic.registeredByUser &&
                      user &&
                      user.role === "student" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleRegisterTopic(topic.id)}
                        >
                          Đăng ký
                        </Button>
                      )}
                  </CardActions>
                  {!topic.registeredByUser &&
                    user &&
                    user.role === "student" && ( // Chỉ hiển thị cho sinh viên chưa đăng ký
                      <Button size="small" variant="contained" color="primary">
                        Đăng ký
                      </Button>
                    )}
                  {topic.registeredByUser &&
                    user &&
                    user.role === "student" && ( // Chỉ hiển thị cho sinh viên đã đăng ký
                      <Typography variant="body2" color="green">
                        Đã đăng ký
                      </Typography>
                    )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Pagination
          count={Math.ceil(topics.length / TOPICS_PER_PAGE)}
          page={currentPage}
          onChange={handlePageChange}
          sx={{ mt: 2, display: "flex", justifyContent: "center" }}
        />
      </Container>
      <Footer />
    </Box>
  );
}

export default ClassTopics;
