import supabase from "./supabaseClient";

export const getClasses = async () => {
  try {
    const { data, error } = await supabase.from("classes").select("*");
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching classes:", error);
    return { data: null, error: error.message };
  }
};
