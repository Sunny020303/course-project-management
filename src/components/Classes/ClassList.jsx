import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getClassesByUser } from "../../services/classService";
import { useAuth } from "../../context/AuthContext";
import {
  Typography,
  Box,
  Container,
  TextField,
  InputAdornment,
  IconButton,
  Skeleton,
  Button,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Add } from "@mui/icons-material";
import ClassListItems from "./ClassListItems";

function ClassList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { classId } = useParams();
  const [classesBySemester, setClassesBySemester] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleClassClick = (classId) => {
    navigate(`/classes/${classId}`);
  };

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role === "admin") {
      setIsAdmin(true);
    }
  }, [user, navigate]);

  const classesData = useMemo(async () => {
    if (user) return await getClassesByUser(user);
  }, [user]);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      if (error.message === "PGRST116") {
        // No data found
        setClassesBySemester({});
        setError(null); // set error to null so empty state message is displayed
      } else {
        setError(`Đã xảy ra lỗi khi tải danh sách lớp học: ${error.message}`);
        console.error("Error fetching classes:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [classesData, user]);

  useEffect(() => {
    fetchClasses();
  }, [classesData, fetchClasses]);

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <Typography variant="h5">Danh sách lớp học</Typography>
        {isAdmin && (
          <Button
            variant="outlined"
            onClick={() => {
              navigate("/createclass");
            }}
          >
            <Add sx={{ marginRight: 1 }} /> Thêm lớp học mới
          </Button>
        )}
      </Box>

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
      {loading ? (
        <Box sx={{ mt: 2 }}>
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            sx={{ mb: 2, borderRadius: "8px" }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            sx={{ mb: 2, borderRadius: "8px" }}
          />
          <Skeleton
            variant="rectangular"
            width="100%"
            height={60}
            sx={{ borderRadius: "8px" }}
          />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <ClassListItems
            classesBySemester={filteredClassesBySemester}
            classId={classId}
            handleClassClick={handleClassClick}
            error={error}
            fetchClasses={fetchClasses}
            searchTerm={searchTerm}
          />
        </Box>
      )}
    </Container>
  );
}

export default ClassList;
