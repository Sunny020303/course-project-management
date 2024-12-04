import supabase from "./supabaseClient";

export const login = async (email, password) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error logging in:", error);
    return { error: error.message };
  }
};

export const register = async (
  email,
  password,
  fullName,
  role,
  departmentId
) => {
  try {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    await supabase.from("users").insert({
      id: user.id,
      email,
      full_name: fullName,
      role,
      department_id: departmentId,
    });

    return { error: null };
  } catch (error) {
    console.error("Error registering user:", error);
    return { error: error.message };
  }
};

export const logout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error logging out:", error);
    return { error: error.message };
  }
};
