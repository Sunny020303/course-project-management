import React, { Component } from "react";
import { Alert, Button } from "@mui/material";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          severity="error"
          sx={{ my: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
          }
        >
          Đã có lỗi xảy ra: {this.state.error.message}
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
