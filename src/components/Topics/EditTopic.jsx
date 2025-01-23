import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
} from "@mui/material";
import { updateTopic, getTopic } from "../../services/topicService";
import { getClassLecturers } from "../../services/classService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";

function EditTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId, topicId } = useParams();
  const [classLecturers, setClassLecturers] = useState(null);
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [navigate, user]);

  useEffect(() => {
    const fetchTopic = async () => {
      setLoading(true);
      try {
        const { data, error } = await getTopic(topicId);
        if (error) throw error;
        setTopic(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [topicId]);

  useEffect(() => {
    const fetchClassLecturers = async () => {
      setLoading(true);
      try {
        const { data, error } = await getClassLecturers(classId);
        if (error) throw error;
        console.log(data);
        setClassLecturers(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassLecturers();
  }, [classId]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setTopic({ ...topic, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!topic.name.trim()) {
      setError("Vui lòng nhập tên đề tài.");
      setLoading(false);
      return;
    }

    if (topic.max_members < 1) {
      setError("Số lượng thành viên tối đa phải ít nhất là 1.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await updateTopic({ ...topic });
      if (updateError) throw updateError;
      setSuccess("Đề tài đã được cập nhật thành công.");
      navigate(`/classes/${classId}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Container maxWidth="md">Đang tải...</Container>;
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!topic) {
    return <Container maxWidth="md">Không tìm thấy đề tài.</Container>;
  }

  if (
    (user.role === "lecturer" && topic.lecturer_id !== user.id) ||
    (user.role === "admin" && !topic.class.is_final_project)
  ) {
    return (
      <Alert severity="error">
        Bạn không phải là giảng viên của đề tài này.
      </Alert>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Chỉnh sửa đề tài
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tên đề tài"
                name="name"
                value={topic.name}
                onChange={handleInputChange}
                required
                variant="outlined"
                error={!topic.name.trim() && error}
                helperText={!topic.name.trim() && error}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={topic.description}
                onChange={handleInputChange}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="lecturer-label">
                  Giảng viên hướng dẫn
                </InputLabel>
                <Select
                  labelId="lecturer-label"
                  label="Giảng viên hướng dẫn"
                  name="lecturer_id"
                  value={topic.lecturer_id}
                  onChange={handleInputChange}
                >
                  {classLecturers &&
                    classLecturers.map((classLecturer) => (
                      <MenuItem
                        key={classLecturer.lecturer_id}
                        value={classLecturer.lecturer_id}
                      >
                        {classLecturer.lecturer.full_name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số thành viên tối đa"
                name="max_members"
                type="number"
                value={topic.max_members}
                onChange={handleInputChange}
                inputProps={{ min: "1", step: "1" }}
                required
                variant="outlined"
                error={topic.max_members < 1 && error}
                helperText={topic.max_members < 1 && error}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hạn đăng ký"
                name="registration_deadline"
                type="datetime-local"
                value={moment(topic.registration_deadline).format(
                  "YYYY-MM-DDTHH:mm"
                )}
                onChange={handleInputChange}
                required
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hạn nộp báo cáo"
                name="report_submission_deadline"
                type="datetime-local"
                value={moment(topic.report_submission_deadline).format(
                  "YYYY-MM-DDTHH:mm"
                )}
                onChange={handleInputChange}
                required
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hạn phê duyệt"
                name="approval_deadline"
                type="datetime-local"
                value={moment(topic.approval_deadline).format(
                  "YYYY-MM-DDTHH:mm"
                )}
                onChange={handleInputChange}
                required
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Cập nhật đề tài"
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default EditTopic;
