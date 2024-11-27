import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
} from "@mui/material";

function ClassCard({ classItem }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="div">
          {classItem.name} ({classItem.class_code})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {classItem.semester}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          component={Link}
          to={`/classes/${classItem.id}/topics`}
          size="small"
        >
          Xem đề tài
        </Button>
      </CardActions>
    </Card>
  );
}

export default ClassCard;
