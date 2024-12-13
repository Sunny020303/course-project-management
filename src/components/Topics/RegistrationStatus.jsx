import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button, Alert, CircularProgress } from "@mui/material";
import {
  Cancel as CancelIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";
import moment from "moment";
import {
  registerTopic,
  requestTopicSwap,
  cancelTopicSwap,
  cancelTopicRegistration,
} from "../../services/topicService";
import { createGroup } from "../../services/groupService";

function RegistrationStatus({
  topic,
  userGroup,
  swapRequests,
  showSnackbar,
  fetchTopics,
  fetchUserGroup,
  fetchSwapRequests,
}) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [registerLoading, setRegisterLoading] = useState(false);
  const [swapRequestId, setSwapRequestId] = useState(null);

  const handleRegisterTopic = async (topic) => {
    setRegisterLoading(true);

    try {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      let groupId = null;
      if (!userGroup) {
        const { data: newGroup, error: createGroupError } = await createGroup(
          classId,
          [user.id]
        );
        if (createGroupError) throw createGroupError;
        groupId = newGroup.id;
      } else {
        groupId = userGroup.id;
        if (userGroup.members.length > topic.max_members) {
          showSnackbar(
            `Nhóm của bạn có ${userGroup.members.length} thành viên, vượt quá số lượng tối đa ${topic.max_members} cho đề tài này.`,
            "error"
          );
          return;
        }
      }
      const { error: registerError } = await registerTopic(topic.id, groupId);
      if (registerError) throw registerError;
      await fetchTopics();
      await fetchUserGroup();
      showSnackbar("Đăng ký đề tài thành công!", "success");
    } catch (error) {
      console.error("Error registering topic:", error);
      if (error.code === "23505") {
        showSnackbar("Đề tài này đã có nhóm đăng ký.", "error");
      } else if (error.code === "23503") {
        showSnackbar("Lớp học không hợp lệ", "error");
      } else {
        showSnackbar(
          error.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
          "error"
        );
      }
    } finally {
      setRegisterLoading(true);
    }
  };

  const handleCancelRegistration = async (topic) => {
    try {
      if (!userGroup || !userGroup.topic_id) {
        showSnackbar("Nhóm của bạn chưa đăng ký đề tài nào.", "error");
        return;
      }

      const { error } = await cancelTopicRegistration(userGroup.id);
      if (error) throw error;

      await fetchTopics();
      await fetchUserGroup();
      showSnackbar("Hủy đăng ký đề tài thành công.", "success");
    } catch (error) {
      console.error("Error canceling topic registration:", error);
      showSnackbar("Hủy đăng ký đề tài thất bại.", "error");
    }
  };

  const handleRequestSwap = async (topic) => {
    try {
      if (!userGroup.topic_id) {
        showSnackbar("Nhóm của bạn chưa đăng ký đề tài nào.", "error");
        return;
      }

      const { error: requestError } = await requestTopicSwap(
        userGroup,
        topic.registered_group,
        topic.class_id
      );
      if (requestError) throw requestError;

      showSnackbar("Đã gửi yêu cầu trao đổi đề tài.", "success");
      await fetchSwapRequests();
    } catch (error) {
      console.error("Error requesting topic swap:", error);
      showSnackbar("Lỗi khi gửi yêu cầu trao đổi.", "error");
    }
  };

  const handleCancelSwap = async (requestId) => {
    try {
      const { error } = await cancelTopicSwap(requestId);
      if (error) throw error;

      await fetchSwapRequests();
      showSnackbar("Đã hủy yêu cầu trao đổi đề tài.");
    } catch (error) {
      console.error("Error cancelling topic swap:", error);
      showSnackbar("Lỗi khi hủy yêu cầu trao đổi.", "error");
    }
  };

  useEffect(() => {
    setSwapRequestId(
      swapRequests.find(
        (swapRequest) =>
          swapRequest.requesting_group_id === userGroup?.id &&
          swapRequest.requested_group_id === topic.registered_group?.id &&
          swapRequest.status === "pending"
      )?.id || null
    );
  }, [swapRequests, topic.registered_group?.id, userGroup]);

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

  if (swapRequestId) {
    return (
      <Button
        size="small"
        variant="outlined"
        color="error"
        startIcon={<CancelIcon />}
        onClick={() => handleCancelSwap(swapRequestId)}
        disabled={registerLoading}
      >
        {registerLoading ? <CircularProgress size={20} /> : "Huỷ yêu cầu"}
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
