import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Typography,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GroupIcon from "@mui/icons-material/Group";

function GroupDialog({ open, onClose, topic }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6" display="flex" alignItems="center">
          <GroupIcon sx={{ mr: 1 }} />
          {topic?.registered_group?.group_name
            ? `Nhóm: ${topic.registered_group?.group_name}`
            : "Thông tin nhóm"}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {topic?.registered_group && (
          <>
            {topic.id && (
              <Typography variant="body2" sx={{ mb: 2 }}>
                <AssignmentIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Đề tài đã đăng ký: {topic.name}
              </Typography>
            )}
            {topic.student_group_members &&
            topic.student_group_members.length > 0 ? (
              <Grid container spacing={2}>
                {topic.student_group_members.map((member) => (
                  <Grid item xs={12} key={member.student_id}>
                    <ListItem>
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
                        secondary={`Mã số: ${
                          member.users.student_code ||
                          member.users.lecturer_code ||
                          "Không có mã"
                        }`}
                      />
                    </ListItem>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Nhóm chưa có thành viên nào.
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default GroupDialog;
