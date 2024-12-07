import supabase from "./supabaseClient";

export const createGroup = async (classId, studentIds) => {
  try {
    const { data: group, error } = await supabase
      .from("student_groups")
      .insert({ class_id: classId })
      .single();
    if (error) throw error;

    const { error: memberError } = await supabase
      .from("student_group_members")
      .insert(
        studentIds.map((studentId) => ({
          student_id: studentId,
          student_group_id: group.id,
        }))
      );

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
      .select(
        `
          student_group_id,
          student_groups!inner(
            id, topic_id
          )
        `
      )
      .eq("student_id", studentId)
      .eq("student_groups.class_id", classId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      throw error;
    }

    return { data: data.student_groups, error: null };
  } catch (error) {
    console.error("Error fetching group:", error);
    return { data: null, error: error.message };
  }
};
