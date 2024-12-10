import React from "react";
import { Button, Chip, Alert, CircularProgress } from "@mui/material";
import moment from "moment";

function RegistrationStatus({
  topic,
  user,
  handleRegisterTopic,
  registerLoading,
}) {
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
    !topic.registered_group &&
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
}

export default RegistrationStatus;
