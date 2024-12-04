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

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        // Fetch danh sách lớp học dựa trên role
        const { data, error } = await getClassesByUser(user);

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
      } catch (error) {
        setError(`Đã xảy ra lỗi khi tải danh sách lớp học: ${error.message}`);
        console.error("Error fetching classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user]);

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
            (c.lecturers &&
              c.lecturers.full_name.toLowerCase().includes(search)) // Kiểm tra nếu lecturers tồn tại
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
            {Object.entries(filteredClassesBySemester).map(
              ([semester, classes]) => (
                <Accordion
                  key={semester}
                  expanded={expanded === semester}
                  onChange={handleChange(semester)}
                  sx={{
                    marginBottom: "1rem",
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">{semester}</Typography>
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
                                    {c.subjects.subject_code} - {c.name} (
                                    {c.class_code})
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    {c.lecturers?.full_name}
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
              )
            )}
          </>
        )}
      </Container>
      <Footer />
    </Box>
  );
}

export default ClassList;
