import React, { useState, useEffect } from "react";
import supabase from "../../services/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Link,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";

function TopicList() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const { data, error } = await supabase
          .from("topics")
          .select("*, lecturer: lecturer_id (full_name)");
        if (error) throw error;
        setTopics(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

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

  if (topics.length === 0) {
    return <Typography variant="body1">Không có đề tài nào.</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên đề tài</TableCell>
            <TableCell>Mô tả</TableCell>
            <TableCell>Giảng viên</TableCell>
            <TableCell>Trạng thái</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {topics.map((topic) => {
            const lecturer = topic.lecturer?.full_name || "Chưa có";
            return (
              <TableRow
                key={topic.id}
                onClick={() => navigate(`/topics/${topic.id}`)}
              >
                <TableCell>
                  <Link component={RouterLink} to={`/topics/${topic.id}`}>
                    {topic.name}
                  </Link>
                </TableCell>
                <TableCell>{topic.description || "Không có mô tả"}</TableCell>
                <TableCell>{lecturer}</TableCell>
                <TableCell>{topic.approval_status}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default TopicList;
