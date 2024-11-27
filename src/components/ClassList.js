import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../services/supabaseClient";
import {
  List,
  ListItem,
  ListItemText,
  Typography,
  Container,
  Grid,
  CircularProgress,
} from "@mui/material";
import ClassCard from "./ClassCard";

function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = supabase.auth.user();

  useEffect(() => {
    const fetchClasses = async () => {
      if (user) {
        const { data, error } = await supabase.rpc("get_user_classes", {
          user_id: user.id,
        });
        if (error) console.error("Error fetching classes", error);
        else setClasses(data);
      }
      setLoading(false);
    };
    fetchClasses();
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Danh sách lớp học
      </Typography>
      <Grid container spacing={2}>
        {classes.map((classItem) => (
          <Grid item xs={12} sm={6} md={4} key={classItem.id}>
            <ClassCard classItem={classItem} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default ClassList;
