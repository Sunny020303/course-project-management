import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import supabase from "../services/supabaseClient";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Container,
} from "@mui/material";

function TopicList() {
  const { classId } = useParams(); // Get classId from URL
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("class_id", classId);

      if (error) {
        console.error("Error fetching topics:", error);
      } else {
        setTopics(data);
      }
      setLoading(false);
    };

    fetchTopics();
  }, [classId]);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Danh sách đề tài
      </Typography>
      {loading ? (
        <Typography variant="body1">Loading...</Typography>
      ) : (
        <List>
          {topics.map((topic) => (
            <ListItem
              key={topic.id}
              component={Link}
              to={`/topics/${topic.id}`}
              button
            >
              <ListItemText primary={topic.name} />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default TopicList;
