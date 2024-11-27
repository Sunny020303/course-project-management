import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { ConfigProvider } from "antd";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Login from "./pages/task1/login";
import Signup from "./pages/task1/signup";
import Dashboard from "./pages/task1/dashboard";
import TopicList from "./components/TopicList";

import React, { useState } from "react";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 0,
    },
  },
});

function App() {
  const isLogin = false;

  /*if(!isLogin){
    return <Navigate to="/dang-nhap" replace />
  }*/

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <div>Hello</div>
        <div className="App">
          <Router>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dang-nhap" element={<Login />} />
              <Route path="/dang-ky" element={<Signup />} />
              <Route path="/topics" element={<TopicList />} />
            </Routes>
          </Router>
        </div>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
