import supabase from "./supabaseClient";

export const createNotification = async (userId, type, message) => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      message,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { error: error.message };
  }
};