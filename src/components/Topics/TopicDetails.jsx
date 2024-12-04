import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../../services/supabaseClient";
import { Typography, List, ListItem, ListItemText } from "@mui/material";

function TopicDetails() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const { data, error } = await supabase
          .from("topics")
          .select("*, lecturer: lecturer_id (full_name)")
          .eq("id", id)
          .single();

        if (error) throw error;
        setTopic(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching topic details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopic();
  }, [id]);

  if (loading) {
    return <Typography variant="body1">Đang tải...</Typography>;
  }

  if (error) {
    return (
      <Typography variant="body1" color="error">
        {error}
      </Typography>
    );
  }

  if (!topic) {
    return <Typography variant="body1">Không tìm thấy đề tài.</Typography>;
  }

  return (
    <div>
      <Typography variant="h5">{topic.name}</Typography>
      <List>
        <ListItem>
          <ListItemText
            primary="Mô tả"
            secondary={topic.description || "Không có mô tả"}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Giảng viên hướng dẫn"
            secondary={topic.lecturer?.full_name || "Chưa có"}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Trạng thái phê duyệt"
            secondary={topic.approval_status}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Số thành viên tối đa"
            secondary={topic.max_members}
          />
        </ListItem>
      </List>
    </div>
  );
}

export default TopicDetails;
