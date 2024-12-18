import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../services/supabaseClient";
import * as authService from "../services/authService";
import { CircularProgress, Box } from "@mui/material";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isLoggedIn = false;

    const getUserData = async () => {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user data:", error);
      } else if (authUser) {
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (userError) {
          console.error("Error getting user:", userError);
        } else {
          setUser(user);
        }
      }
      setLoading(false);
    };

    getUserData();

    const authListener = supabase.auth.onAuthStateChange(
      (event, session) => async () => {
        if (event === "SIGNED_IN") {
          if (!isLoggedIn) {
            isLoggedIn = true;
            setUser(session.user);
            return;
          }
          const { data: publicUser, error: publicUserError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();
          if (publicUserError) {
            console.error("Error getting user after sign in:", publicUserError);
          } else {
            setUser(publicUser);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (...args) => {
    const { error } = await authService.login(...args);
    if (!error) {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("email", args[0]) // args[0] is email
        .single();
      if (userError) {
        return { error: userError.message };
      } else {
        setUser(userData);
      }
    }

    return { error };
  };

  const register = async (...args) => {
    return await authService.register(...args);
  };

  const logout = async () => {
    const { error } = await authService.logout();
    if (!error) {
      setUser(null);
    }

    return { error };
  };

  const value = { user, login, register, logout, loading };

  return loading ? (
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
  ) : (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
