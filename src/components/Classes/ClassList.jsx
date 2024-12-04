import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClassesByUser } from "../../services/classService";
import { useAuth } from "../../context/AuthContext";
import {
  Typography,
  Box,
  Container,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import ClassListItems from "./ClassListItems";

function ClassList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams();
  const [classesBySemester, setClassesBySemester] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const classesData = useMemo(async () => {
    return await getClassesByUser(user);
  }, [user]);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const cachedClasses = sessionStorage.getItem(`classes-${user?.id}`);
        if (cachedClasses) {
          setClassesBySemester(JSON.parse(cachedClasses));
        } else {
          const { data, error } = await classesData;

          if (error) {
            throw error;
          }

          // Group lớp học theo học kỳ
          const groupedClasses = data.reduce((acc, c) => {
            acc[c.semester] = acc[c.semester] || [];
            acc[c.semester].push(c);
            return acc;
          }, {});

          setClassesBySemester(groupedClasses);
          sessionStorage.setItem(
            `classes-${user?.id}`,
            JSON.stringify(groupedClasses)
          );
        }
      } catch (error) {
        setError(`Đã xảy ra lỗi khi tải danh sách lớp học: ${error.message}`);
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [classesData]);

  // Hàm lọc danh sách lớp học
  const filteredClassesBySemester = useMemo(() => {
    return Object.entries(classesBySemester).reduce(
      (acc, [semester, classes]) => {
        const filteredClasses = classes.filter((c) => {
          const search = searchTerm.toLowerCase();
          return (
            c.name.toLowerCase().includes(search) ||
            c.subjects.subject_code.toLowerCase().includes(search) ||
            c.class_code.toLowerCase().includes(search) ||
            (c.lecturer && c.lecturer.full_name.toLowerCase().includes(search)) // Kiểm tra nếu lecturer tồn tại
          );
        });
        if (filteredClasses.length > 0) {
          acc[semester] = filteredClasses;
        }
        return acc;
      },
      {}
    );
  }, [classesBySemester, searchTerm]);

  return (
    <Container maxWidth="md" sx={{ flexGrow: 1, marginTop: 2 }}>
      <Typography variant="h5" gutterBottom>
        Danh sách lớp học
      </Typography>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <TextField
            label="Tìm kiếm"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <ClassListItems
            classesBySemester={filteredClassesBySemester}
            searchTerm={searchTerm} // Truyền searchTerm
            expanded={expanded} // Truyền expanded
            handleChange={handleChange} // Truyền handleChange
            classId={classId}
            handleSearchChange={handleSearchChange}
            navigate={navigate}
          />
        </>
      )}
    </Container>
  );
}

export default ClassList;
