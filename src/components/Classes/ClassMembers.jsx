import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getClassMembers, getClassDetails } from "../../services/classService";
import {
  Container,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
  Button,
  Box,
  TextField,
  InputAdornment,
  CircularProgress,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  FormControlLabel,
} from "@mui/material";
import * as XLSX from "xlsx";
import { useAuth } from "../../context/AuthContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";
import TableSortLabel from "@mui/material/TableSortLabel";
import { tableCellClasses } from "@mui/material/TableCell";

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

function ClassMembers() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [currentClass, setCurrentClass] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const [columns] = useState([
    { id: "student_code", label: "Mã sinh viên", visible: true },
    { id: "full_name", label: "Họ và tên", visible: true },
    { id: "email", label: "Email", visible: false },
    { id: "group_name", label: "Nhóm", visible: true },
    { id: "topic_name", label: "Đề tài", visible: false },
    { id: "lecturer_name", label: "Giảng viên hướng dẫn", visible: false },
    { id: "approval_status", label: "Trạng thái đề tài", visible: false },
    { id: "topic_result", label: "Kết quả", visible: false },
  ]);

  const [visibleColumns, setVisibleColumns] = useState(() =>
    columns.filter((column) => column.visible).map((column) => column.id)
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const handleColumnVisibilityChange = (columnId) => {
    setVisibleColumns((prevColumns) => {
      if (prevColumns.includes(columnId)) {
        return prevColumns.filter((id) => id !== columnId);
      } else {
        return [...prevColumns, columnId];
      }
    });
  };

  const handleOpenDialog = (member) => {
    setSelectedMember(member);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMember(null);
  };

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  const fetchCurrentClass = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getClassDetails(classId);
      if (error) throw error;
      setCurrentClass(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching class:", error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchCurrentClass();
  }, [fetchCurrentClass]);

  const fetchClassMembers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getClassMembers(classId);
      if (error) throw error;
      setMembers(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching class members:", error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchClassMembers();
  }, [fetchClassMembers]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(
      members.map((member) => ({
        "Mã sinh viên": member.users.student_code,
        "Họ và tên": member.users.full_name,
        Email: member.users.email,
        Nhóm: member.student_groups?.group_name || "",
        "Đề tài": member.student_groups?.topics?.name || "",
        "Giảng viên hướng dẫn":
          member.student_groups?.topics?.lecturer?.full_name || "",
        "Trạng thái đề tài": member.student_groups?.topics?.approval_status,
        "Kết quả": member.student_groups?.topics?.topic_result || "",
      }))
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách sinh viên");
    XLSX.writeFile(workbook, `danh_sach_sinh_vien_${classId}.xlsx`);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredMembers = useMemo(() => {
    if (!members) {
      return [];
    }
    return members.filter((member) => {
      const searchString =
        `${member.users.full_name} ${member.users.student_code} ${member.users.email}`.toLowerCase();
      return searchString.includes(searchQuery.toLowerCase());
    });
  }, [members, searchQuery]);

  if (
    user.role === "student" ||
    (user.role === "lecturer" && currentClass?.lecturer_id !== user.id)
  ) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Bạn không có quyền truy cập vào danh sách sinh viên của lớp này.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleGoBack}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Quay lại
        </Button>
        <Typography variant="h4">
          Danh sách sinh viên lớp {currentClass?.name}
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <TextField
          label="Tìm kiếm"
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
      </Box>

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Chọn cột để hiển thị:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap" }}>
          {columns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={
                <Checkbox
                  checked={visibleColumns.includes(column.id)}
                  onChange={() => handleColumnVisibilityChange(column.id)}
                  name={column.id}
                />
              }
              label={column.label}
            />
          ))}
        </Box>
      </FormControl>

      {error && <Alert severity="error">{error}</Alert>}

      {!loading && members.length > 0 && (
        <TableContainer component={Paper}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns
                  .filter((column) => visibleColumns.includes(column.id))
                  .map((column) => (
                    <StyledTableCell key={column.id}>
                      {column.label}
                    </StyledTableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.student_id}>
                  {visibleColumns.includes("student_code") && (
                    <TableCell>{member.users.student_code}</TableCell>
                  )}
                  {visibleColumns.includes("full_name") && (
                    <TableCell>{member.users.full_name}</TableCell>
                  )}
                  {visibleColumns.includes("email") && (
                    <TableCell>{member.users.email}</TableCell>
                  )}
                  {visibleColumns.includes("group_name") && (
                    <TableCell>
                      {member.student_groups?.group_name || ""}
                    </TableCell>
                  )}
                  {visibleColumns.includes("topic_name") && (
                    <TableCell>
                      {member.student_groups?.topics?.name || ""}
                    </TableCell>
                  )}
                  {visibleColumns.includes("lecturer_name") && (
                    <TableCell>
                      {member.student_groups?.topics?.lecturer?.full_name || ""}
                    </TableCell>
                  )}
                  {visibleColumns.includes("approval_status") && (
                    <TableCell>
                      {member.student_groups?.topics?.approval_status}
                    </TableCell>
                  )}
                  {visibleColumns.includes("topic_result") && (
                    <TableCell>
                      {member.student_groups?.topic_results[0]?.report_url && (
                        <Link
                          href={
                            member.student_groups.topic_results[0].report_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {member.student_groups.topic_results[0].score}
                        </Link>
                      )}
                      <br />
                      <Typography variant="body2" color="textSecondary">
                        {member.student_groups?.topic_results[0]?.notes || ""}
                      </Typography>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && filteredMembers.length === 0 && (
        <Typography variant="body1" sx={{ mt: 2 }}>
          Không tìm thấy sinh viên nào.
        </Typography>
      )}

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={exportToExcel}
        sx={{ mt: 2 }}
        disabled={loading || filteredMembers.length === 0}
      >
        Xuất Excel
      </Button>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Chi tiết sinh viên</DialogTitle>
        <DialogContent>
          {selectedMember && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Mã sinh viên"
                  secondary={selectedMember.users.student_code}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Họ và tên"
                  secondary={selectedMember.users.full_name}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Email"
                  secondary={selectedMember.users.email}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Nhóm"
                  secondary={selectedMember.student_groups?.group_name || ""}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Đề tài"
                  secondary={selectedMember.student_groups?.topics?.name || ""}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Giảng viên hướng dẫn"
                  secondary={
                    selectedMember.student_groups?.topics?.lecturer
                      ?.full_name || ""
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Trạng thái đề tài"
                  secondary={
                    selectedMember.student_groups?.topics?.approval_status
                  }
                />
              </ListItem>
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ClassMembers;
