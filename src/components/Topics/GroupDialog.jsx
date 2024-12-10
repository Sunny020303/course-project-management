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
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Thông tin nhóm</DialogTitle>
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
                  secondary={
                    member.users.student_code ||
                    member.users.lecturer_code ||
                    "Không có mã"
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1">
            Chưa có thành viên nào trong nhóm.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  );
}

export default GroupDialog;
