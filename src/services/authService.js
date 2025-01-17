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
  departmentId,
  studentCode,
  lecturerCode
) => {
  try {
    const { data: user, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    console.log(user.user.id);
    const { error: errorUser } = await supabase.from("users").insert({
      id: user.user.id,
      email: email,
      role: role,
      full_name: fullName,
      department_id: departmentId,
      lecturer_code: lecturerCode? lecturerCode : null,
      student_code: studentCode? studentCode : null,
      created_by: user.id,
    });
    if (errorUser) throw errorUser;

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
