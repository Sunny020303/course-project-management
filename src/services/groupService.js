import supabase from "./supabaseClient";

export const createGroup = async (classId, studentId) => {
  try {
    const { data: group, error } = await supabase
      .from("student_groups")
      .insert({ class_id: classId })
      .single();

    if (error) throw error;
    const { error: memberError } = await supabase
      .from("student_group_members")
      .insert({ student_id: studentId, student_group_id: group.id });

    if (memberError) throw memberError;

    return { data: group, error: null };
  } catch (error) {
    console.error("Error creating group:", error);
    return { data: null, error: error.message };
  }
};

export const getGroup = async (studentId, classId) => {
  try {
    const { data, error } = await supabase
      .from("student_group_members")
      .select("student_group_id")
      .eq("student_id", studentId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Nếu có lỗi khác 'no data found'
      throw error;
    }

    if (!data) return { data: null, error: null };

    const { data: group, error: groupError } = await supabase
      .from("student_groups")
      .select("*")
      .eq("id", data.student_group_id)
      .eq("class_id", classId)
      .single();

    if (groupError) {
      if (groupError.code === "PGRST116") {
        return { data: null, error: null };
      }
      throw groupError;
    }

    return { data: group, error: null };
  } catch (error) {
    console.error("Error fetching group:", error);
    return { data: null, error: error.message };
  }
};
