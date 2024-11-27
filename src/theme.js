import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#007bff", // Màu xanh của UIT
    },
    secondary: {
      main: "#6c757d", // Màu xám của UIT
    },
    background: {
      default: "#f8f9fa",
    },
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
  },
});

export default theme;
