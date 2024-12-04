import supabase from "./supabaseClient";

export const getDepartments = async () => {
  try {
    const { data, error } = await supabase.from("departments").select("*");
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching departments:", error);
    return { data: null, error: error.message };
  }
};
