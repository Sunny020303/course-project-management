import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TextField,
  Container,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Tooltip,
  TablePagination,
  tableCellClasses,
  InputAdornment,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { getAllTopics } from "../../services/topicService";
import { useAuth } from "../../context/AuthContext";
import { getStudents } from "../../services/userService";
import { getGroup } from "../../services/groupService";
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as HourglassEmptyIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.common.white,
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

function TopicList() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedLecturer, setSelectedLecturer] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getAllTopics();
      if (error) throw error;
      if (user.role === "student")
        setTopics(
          data.filter((topic) =>
            topic.student_group_members.some(
              (member) => member.users.id === user.id
            )
          )
        );
      else setTopics(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching all topics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [navigate, user]);

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  }, []);

  const handlePageChange = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleSort = useCallback(
    (property) => {
      const isAsc = sortBy === property && sortOrder === "asc";
      setSortOrder(isAsc ? "desc" : "asc");
      setSortBy(property);
    },
    [sortBy, sortOrder]
  );

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
    setPage(0);
  };

  const handleLecturerChange = (event, newValue) => {
    setSelectedLecturer(newValue);
    setPage(0);
  };

  const handleSemesterChange = (event) => {
    setSelectedSemester(event.target.value);
    setPage(0);
  };

  const handleClassChange = (event, newValue) => {
    setSelectedClass(newValue);
    setPage(0);
  };

  const handleStudentChange = (event, newValue) => {
    setSelectedStudent(newValue);
    setPage(0);
  };

  const uniqueLecturers = useMemo(() => {
    const lecturers = topics
      .map((topic) => topic.lecturer?.full_name)
      .filter(Boolean);
    return Array.from(new Set(lecturers)).sort((a, b) => a.localeCompare(b));
  }, [topics]);

  const uniqueSemesters = useMemo(() => {
    const semesters = topics.map((topic) => topic.classes.semester);
    return Array.from(new Set(semesters)).sort((a, b) => b - a);
  }, [topics]);

  const uniqueClasses = useMemo(() => {
    const classes = topics.map((topic) => topic.classes.name);
    return Array.from(new Set(classes.map(JSON.stringify)))
      .map(JSON.parse)
      .sort((a, b) => a.localeCompare(b));
  }, [topics]);

  const uniqueStudents = useMemo(() => {
    const students = topics.flatMap((topic) =>
      topic.student_group_members.map((member) => member.users.full_name)
    );
    return Array.from(new Set(students.map(JSON.stringify)))
      .map(JSON.parse)
      .sort((a, b) => a.localeCompare(b));
  }, [topics]);

  const filteredTopics = useMemo(() => {
    if (!topics) {
      return [];
    }

    let filtered = topics.filter((topic) => {
      const searchMatch =
        topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatch = selectedStatus
        ? topic.approval_status === selectedStatus
        : true;
      const lecturerMatch = selectedLecturer
        ? topic.lecturer?.full_name === selectedLecturer
        : true;
      const semesterMatch = selectedSemester
        ? topic.classes.semester === selectedSemester
        : true;
      const classMatch = selectedClass
        ? topic.classes.name === selectedClass
        : true;
      const studentMatch = selectedStudent
        ? topic.student_group_members.some(
            (member) => member.users.full_name === selectedStudent
          )
        : true;
      return (
        topic.registered_group &&
        searchMatch &&
        statusMatch &&
        lecturerMatch &&
        semesterMatch &&
        classMatch &&
        studentMatch
      );
    });

    let aValue, bValue;
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "lecturer":
            aValue = a.lecturer?.full_name;
            bValue = b.lecturer?.full_name;
            break;
          case "classes":
            aValue = a.classes?.name;
            bValue = b.classes?.name;
            break;
          case "semester":
            aValue = a.classes?.semester;
            bValue = b.classes?.semester;
            break;
          default:
            aValue = a[sortBy];
            bValue = b[sortBy];
        }
        if (aValue < bValue) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [
    topics,
    sortBy,
    searchQuery,
    selectedStatus,
    selectedLecturer,
    selectedSemester,
    selectedClass,
    selectedStudent,
    sortOrder,
  ]);

  const renderTopicStatus = (topic) => {
    switch (topic.approval_status) {
      case "approved":
        return (
          <Chip
            label="Đã phê duyệt"
            color="success"
            size="small"
            icon={<CheckCircleIcon />}
          />
        );
      case "rejected":
        return (
          <Chip
            label="Bị từ chối"
            color="error"
            size="small"
            icon={<CancelIcon />}
          />
        );
      default:
        return (
          <Chip
            label="Chờ phê duyệt"
            color="warning"
            size="small"
            icon={<HourglassEmptyIcon />}
          />
        );
    }
  };

  const formatSemester = (semester) => {
    if (!semester) return "";
    const year = semester.toString().substring(0, 4);
    const term = semester.toString().substring(4);
    const termName = term === "3" ? "Hè" : term;
    return `${year} - ${termName}`;
  };

  const emptyRows =
    rowsPerPage -
    Math.min(rowsPerPage, filteredTopics.length - page * rowsPerPage);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Danh sách đề tài
      </Typography>

      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              label="Tìm kiếm đề tài"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              options={uniqueLecturers}
              value={selectedLecturer}
              onChange={handleLecturerChange}
              renderInput={(params) => (
                <TextField {...params} label="Giảng viên" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-select-label">Trạng thái</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                value={selectedStatus}
                label="Trạng thái"
                onChange={handleStatusChange}
              >
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="pending">Chờ phê duyệt</MenuItem>
                <MenuItem value="approved">Đã phê duyệt</MenuItem>
                <MenuItem value="rejected">Bị từ chối</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              options={uniqueSemesters}
              getOptionLabel={(option) => formatSemester(option)}
              value={selectedSemester}
              onChange={handleSemesterChange}
              renderInput={(params) => (
                <TextField {...params} label="Học kỳ" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              options={uniqueClasses}
              value={selectedClass}
              onChange={handleClassChange}
              renderInput={(params) => (
                <TextField {...params} label="Lớp" variant="outlined" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              options={uniqueStudents}
              value={selectedStudent}
              onChange={handleStudentChange}
              renderInput={(params) => (
                <TextField {...params} label="Sinh viên" variant="outlined" />
              )}
            />
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => fetchTopics()}>
              Thử lại
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell
                    onClick={() => handleSort("name")}
                    sx={{ cursor: "pointer" }}
                  >
                    Tên đề tài
                    {sortBy === "name" &&
                      (sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      ))}
                  </StyledTableCell>
                  <StyledTableCell
                    onClick={() => handleSort("description")}
                    sx={{ cursor: "pointer" }}
                  >
                    Mô tả
                    {sortBy === "description" &&
                      (sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      ))}
                  </StyledTableCell>
                  <StyledTableCell
                    onClick={() => handleSort("lecturer")}
                    sx={{ cursor: "pointer" }}
                  >
                    Giảng viên hướng dẫn
                    {sortBy === "lecturer" &&
                      (sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      ))}
                  </StyledTableCell>
                  <StyledTableCell
                    onClick={() => handleSort("approval_status")}
                    sx={{ cursor: "pointer" }}
                  >
                    Trạng thái
                    {sortBy === "approval_status" &&
                      (sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      ))}
                  </StyledTableCell>
                  <StyledTableCell>Nhóm</StyledTableCell>
                  <StyledTableCell
                    onClick={() => handleSort("classes")}
                    sx={{ cursor: "pointer" }}
                  >
                    Lớp
                    {sortBy === "classes" &&
                      (sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      ))}
                  </StyledTableCell>
                  <StyledTableCell
                    onClick={() => handleSort("semester")}
                    sx={{ cursor: "pointer" }}
                  >
                    Học kỳ
                    {sortBy === "semester" &&
                      (sortOrder === "asc" ? (
                        <ArrowUpwardIcon fontSize="small" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" />
                      ))}
                  </StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTopics.length > 0 ? (
                  filteredTopics
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((topic) => (
                      <TableRow
                        key={topic.id}
                        hover
                        component={RouterLink}
                        to={`/topics/details/${topic.id}`}
                        sx={{ textDecoration: "none" }}
                      >
                        <TableCell>
                          {topic.name.length > 100
                            ? `${topic.name.substring(0, 100)}...`
                            : topic.name}
                        </TableCell>
                        <TableCell>
                          {topic.description.length > 100
                            ? `${topic.description.substring(0, 100)}...`
                            : topic.description}
                        </TableCell>
                        <TableCell>
                          {topic.lecturer
                            ? topic.lecturer.full_name
                            : "Chưa có"}
                        </TableCell>
                        <TableCell>{renderTopicStatus(topic)}</TableCell>
                        <TableCell>
                          {topic.registered_group ? (
                            <>
                              <Typography
                                variant="body2"
                                gutterBottom
                                sx={{ fontWeight: "bold" }}
                              >
                                {topic.registered_group?.group_name || ""}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mt: 1,
                                }}
                              >
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  {topic.student_group_members.length} thành
                                  viên
                                </Typography>
                              </Box>
                            </>
                          ) : (
                            "Chưa có"
                          )}
                        </TableCell>
                        <TableCell>{topic.classes?.name}</TableCell>
                        <TableCell>
                          {formatSemester(topic.classes?.semester)}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Không tìm thấy đề tài nào.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={7} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[
              5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000,
            ]}
            component="div"
            count={filteredTopics.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelRowsPerPage="Số dòng trên trang:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} trong tổng số ${
                count !== -1 ? count : `hơn ${to}`
              }`
            }
          />
        </>
      )}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          component={RouterLink}
          to="/classes"
        >
          Xem danh sách lớp học
        </Button>
      </Box>
    </Container>
  );
}

export default TopicList;
