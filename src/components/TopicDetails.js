import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { Typography, Container, Button, Box } from "@mui/material";

function TopicDetails() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false); // new state

  useEffect(() => {
    const fetchTopic = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching topic details:", error);
      } else {
        setTopic(data);
      }
      setLoading(false);
    };

    fetchTopic();
  }, [id]);

  // Check if current user is registered for this topic.
  useEffect(() => {
    const checkRegistration = async () => {
      const user = supabase.auth.user();
      if (user && topic) {
        const { data, error } = await supabase.rpc("check_topic_registration", {
          student_id: user.id,
          topic_id: topic.id,
        });
        if (error) {
          console.error("Error checking topic registration:", error);
        } else {
          setIsRegistered(data);
        }
      }
    };

    checkRegistration();
  }, [topic]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!topic) {
    return <p>Không tìm thấy đề tài.</p>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h5" component="h2" gutterBottom>
        {topic.name}
      </Typography>
      <Typography variant="body1" gutterBottom>
        {topic.description}
      </Typography>

      <Box mt={2}>
        {!isRegistered ? (
          <Button
            component={Link}
            to={`/topics/${topic.id}/register`}
            variant="contained"
            color="primary"
          >
            Đăng ký đề tài
          </Button>
        ) : (
          {}
        )}
        <Button component={Link} to="/" variant="outlined">
          Quay lại danh sách đề tài
        </Button>
      </Box>
    </Container>
  );
}

export default TopicDetails;
