import { createContext, useContext, useState, useEffect } from "react";
import supabase from "../services/supabaseClient";
import * as authService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserData = async () => {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user data:", error);
      } else {
        if (authUser) {
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
      }
    };

    getUserData();

    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUser(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

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
    // Logout supabase
    const { error } = await authService.logout();
    if (!error) {
      setUser(null); // set user state to null after logout
    }

    return { error };
  };

  const value = { user, login, register, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {/* Chỉ render children khi đã kiểm tra xong trạng thái đăng nhập */}
    </AuthContext.Provider>
  );
};
