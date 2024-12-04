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

export const getClassesByUser = async (user) => {
  try {
    let query = supabase
      .from("classes")
      .select(
        `*, subjects (name, subject_code), lecturer: lecturer_id(full_name)`
      )
      .order("semester", { ascending: false });

    if (user?.role === "student") {
      // Lấy danh sách lớp mà sinh viên đã đăng ký
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollments")
        .select("class_id")
        .eq("student_id", user.id);
      if (enrollmentError) throw enrollmentError;
      const classIds = enrollments.map((enrollment) => enrollment.class_id);
      query = query.in("id", classIds);
    } else if (user?.role === "lecturer") {
      query = query.eq("lecturer_id", user.id);
    } // Trường hợp admin không cần filter

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching classes by user", error);
    return { data: null, error: error.message };
  }
};
