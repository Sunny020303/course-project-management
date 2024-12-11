import React from "react";
import { Button, Chip, Alert, CircularProgress } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import moment from "moment";

function RegistrationStatus({
  topic,
  user,
  handleRegisterTopic,
  handleCancelRegistration,
  registerLoading,
  userGroup,
  handleRequestSwap,
}) {
  if (!user || user.role !== "student") {
    return null;
  }

  if (topic.registeredByUser) {
    return (
      <Button
        size="small"
        variant="outlined"
        color="error"
        onClick={() => handleCancelRegistration(topic)}
        disabled={registerLoading}
      >
        {registerLoading ? <CircularProgress size={20} /> : "Hủy đăng ký"}
      </Button>
    );
  }

  if (topic.approval_status === "rejected") {
    return (
      <Alert severity="warning" size="small">
        Đề tài đã bị từ chối.
      </Alert>
    );
  }

  if (moment().isAfter(topic.registration_deadline)) {
    return <Alert severity="warning">Hết hạn đăng ký</Alert>;
  }

  if (!topic.registered_group) {
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

  if (userGroup) {
    return (
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        startIcon={<SwapHorizIcon />}
        onClick={() => handleRequestSwap(topic)}
        disabled={registerLoading}
      >
        {registerLoading ? <CircularProgress size={20} /> : "Yêu cầu trao đổi"}
      </Button>
    );
  }

  return null;
}

export default RegistrationStatus;
