import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../../services/supabaseClient";
import { Typography, Card, CardContent, CardHeader, Grid } from "@mui/material";
import { Container } from "@mui/system";
import moment from "moment";

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
    <Container maxWidth="md">
      <Card sx={{ marginTop: 4, boxShadow: 3 }}>
        <CardHeader
          title={topic.name}
          titleTypographyProps={{
            variant: "h5",
            align: "center",
            color: "common.white",
          }}
          sx={{ bgcolor: "primary.main" }}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body1" paragraph>
                {topic.description || "Không có mô tả"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Giảng viên hướng dẫn:</Typography>
              <Typography variant="body1">
                {topic.lecturer?.full_name || "Chưa có"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Trạng thái:</Typography>
              <Typography variant="body1">{topic.approval_status}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Hạn đăng ký:</Typography>
              <Typography variant="body1">
                {moment(topic.registration_deadline).format("DD/MM/YYYY")}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Hạn nộp báo cáo:</Typography>
              <Typography variant="body1">
                {moment(topic.report_submission_deadline).format("DD/MM/YYYY")}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Hạn phê duyệt:</Typography>
              <Typography variant="body1">
                {moment(topic.approval_deadline).format("DD/MM/YYYY")}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Đề tài lớn:</Typography>
              <Typography variant="body1">
                {topic.is_final_project ? "Có" : "Không"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">Số thành viên tối đa:</Typography>
              <Typography variant="body1">{topic.max_members}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
}

export default TopicDetails;
