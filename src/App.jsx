import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Dashboard from "./pages/task1/dashboard";
import Login from "./components/Authentication/Login";
import Register from "./components/Authentication/Register";
import ClassList from "./components/ClassList";
import TopicList from "./components/TopicList";
import TopicDetails from "./components/TopicDetails";
import supabase from "./services/supabaseClient";
import Box from "@mui/material/Box";
import React, { useState, useEffect } from "react";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
});

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          <div className="App">
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Router>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/classes" element={<ClassList />} />
                  <Route
                    path="/classes/:classId/topics"
                    element={<TopicList />}
                  />{" "}
                  {/* Route for topic list within a class */}
                  <Route path="/topics/:id" element={<TopicDetails />} />
                </Routes>
              </Router>
            </Box>
          </div>
        </ConfigProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
