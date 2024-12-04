import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, setUserInContext } = useAuth();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const navigate = useNavigate();

  const { login } = useAuth();
  const { logout } = useAuth();

  useEffect(() => {
    if (user) {
      if (showSuccessAlert) {
        // Đăng xuất sau khi hiển thị thông báo đăng ký thành công
        logout();
        setShowSuccessAlert(false);
        alert("Đăng ký thành công! Vui lòng đăng nhập."); // có thể thay bằng snackbar
      }
      navigate("/classes", { replace: true });
    }

    // Lắng nghe query parameter "registered" từ trang đăng ký
    const searchParams = new URLSearchParams(window.location.search);
    const registered = searchParams.get("registered");
    if (registered) {
      setShowSuccessAlert(true);
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await login(email, password);
      if (error) throw error;
      else navigate("/classes");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <Container
        maxWidth="xs"
        sx={{
          display: "flex",
          justifyContent: "center",
          flexGrow: 1,
          alignItems: "center",
        }}
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
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ color: "primary.main" }}
          >
            Đăng nhập
          </Typography>
          {showSuccessAlert && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Đăng ký thành công!
            </Alert>
          )}
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
            <Button
              variant="contained"
              color="primary"
              fullWidth
              type="submit"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? "Đang tải..." : "Đăng nhập"}
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
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </Typography>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}

export default Login;
