import React, { useMemo } from "react";
import {
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Tooltip,
  Stack,
  Link,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  AvatarGroup,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Snackbar,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  Visibility as VisibilityIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Event as EventIcon,
} from "@mui/icons-material";

const renderAvatarGroup = (members) => (
  <AvatarGroup max={3}>
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

function TopicCard({
  topic,
  user,
  currentClass,
  classId,
  handleRegisterTopic,
  handleEditTopic,
  handleDeleteTopic,
  handleApproveTopic,
  handleRejectTopic,
  registerLoading,
  approvingTopic,
  deletingTopic,
  handleClick,
  anchorEl,
  selectedTopic,
  open,
  handleClose,
  handleOpenGroupDialog,
  selectedGroup,
  openGroupDialog,
  handleCloseGroupDialog,
  userGroup,
  handleJoinGroup,
  RegistrationStatus,
  snackbarOpen,
  handleSnackbarClose,
  snackbarMessage,
  snackbarSeverity,
  showSnackbar,
}) {
  const renderTopicStatus = useMemo(() => {
    return (topic) => {
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
    };
  }, []);

  const renderStudentAvatars = useMemo(() => {
    return (members, handleOpenGroupDialog) => {
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
          <Tooltip
            title={members.map((member) => member.users.full_name).join(", ")}
          >
            {renderAvatarGroup(members)}
          </Tooltip>
        );
      }

      return (
        <Tooltip
          title={members.map((member) => member.users.full_name).join(", ")}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Button
              size="small"
              color="primary"
              onClick={() => handleOpenGroupDialog(members)}
              startIcon={<VisibilityIcon />}
              sx={{ marginRight: 1 }}
            >
              Xem nhóm
            </Button>
            {renderAvatarGroup(members.slice(0, maxAvatars))}
            <Typography variant="body2" color="text.secondary" ml={1}>
              (+{members.length - maxAvatars})
            </Typography>
          </Box>
        </Tooltip>
      );
    };
  }, []);

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
          <Stack direction="row" alignItems="center" spacing={1}>
            <SchoolIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              Giảng viên:{" "}
              {topic.lecturer?.full_name || "Chưa có giảng viên hướng dẫn"}
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
          {topic.registered_group && (
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Nhóm đăng ký:
              </Typography>
              {renderStudentAvatars(
                topic.student_group_members,
                handleOpenGroupDialog
              )}
            </Box>
          )}
          <Dialog open={openGroupDialog} onClose={handleCloseGroupDialog}>
            <DialogTitle>Thông tin nhóm</DialogTitle>
            <DialogContent>
              {selectedGroup && selectedGroup.length > 0 && (
                <List>
                  {selectedGroup.map((member) => (
                    <ListItem key={member.student_id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          {member.users.full_name
                            .split(" ")
                            .map((name) => name[0])
                            .join("")}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.users.full_name}
                        secondary={member.users.student_code}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseGroupDialog}>Đóng</Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </CardContent>

      <CardActions
        sx={{
          justifyContent:
            user?.role === "lecturer" ? "space-between" : "flex-end",
        }}
      >
        {user?.role === "lecturer" && (
          <>
            <Tooltip title="Chỉnh sửa">
              <IconButton
                color="primary"
                onClick={() => handleEditTopic(topic.id)}
                size="small"
                disabled={approvingTopic || deletingTopic}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Tùy chọn">
              <IconButton
                color="error"
                size="small"
                onClick={(event) => handleClick(event, topic)}
                disabled={deletingTopic || approvingTopic}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
              {selectedTopic && (
                <>
                  <MenuItem
                    onClick={() => handleApproveTopic(selectedTopic.id)}
                    disabled={approvingTopic}
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
                </>
              )}
            </Menu>
          </>
        )}

        <RegistrationStatus
          topic={topic}
          user={user}
          handleRegisterTopic={handleRegisterTopic}
          registerLoading={registerLoading}
        />

        {!userGroup && user.role === "student" && (
          <Alert
            severity="info"
            action={
              <Button color="inherit" onClick={handleJoinGroup}>
                Tạo/Tham gia nhóm
              </Button>
            }
          >
            Bạn chưa tham gia nhóm nào. Vui lòng tạo hoặc tham gia một nhóm để
            đăng ký đề tài.
          </Alert>
        )}
      </CardActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        severity={snackbarSeverity}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </Card>
  );
}

export default TopicCard;
