import React, { useState, useEffect, useCallback } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Link,
  DialogContentText,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import {
  createGroup,
  getGroups,
  joinGroup,
  leaveGroup,
  getGroup,
} from "../../services/groupService";
import { Link as RouterLink, useParams } from "react-router-dom";
import supabase from "../../services/supabaseClient";

function GroupManagement() {
  const { classId } = useParams();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [availableGroups, setAvailableGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupError, setGroupError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [currentGroup, setCurrentGroup] = useState(null);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [openGroupInfoDialog, setOpenGroupInfoDialog] = useState(false);
  const [selectedGroupInfo, setSelectedGroupInfo] = useState(null);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const handleGroupNameChange = (event) => {
    setGroupName(event.target.value);
  };

  const handleCreateGroup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: createError } = await createGroup(
        classId,
        [user.id],
        groupName
      );
      if (createError) throw createError;

      setSuccess("Nhóm đã được tạo thành công.");
      setGroupName("");
      await fetchUserGroup();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTermChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const fetchAvailableGroups = useCallback(async () => {
    setLoadingGroups(true);
    setGroupError(null);
    try {
      const { data: groups, error: groupsError } = await getGroups(classId);
      if (groupsError) throw groupsError;

      const filteredGroups = groups.filter((group) => {
        const groupNameMatch =
          group.group_name &&
          group.group_name.toLowerCase().includes(searchTerm.toLowerCase());
        const memberNameMatch = group.student_group_members.some((member) =>
          member.users.full_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
        const groupIdMatch = group.id
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return groupNameMatch || memberNameMatch || groupIdMatch;
      });

      setAvailableGroups(filteredGroups);
    } catch (error) {
      setGroupError(error.message);
    } finally {
      setLoadingGroups(false);
    }
  }, [classId, searchTerm]);

  useEffect(() => {
    fetchAvailableGroups();
  }, [fetchAvailableGroups]);

  const handleJoinGroup = async (groupId) => {
    setLoading(true);
    setError(null);

    try {
      const { error: joinError } = await joinGroup(groupId, user.id);
      if (joinError) throw joinError;

      setSuccess("Tham gia nhóm thành công.");
      await fetchAvailableGroups();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGroup = useCallback(async () => {
    if (user && classId) {
      try {
        const { data, error } = await getGroup(user.id, classId);
        if (error) throw error;
        setCurrentGroup(data);
      } catch (error) {
        console.error("Error getting user group", error);
        setError(error.message);
      }
    }
  }, [user, classId]);

  useEffect(() => {
    fetchUserGroup();
  }, [fetchUserGroup, availableGroups]);

  const handleLeaveGroup = async () => {
    setIsLeavingGroup(true);
    try {
      const { error } = await leaveGroup(currentGroup.id, user.id);
      if (error) throw error;

      setCurrentGroup(null);
      setSuccess("Đã rời khỏi nhóm.");
    } catch (error) {
      setError("Lỗi khi rời nhóm: " + error.message);
    } finally {
      setIsLeavingGroup(false);
    }
  };

  const handleOpenGroupInfo = (group) => {
    setSelectedGroupInfo(group);
    setOpenGroupInfoDialog(true);
  };

  const handleCloseGroupInfo = () => {
    setSelectedGroupInfo(null);
    setOpenGroupInfoDialog(false);
  };

  const handleEditGroupName = () => {
    setNewGroupName(currentGroup.group_name || "");
    setIsEditingGroupName(true);
  };

  const handleSaveGroupName = async () => {
    try {
      const { error } = await supabase
        .from("student_groups")
        .update({ group_name: newGroupName })
        .eq("id", currentGroup.id);
      if (error) throw error;

      setCurrentGroup({
        ...currentGroup,
        group_name: newGroupName,
      });
      setSuccess("Đổi tên nhóm thành công.");
    } catch (error) {
      setError("Lỗi khi đổi tên nhóm: " + error.message);
    } finally {
      setIsEditingGroupName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGroupName(false);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>
          Quản lý nhóm
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

        <form onSubmit={handleCreateGroup}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <TextField
                label="Tên nhóm"
                variant="outlined"
                fullWidth
                required
                value={groupName}
                onChange={handleGroupNameChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Tạo nhóm"
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tham gia nhóm
        </Typography>
        <TextField
          label="Tìm kiếm nhóm"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchTermChange}
          sx={{ mb: 2 }}
        />
        {groupError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {groupError}
          </Alert>
        )}
        {loadingGroups ? (
          <CircularProgress />
        ) : availableGroups.length > 0 ? (
          <List>
            {availableGroups.map((group) => (
              <ListItem
                key={group.id}
                secondaryAction={
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleOpenGroupInfo(group)}
                    >
                      Xem thông tin
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Tham gia"
                      )}
                    </Button>
                  </>
                }
              >
                <ListItemText
                  primary={group.group_name || `ID: ${group.id}`}
                  secondary={`Thành viên: ${group.student_group_members
                    .map((member) => member.users.full_name)
                    .join(", ")}`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Không tìm thấy nhóm phù hợp.
          </Typography>
        )}
      </Paper>
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Nhóm hiện tại
        </Typography>
        {currentGroup ? (
          <>
            {isEditingGroupName ? (
              <TextField
                label="Tên nhóm"
                variant="outlined"
                fullWidth
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography variant="body1">
                Tên nhóm: {currentGroup.group_name || currentGroup.id}
              </Typography>
            )}
            {currentGroup.topic_id && (
              <Typography variant="body2">
                Đề tài đã đăng ký:{" "}
                <Link
                  component={RouterLink}
                  to={`/topics/details/${currentGroup.topic_id}`}
                >
                  Xem chi tiết đề tài
                </Link>
              </Typography>
            )}
            <List>
              {currentGroup.members.map((member) => (
                <ListItem key={member.student_id}>
                  <ListItemText
                    primary={member.users.full_name}
                    secondary={`Mã số: ${
                      member.users.student_code ||
                      member.users.lecturer_code ||
                      "Không có mã"
                    }`}
                  />
                </ListItem>
              ))}
            </List>

            {isEditingGroupName ? (
              <Box>
                <Button
                  variant="contained"
                  onClick={handleSaveGroupName}
                  sx={{ mr: 1 }}
                >
                  Lưu
                </Button>
                <Button variant="outlined" onClick={handleCancelEdit}>
                  Hủy
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                onClick={handleEditGroupName}
                sx={{ mr: 1 }}
              >
                Đổi tên nhóm
              </Button>
            )}

            <Button
              variant="contained"
              color="error"
              onClick={handleLeaveGroup}
              disabled={isLeavingGroup}
            >
              {isLeavingGroup ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                "Rời nhóm"
              )}
            </Button>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Bạn chưa tham gia nhóm nào.
          </Typography>
        )}
      </Paper>
      <Dialog open={openGroupInfoDialog} onClose={handleCloseGroupInfo}>
        <DialogTitle>
          <Typography variant="h6">Thông tin nhóm</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedGroupInfo && (
            <>
              <Typography variant="body1">
                Tên nhóm: {selectedGroupInfo.group_name || "Nhóm chưa đặt tên"}
              </Typography>
              <Typography variant="body2">
                Thành viên:{" "}
                {selectedGroupInfo.student_group_members
                  .map((member) => member.users.full_name)
                  .join(", ")}
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGroupInfo}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default GroupManagement;
