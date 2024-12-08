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
import { AuthProvider } from "./context/AuthContext";
import theme from "./theme";
import supabase from "./services/supabaseClient";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";

const Header = lazy(() => import("./components/Layout/Header"));
const Footer = lazy(() => import("./components/Layout/Footer"));
const Login = lazy(() => import("./components/Authentication/Login"));
const Register = lazy(() => import("./components/Authentication/Register"));
const ClassList = lazy(() => import("./components/Classes/ClassList"));
const ClassTopics = lazy(() => import("./components/Topics/ClassTopics"));
const TopicDetails = lazy(() => import("./components/Topics/TopicDetails"));
const Dashboard = lazy(() => import("./pages/task1/dashboard"));
const CreateTopic = lazy(() => import("./pages/task1/CreateTopic"));
const CreateClass = lazy(() => import("./components/Classes/ClassCreate"));

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
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <ConfigProvider>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Header />
              <Router>
                <Suspense
                  fallback={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100vh",
                      }}
                    >
                      <CircularProgress />
                    </Box>
                  }
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      minHeight: "100vh",
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/createtopic" element={<CreateTopic />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/classes" element={<ClassList />} />
                      <Route
                        path="/classes/:classId"
                        element={<ClassTopics />}
                      />
                      <Route
                        path="/topics/details/:id"
                        element={<TopicDetails />}
                      />
                      <Route path="/createclass" element={<CreateClass/>}/>
                    </Routes>
                  </Box>
                </Suspense>
              </Router>
              <Footer />
            </Box>
          </ConfigProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
