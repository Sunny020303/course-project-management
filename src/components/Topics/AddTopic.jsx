import React, { useState } from "react";
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
import { createTopic } from "../../services/topicService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";

function AddTopic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxMembers, setMaxMembers] = useState(1);
  const [registrationDeadline, setRegistrationDeadline] = useState(
    moment().format("YYYY-MM-DDTHH:mm")
  );
  const [reportSubmissionDeadline, setReportSubmissionDeadline] = useState(
    moment().format("YYYY-MM-DDTHH:mm")
  );
  const [approvalDeadline, setApprovalDeadline] = useState(
    moment().format("YYYY-MM-DDTHH:mm")
  );
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    switch (name) {
      case "name":
        setName(value);
        break;
      case "description":
        setDescription(value);
        break;
      case "max_members":
        setMaxMembers(parseInt(value, 10));
        break;
      case "registration_deadline":
        setRegistrationDeadline(value);
        break;
      case "report_submission_deadline":
        setReportSubmissionDeadline(value);
        break;
      case "approval_deadline":
        setApprovalDeadline(value);
        break;
      default:
        break;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên đề tài.");
      setLoading(false);
      return;
    }

    if (maxMembers < 1) {
      setError("Số lượng thành viên tối đa phải ít nhất là 1.");
      setLoading(false);
      return;
    }

    try {
      const { error: createError } = await createTopic({
        class_id: classId,
        lecturer_id: user.id,
        name,
        description,
        max_members: maxMembers,
        registration_deadline: registrationDeadline,
        report_submission_deadline: reportSubmissionDeadline,
        approval_deadline: approvalDeadline,
      });

      if (createError) throw createError;

      setSuccess("Đề tài đã được tạo thành công.");
      setName("");
      setDescription("");
      setMaxMembers(1);
      setRegistrationDeadline(moment().format("YYYY-MM-DDTHH:mm"));
      setReportSubmissionDeadline(moment().format("YYYY-MM-DDTHH:mm"));
      setApprovalDeadline(moment().format("YYYY-MM-DDTHH:mm"));
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Tạo đề tài mới
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
                value={name}
                onChange={handleInputChange}
                required
                variant="outlined"
                error={!name.trim() && error}
                helperText={!name.trim() && error}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mô tả"
                name="description"
                value={description}
                onChange={handleInputChange}
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Số thành viên tối đa"
                name="max_members"
                type="number"
                value={maxMembers}
                onChange={handleInputChange}
                inputProps={{ min: "1", step: "1" }}
                required
                variant="outlined"
                error={maxMembers < 1 && error}
                helperText={maxMembers < 1 && error}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hạn đăng ký"
                name="registration_deadline"
                type="datetime-local"
                value={registrationDeadline}
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
                value={reportSubmissionDeadline}
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
                value={approvalDeadline}
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
                  "Tạo đề tài"
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default AddTopic;
