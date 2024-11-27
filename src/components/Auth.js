import React, { useState } from "react";
import supabase from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Grid,
} from "@mui/material";

function Auth({ type }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { user, session, error } =
        type === "login"
          ? await supabase.auth.signIn({ email, password })
          : await supabase.auth.signUp({ email, password });

      if (error) throw error;
      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          {type === "login" ? "Đăng nhập" : "Đăng ký"}
        </Typography>
        <Box component="form" noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Địa chỉ Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={() => handleLogin(type)}
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading
              ? type === "login"
                ? "Đang đăng nhập..."
                : "Đang đăng ký..."
              : type === "login"
              ? "Đăng nhập"
              : "Đăng ký"}
          </Button>
          <Grid container>
            <Grid item>
              {type === "login" ? (
                <Link to="/register" variant="body2">
                  {"Chưa có tài khoản? Đăng ký"}
                </Link>
              ) : (
                <Link to="/login" variant="body2">
                  {"Đã có tài khoản? Đăng nhập"}
                </Link>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
      {error && (
        <Typography color="error" variant="body2" align="center">
          {error}
        </Typography>
      )}
    </Container>
  );
}

export default Auth;
