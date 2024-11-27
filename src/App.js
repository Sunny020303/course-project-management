import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./pages/task1/dashboard";
import Auth from "./components/Auth";
import ClassList from "./components/ClassList";
import TopicList from "./components/TopicList";
import TopicDetails from "./components/TopicDetails";
import supabase from "./supabaseClient";

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
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <div>Hello</div>
        <div className="App">
          <Router>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Auth type="login" />} />
              <Route path="/register" element={<Auth type="register" />} />
              <Route path="/classes" element={<ClassList />} />
              <Route
                path="/classes/:classId/topics"
                element={<TopicList />}
              />{" "}
              {/* Route for topic list within a class */}
              <Route path="/topics/:id" element={<TopicDetails />} />
            </Routes>
          </Router>
        </div>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
