import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  getTopic,
  registerTopic,
  deleteTopic,
  getTopicSwapRequests,
  updateTopicResult,
  getTopicResult,
} from "../../services/topicService";
import { useAuth } from "../../context/AuthContext";
import {
  Typography,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Box,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
  AvatarGroup,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Snackbar,
  IconButton,
  Stack,
  TextField,
  Link,
} from "@mui/material";
import { Container } from "@mui/system";
import moment from "moment";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Person as PersonIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Grade as GradeIcon,
  Notes as NotesIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import { getGroup, createGroup } from "../../services/groupService";
import RegistrationStatus from "./RegistrationStatus";

function TopicDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [currentTab, setCurrentTab] = useState("general");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [isRegistering, setIsRegistering] = useState(false);
  const [userGroup, setUserGroup] = useState(null);
  const [swapRequests, setSwapRequests] = useState([]);
  const [isUpdatingResult, setIsUpdatingResult] = useState(false);
  const [result, setResult] = useState({
    score: null,
    notes: "",
    report_url: "",
  });
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportUrl, setReportUrl] = useState("");

  const fetchUserGroup = useCallback(async () => {
    if (user && topic) {
      try {
        const { data, error } = await getGroup(user.id, topic.class_id);
        if (error) throw error;
        setUserGroup(data);
      } catch (error) {
        console.error("Error getting user group", error);
      }
    }
  }, [user, topic]);

  useEffect(() => {
    fetchUserGroup();
  }, [fetchUserGroup]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const fetchTopic = useCallback(async () => {
    try {
      setLoading(true);

      let { data, error } = await getTopic(id, user);

      if (error) throw error;

      setTopic(data);
    } catch (error) {
      console.error("Error fetching topic details:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  const fetchSwapRequests = useCallback(async () => {
    try {
      if (!userGroup) return;
      const { data, error } = await getTopicSwapRequests(userGroup.id);
      if (error) throw error;

      setSwapRequests(data);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      showSnackbar("Failed to fetch swap requests.", "error");
    }
  }, [userGroup]);

  const handleDeleteTopic = async (topicId) => {
    setDeleting(true);
    try {
      const { error } = await deleteTopic(topicId);
      if (error) throw error;

      navigate(`/classes/${topic.class_id}`, { replace: true });
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("Xóa đề tài thất bại.");
    } finally {
      setDeleting(false);
    }
  };

  const handleResultChange = (event) => {
    const { name, value } = event.target;
    setResult((prevResult) => ({
      ...prevResult,
      [name]: value,
    }));
  };

  const handleEditResult = () => {
    setIsEditingResult(true);
  };

  const handleCancelEditResult = () => {
    fetchTopic();
    setIsEditingResult(false);
  };

  const handleUpdateResult = async () => {
    setIsUpdatingResult(true);
    try {
      const { error } = await updateTopicResult(
        topic.registered_group.id,
        result
      );
      if (error) throw error;
      showSnackbar("Cập nhật kết quả thành công", "success");
      await fetchTopic();
      setIsEditingResult(false);
    } catch (error) {
      console.error("Error updating topic result:", error);
      showSnackbar("Lỗi khi cập nhật kết quả", "error");
    } finally {
      setIsUpdatingResult(false);
    }
  };

  const handleReportUrlChange = (event) => {
    setReportUrl(event.target.value);
  };

  const handleSubmitReport = async () => {
    setIsSubmittingReport(true);
    try {
      const { error } = await updateTopicResult(topic.registered_group.id, {
        report_url: reportUrl,
      });
      if (error) throw error;

      showSnackbar("Nộp báo cáo thành công", "success");
      await fetchTopic();
      setReportUrl("");
    } catch (error) {
      console.error("Error submitting report:", error);
      showSnackbar("Lỗi khi nộp báo cáo", "error");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  useEffect(() => {
    if (topic && topic.registered_group) {
      const fetchTopicResult = async () => {
        try {
          const { data, error } = await getTopicResult(
            topic.registered_group.id
          );
          if (error && error.code !== "PGRST116") throw error;
          if (data) setResult(data);
        } catch (error) {
          console.error("Error fetching topic result:", error);
        }
      };
      fetchTopicResult();
    }
  }, [topic]);

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

  const showSnackbar = (message, severity = "success") => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
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
    return (
      <Alert severity="error">
        Đã có lỗi xảy ra khi tải thông tin đề tài: {error}
      </Alert>
    );
  }

  if (!topic) {
    return <Typography variant="body1">Không tìm thấy đề tài.</Typography>;
  }

  if (
    user &&
    ((user.role === "lecturer" && topic.class.lecturer_id !== user.id) ||
      (user.role === "admin" && topic.class.is_final_project))
  ) {
    return (
      <Alert severity="error">
        Bạn không phải là giảng viên của lớp học này.
      </Alert>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={
            <Typography
              variant="h5"
              align="center"
              color="primary.main"
              gutterBottom
            >
              {topic.name}
            </Typography>
          }
          sx={{ bgcolor: "grey.200" }}
          action={
            (user?.role === "lecturer" || user?.role === "admin") && (
              <Box>
                <Tooltip title="Xóa đề tài">
                  <IconButton
                    color="error"
                    size="small"
                    onClick={handleDeleteTopic}
                    disabled={deleting}
                  >
                    {deleting ? <CircularProgress size={20} /> : <DeleteIcon />}
                  </IconButton>
                </Tooltip>
                <Tooltip title="Chỉnh sửa đề tài">
                  <IconButton
                    color="primary"
                    component={RouterLink}
                    to={`/classes/${topic.class_id}/topics/${topic.id}/edit`}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Tabs
                value={currentTab}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                centered
              >
                <Tab
                  label="Thông tin chung"
                  value="general"
                  icon={<DescriptionIcon />}
                />
                <Tab label="Nhóm đăng ký" value="group" icon={<GroupIcon />} />
                {(topic.registeredByUser || user.role === "lecturer") && (
                  <Tab label="Kết quả" value="result" icon={<GradeIcon />} />
                )}
              </Tabs>
            </Grid>
            <Grid item xs={12}>
              {currentTab === "general" && (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="body1" paragraph>
                        {topic.description || "Không có mô tả"}
                      </Typography>
                    </Grid>

                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Giảng viên:{" "}
                          {topic.lecturer?.full_name || "Chưa có giảng viên"}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <GroupIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Thành viên tối đa: {topic.max_members}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Hạn đăng ký:{" "}
                          {moment(topic.registration_deadline).format(
                            "DD/MM/YYYY"
                          )}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Hạn nộp báo cáo:{" "}
                          {moment(topic.report_submission_deadline).format(
                            "DD/MM/YYYY"
                          )}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={6}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Hạn phê duyệt:{" "}
                          {moment(topic.approval_deadline).format("DD/MM/YYYY")}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ mt: 2, mb: 2 }} />
                    </Grid>

                    <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary">
                          Trạng thái:
                        </Typography>
                        <Chip
                          label={
                            topic.approval_status === "approved"
                              ? "Đã duyệt"
                              : topic.approval_status === "rejected"
                              ? "Bị từ chối"
                              : "Chờ duyệt"
                          }
                          color={
                            topic.approval_status === "approved"
                              ? "success"
                              : topic.approval_status === "rejected"
                              ? "error"
                              : "warning"
                          }
                        />
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {currentTab === "group" && (
                <Box sx={{ mt: 2 }}>
                  {topic.registered_group ? (
                    <>
                      <Typography variant="subtitle1" gutterBottom>
                        Nhóm đã đăng ký:
                      </Typography>
                      {renderStudentAvatars(topic.student_group_members)}
                      <Box sx={{ mt: 2 }}>
                        {user?.role === "student" && (
                          <RegistrationStatus
                            topic={topic}
                            userGroup={userGroup}
                            swapRequests={swapRequests}
                            showSnackbar={showSnackbar}
                            fetchTopics={fetchTopic}
                            fetchUserGroup={fetchUserGroup}
                            fetchSwapRequests={fetchSwapRequests}
                          />
                        )}
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">
                      Chưa có nhóm nào đăng ký đề tài này.
                    </Typography>
                  )}
                </Box>
              )}

              {currentTab === "result" && (
                <Box sx={{ mt: 2 }}>
                  {topic.registeredByUser && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Nộp báo cáo
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Link báo cáo"
                            name="report_url"
                            value={reportUrl}
                            onChange={handleReportUrlChange}
                            variant="outlined"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmitReport}
                            disabled={
                              isSubmittingReport ||
                              moment().isAfter(topic.report_submission_deadline)
                            }
                          >
                            {isSubmittingReport ? (
                              <CircularProgress size={24} color="inherit" />
                            ) : (
                              "Nộp báo cáo"
                            )}
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                  {user?.role === "lecturer" && topic.registered_group && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Cập nhật kết quả
                      </Typography>
                      {isEditingResult ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              label="Điểm số"
                              name="score"
                              type="number"
                              value={result.score || ""}
                              onChange={handleResultChange}
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Nhận xét"
                              name="notes"
                              multiline
                              rows={4}
                              value={result.notes}
                              onChange={handleResultChange}
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Link báo cáo"
                              name="report_url"
                              value={result.report_url}
                              onChange={handleResultChange}
                              variant="outlined"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={handleUpdateResult}
                              disabled={isUpdatingResult}
                              sx={{ mr: 1 }}
                            >
                              {isUpdatingResult ? (
                                <CircularProgress size={24} color="inherit" />
                              ) : (
                                "Lưu"
                              )}
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={handleCancelEditResult}
                              disabled={isUpdatingResult}
                            >
                              Hủy
                            </Button>
                          </Grid>
                        </Grid>
                      ) : (
                        <Button
                          variant="outlined"
                          onClick={handleEditResult}
                          disabled={isUpdatingResult}
                        >
                          Chỉnh sửa kết quả
                        </Button>
                      )}
                    </>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Kết quả
                    </Typography>
                    {result.score || result.notes || result.report_url ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Điểm số:
                          </Typography>
                          <Typography variant="body1">
                            {result.score}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Nhận xét:
                          </Typography>
                          <Typography variant="body1">
                            {result.notes}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Link báo cáo:
                          </Typography>
                          <Link
                            href={`//${result.report_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {result.report_url}
                          </Link>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Chưa có kết quả cho đề tài này.
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        severity={snackbarSeverity}
      />
    </Container>
  );
}

export default TopicDetails;
