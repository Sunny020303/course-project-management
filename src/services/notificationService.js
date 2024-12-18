import supabase from "./supabaseClient";

export const fetchNotifications = async (userId, page = 1, pageSize = 10) => {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from("notifications")
      .select("*", { count: "estimated" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    return { data, error: null, count };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { data: null, error: error.message, count: 0 };
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { error: error.message };
  }
};

export const markNotificationAsUnread = async (id) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: false })
      .eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error marking notification as unread:", error);
    return { error: error.message };
  }
};

export const markAllNotificationsAsRead = async (userId) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { error: error.message };
  }
};

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

export const deleteNotification = async (id) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { error: error.message };
  }
};

export const deleteAllNotifications = async (userId) => {
  try {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return { error: error.message };
  }
};
