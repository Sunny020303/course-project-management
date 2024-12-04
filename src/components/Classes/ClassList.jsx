import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getClassesByUser } from "../../services/classService";
import { useAuth } from "../../context/AuthContext";
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Container,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";

function ClassList() {
  const [classesBySemester, setClassesBySemester] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const [expanded, setExpanded] = React.useState(false);
  const navigate = useNavigate();

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

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

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

  const formattedSemester = (semesterInt) => {
    const year = String(semesterInt).slice(0, 4);
    const semesterPart = String(semesterInt).slice(4);
    const semesterName =
      semesterPart === "3" ? "Học kỳ Hè" : `Học kỳ ${semesterPart}`;
    return `${year} - ${semesterName}`;
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
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
            {Object.keys(filteredClassesBySemester).length === 0 && (
              <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                Không có lớp học nào.
              </Typography>
            )}
            {Object.entries(filteredClassesBySemester)
              .sort(([semesterA], [semesterB]) => semesterB - semesterA)
              .map(([semester, classes], index) => (
                <Accordion
                  key={semester}
                  expanded={expanded === semester}
                  onChange={handleChange(semester)}
                  sx={{
                    marginBottom: "1rem",
                  }}
                  defaultExpanded={index === 0}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      {formattedSemester(semester)}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List>
                      {classes.map((c) => (
                        <ListItem
                          key={c.id}
                          disablePadding
                          secondaryAction={
                            user?.role === "lecturer" && (
                              <Button
                                component={RouterLink}
                                to={`/classes/${c.id}/edit`} // Thêm route chỉnh sửa lớp học
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<EditIcon />}
                              >
                                Edit
                              </Button>
                            )
                          }
                        >
                          <ListItemButton
                            onClick={() => navigate(`/classes/${c.id}`)}
                          >
                            <ListItemText
                              primary={
                                <>
                                  <Typography variant="body1">
                                    {c.subjects.subject_code} - {c.name} (Mã
                                    lớp: {c.class_code})
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Giảng viên: {c.lecturer?.full_name}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
          </>
        )}
      </Container>
      <Footer />
    </Box>
  );
}

export default ClassList;
