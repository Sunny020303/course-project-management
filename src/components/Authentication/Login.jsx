import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../../services/supabaseClient";
import { TextField, Button, Container, Typography, Box } from "@mui/material";
import Header from "../Header";
import Footer from "../Footer";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe(); // Unsubscribe on unmount
    };
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true }); // Redirect and prevent going back
    }
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
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
