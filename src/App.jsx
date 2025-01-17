import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import { AuthProvider } from "./context/AuthContext";
import theme from "./theme";
import supabase from "./services/supabaseClient";
import React, { useState, useEffect, lazy, Suspense } from "react";
import { CircularProgress, Box } from "@mui/material";

const ErrorBoundary = lazy(() => import("./components/ErrorBoundary"));
const Header = lazy(() => import("./components/Layout/Header"));
const Footer = lazy(() => import("./components/Layout/Footer"));
const Login = lazy(() => import("./components/Authentication/Login"));
const Register = lazy(() => import("./components/Authentication/Register"));
const ClassList = lazy(() => import("./components/Classes/ClassList"));
const ClassTopics = lazy(() => import("./components/Topics/ClassTopics"));
const GroupManagement = lazy(() =>
  import("./components/Groups/GroupManagement")
);
const TopicDetails = lazy(() => import("./components/Topics/TopicDetails"));
const AddTopic = lazy(() => import("./components/Topics/AddTopic"));
const EditTopic = lazy(() => import("./components/Topics/EditTopic"));
const TopicList = lazy(() => import("./components/Topics/TopicList"));
const Dashboard = lazy(() => import("./pages/task1/dashboard"));
const CreateTopic = lazy(() => import("./pages/task1/CreateTopic"));
const CreateClass = lazy(() => import("./components/Classes/ClassCreate"));
const Account = lazy(() => import("./components/AccountManagement/Account"));
const AccountUpdate = lazy(() =>
  import("./components/AccountManagement/AccountUpdate")
);
const AdminAccountManagemant = lazy(() =>
  import("./components/AccountManagement/AdminAccountManagement")
);
const AdminClassManagemant = lazy(() =>
  import("./components/Classes/AdminClassManagement")
);

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
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ConfigProvider>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  minHeight: "100vh",
                }}
              >
                <Router>
                  <Header />
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
                          path="/classes/:classId/groups"
                          element={<GroupManagement />}
                        />
                        <Route
                          path="/topics/details/:id"
                          element={<TopicDetails />}
                        />
                        <Route
                          path="/classes/:classId/topics/create"
                          element={<AddTopic />}
                        />
                        <Route
                          path="/classes/:classId/topics/:topicId/edit"
                          element={<EditTopic />}
                        />
                        <Route path="/topics" element={<TopicList />} />
                        <Route
                          path="/createclass/:id"
                          element={<CreateClass />}
                        />
                        <Route
                          path="/classes/:id/edit"
                          element={<CreateClass />}
                        />
                        <Route path="/account/:id" element={<Account />} />
                        <Route
                          path="/accountupdate/:id"
                          element={<AccountUpdate />}
                        />
                        <Route
                          path="/adminaccountmanagement"
                          element={<AdminAccountManagemant />}
                        />
                        <Route
                          path="/adminclassmanagement"
                          element={<AdminClassManagemant />}
                        />
                      </Routes>
                    </Box>
                  </Suspense>
                  <Footer />
                </Router>
              </Box>
            </ConfigProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
