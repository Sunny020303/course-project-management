import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../services/supabaseClient";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Link,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import Header from "../Header";
import Footer from "../Footer";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("student");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("*");
      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      await supabase.from("users").insert({
        id: user.id,
        full_name: fullName,
        role,
        department_id: department,
      });

      navigate("/login", { replace: true });
    } catch (error) {
      setError(error.message);
      console.error("Error registering user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container
        maxWidth="xs"
        sx={{ display: "flex", justifyContent: "center" }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 400,
            padding: 4,
            borderRadius: "8px",
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            bgcolor: "white",
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Đăng ký
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Địa chỉ Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Mật khẩu"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              label="Họ và tên"
              variant="outlined"
              fullWidth
              margin="normal"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="role-label">Vai trò</InputLabel>
              <Select
                labelId="role-label"
                id="role"
                value={role}
                label="Vai trò"
                onChange={(e) => setRole(e.target.value)}
              >
                <MenuItem value="student">Sinh viên</MenuItem>
                <MenuItem value="lecturer">Giảng viên</MenuItem>
                <MenuItem value="admin">Quản lý khoa</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel id="department-label">Khoa</InputLabel>
              <Select
                labelId="department-label"
                id="department"
                value={department}
                label="Khoa"
                onChange={(e) => setDepartment(e.target.value)}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Đăng ký"}
            </Button>
            {error && (
              <Typography
                variant="body2"
                color="error"
                align="center"
                sx={{ mt: 2 }}
              >
                {error}
              </Typography>
            )}
          </form>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Đã có tài khoản? <Link href="/login">Đăng nhập</Link>
          </Typography>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}

export default Register;
