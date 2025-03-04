import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Tooltip,
  Link,
  Divider,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Box,
  AvatarGroup,
  Avatar,
  Button,
  Chip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Event as EventIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import RegistrationStatus from "./RegistrationStatus";
import {
  deleteTopic,
  approveTopic,
  rejectTopic,
} from "../../services/topicService";

const TopicCard = React.memo(function TopicCard({
  currentClass,
  topic,
  userGroup,
  swapRequests,
  showSnackbar,
  fetchTopics,
  fetchUserGroup,
  fetchSwapRequests,
  handleOpenGroupDialog,
}) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [approvingTopic, setApprovingTopic] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = (event, topic) => {
    setAnchorEl(event.currentTarget);
    setSelectedTopic(topic);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedTopic(null);
  };

  const handleEditTopic = (topicId) => {
    navigate(`/classes/${classId}/topics/${topicId}/edit`);
  };

  const handleApproveTopic = async (topicId) => {
    setApprovingTopic(topicId);
    try {
      const { error } = await approveTopic(topicId);
      if (error) throw error;

      await fetchTopics();
      showSnackbar("Phê duyệt đề tài thành công", "success");
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
      const { error } = await rejectTopic(topicId);
      if (error) throw error;

      await fetchTopics();
      showSnackbar("Từ chối đề tài thành công", "success");
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

      await fetchTopics();
      showSnackbar("Xóa đề tài thành công", "success");
    } catch (error) {
      showSnackbar("Xóa đề tài thất bại", "error");
      alert("Xóa đề tài thất bại.");
    } finally {
      setDeletingTopic(null);
      handleClose();
    }
  };

  const renderStudentAvatars = useMemo(
    () => (topic) => {
      if (
        !topic.student_group_members ||
        topic.student_group_members.length === 0
      ) {
        return (
          <Tooltip title="Chưa có sinh viên đăng ký">
            <PersonIcon />
          </Tooltip>
        );
      }

      const maxAvatars = 3;
      const avatarGroup = (
        <AvatarGroup max={maxAvatars}>
          {topic.student_group_members.map((member) => (
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

      return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {topic.registered_group?.group_name ? (
            <Tooltip title={`Nhóm: ${topic.registered_group?.group_name}`}>
              <Button
                size="small"
                color="primary"
                onClick={() => handleOpenGroupDialog(topic)}
                startIcon={<VisibilityIcon />}
                sx={{ marginRight: 1 }}
              >
                {topic.registered_group?.group_name}
              </Button>
            </Tooltip>
          ) : (
            <Button
              size="small"
              color="primary"
              onClick={() => handleOpenGroupDialog(topic)}
              startIcon={<VisibilityIcon />}
              sx={{ marginRight: 1 }}
            >
              Xem nhóm
            </Button>
          )}
          {topic.student_group_members?.length <= maxAvatars ? (
            avatarGroup
          ) : (
            <Tooltip
              title={topic.student_group_members
                .map((member) => member.users.full_name)
                .join(", ")}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {avatarGroup}
                <Typography variant="body2" color="text.secondary" ml={1}>
                  (+{topic.student_group_members.length - maxAvatars})
                </Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      );
    },
    [handleOpenGroupDialog]
  );

  const renderTopicStatus = useMemo(
    () => (topic) => {
      switch (topic.approval_status) {
        case "approved":
          return (
            <Chip
              label="Đã phê duyệt"
              color="success"
              size="small"
              icon={<CheckCircleIcon />}
            />
          );
        case "rejected":
          return (
            <Chip
              label="Bị từ chối"
              color="error"
              size="small"
              icon={<CancelIcon />}
            />
          );
        default:
          return (
            <Chip
              label="Chờ phê duyệt"
              color="warning"
              size="small"
              icon={<HourglassEmptyIcon />}
            />
          );
      }
    },
    []
  );

  return (
    <Card
      sx={{
        borderColor: topic.registeredByUser ? "green" : "default",
        borderWidth: topic.registeredByUser ? 2 : 1,
        borderStyle: "solid",
      }}
    >
      <CardContent>
        <Stack spacing={1}>
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <SchoolIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" noWrap>
              Giảng viên:{" "}
              {topic.lecturer?.full_name || <i>Chưa có giảng viên hướng dẫn</i>}
            </Typography>
          </Stack>
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <GroupIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Số lượng thành viên tối đa: {topic.max_members}
            </Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Hạn đăng ký:{" "}
              {moment(topic.registration_deadline).format("DD/MM/YYYY")}
            </Typography>
          </Stack>
          <Divider />
          <Stack direction="row" alignItems="center" spacing={1} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Trạng thái:
            </Typography>
            {renderTopicStatus(topic)}
          </Stack>
          {topic.registered_group ? (
            <Stack direction="row" alignItems="center" spacing={1} mt={1}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Nhóm:
              </Typography>
              {renderStudentAvatars(topic)}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" mt={1}>
              Chưa có nhóm đăng ký
            </Typography>
          )}
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          justifyContent:
            user?.role === "lecturer"
              ? "space-between"
              : user?.role === "admin"
              ? "space-between"
              : "flex-end",
        }}
      >
        {((user?.role === "admin" && currentClass?.is_final_project) ||
          (user?.role === "lecturer" && !currentClass?.is_final_project)) && (
          <>
            <Tooltip title="Chỉnh sửa">
              <IconButton
                color="primary"
                onClick={() => handleEditTopic(topic.id)}
                size="small"
                disabled={approvingTopic || deletingTopic}
              >
                <EditIcon />
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  Chỉnh sửa
                </Typography>
              </IconButton>
            </Tooltip>
            <Tooltip title="Tuỳ chọn">
              <IconButton
                color="secondary"
                size="small"
                onClick={(event) => handleClick(event, topic)}
                disabled={deletingTopic || approvingTopic}
              >
                <SettingsIcon />
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  Tuỳ chọn
                </Typography>
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              {selectedTopic && (
                <>
                  <MenuItem
                    onClick={() => handleApproveTopic(selectedTopic.id)}
                    disabled={
                      approvingTopic === selectedTopic.id ||
                      moment().isAfter(topic.approval_deadline)
                    }
                  >
                    {approvingTopic === selectedTopic.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      "Phê duyệt"
                    )}
                  </MenuItem>
                  <MenuItem
                    onClick={() => handleRejectTopic(selectedTopic.id)}
                    disabled={
                      approvingTopic === selectedTopic.id ||
                      moment().isAfter(topic.approval_deadline)
                    }
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

        <Box>
          <RegistrationStatus
            topic={topic}
            userGroup={userGroup}
            swapRequests={swapRequests}
            showSnackbar={showSnackbar}
            fetchTopics={fetchTopics}
            fetchUserGroup={fetchUserGroup}
            fetchSwapRequests={fetchSwapRequests}
          />
        </Box>
      </CardActions>
    </Card>
  );
});

export default TopicCard;
