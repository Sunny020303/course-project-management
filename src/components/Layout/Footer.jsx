// src/components/Footer.jsx
import * as React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function Footer() {
  return (
    <Box sx={{ bgcolor: "background.paper", p: 6, marginTop: "auto" }}>
      <Typography variant="body2" color="text.secondary" align="center">
        © {new Date().getFullYear()} Trường Đại học Công nghệ Thông tin
      </Typography>
    </Box>
  );
}
