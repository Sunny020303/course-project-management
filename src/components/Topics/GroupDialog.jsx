import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Button,
  Typography,
} from "@mui/material";

function GroupDialog({ open, onClose, members }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h6">Thông tin nhóm</Typography>
      </DialogTitle>
      <DialogContent>
        {members && members.length > 0 ? (
          <List>
            {members.map((member) => (
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
                  secondary={`Mã số: ${
                    member.users.student_code ||
                    member.users.lecturer_code ||
                    "Không có mã"
                  }`}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Nhóm chưa có thành viên nào.
          </Typography>
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
