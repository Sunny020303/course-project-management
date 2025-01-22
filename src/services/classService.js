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

export const getAllClassesDetails = async () => {
  try {
    const { data, error } = await supabase.from("classes").select("*, subjects(name, subject_code), lecturer: lecturer_id(full_name)");
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching all classes details:", error);
    return { data: null, error: error.message };
  }
};

export const getClassesByUser = async (user) => {
  try {
    let query = supabase
      .from("classes")
      .select(
        `*, subjects(name, subject_code), lecturer: lecturer_id(full_name)`
      )
      .order("semester", { ascending: false });

    if (user?.role === "student") {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("student_class_enrollment")
        .select("class_id")
        .eq("student_id", user.id);
      if (enrollmentError) throw enrollmentError;

      if (enrollments.length === 0) {
        return { data: [], error: null };
      }

      const classIds = enrollments.map((enrollment) => enrollment.class_id);
      query = query.in("id", classIds);
    } else if (user?.role === "lecturer") {
      query = query.eq("lecturer_id", user.id);
    } else if (user?.role === "admin") {
      query = query.eq("is_final_project", true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching classes by user:", error);
    return {
      data: null,
      error: `Lỗi khi lấy danh sách lớp học: ${error.message}`,
    };
  }
};

export const getClassDetails = async (classId) => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select(
        `*, subjects(name, subject_code, department_id), lecturer: lecturer_id(full_name)`
      )
      .eq("id", classId)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching class details:", error);
    return {
      data: null,
      error: `Lỗi khi lấy thông tin chi tiết lớp học: ${error.message}`,
    };
  }
};

export const CreateUpdateClass = async (
  id,
  classCode,
  name,
  subjectId,
  lecturerId,
  semester,
  year,
  isFinalProject,
) => {
  try {
    if (id === "new") {
      const { data, error } = await supabase
        .from("classes")
        .insert([
          {
            class_code: classCode,
            name: name,
            subject_id: subjectId,
            lecturer_id: lecturerId,
            semester: year + semester,
            is_final_project: isFinalProject,
          },
        ])
        .select();
      if (error) {
        console.log(error);
        throw error;
      }
      if (data) {
        console.log(data);
      }
      return { data: data, error: error };
    } else {
      const { data, error } = await supabase
        .from("classes")
        .upsert([
          {
            id: id,
            class_code: classCode,
            name: name,
            subject_id: subjectId,
            lecturer_id: lecturerId,
            semester: year + semester,
            is_final_project: isFinalProject,
          },
        ])
        .select();
      if (error) {
        console.log(error);
        throw error;
      }
      if (data) {
        console.log(data);
      }
      return { data: data, error: error };
    }
  } catch (error) {
    console.error("Error create/update new class: ", error);
    return {
      data: null,
      error: `Không thể tạo/sửa lớp học: ${error.message}`,
    };
  }
};

export const bulkCreateClass = async (classes) => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .insert(classes)
      .select("*, subjects(name, subject_code), lecturer: lecturer_id(full_name)");
    if (error) {
      console.log(error);
      throw error;
    }
    if (data) {
      console.log(data);
    }
  } catch (e) {
    console.error("Error create/update new class: ", e);
  }
}

export const DeleteClassById = async (id) => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) {
      console.log(error);
      throw error;
    }
  } catch (error) {
    console.error("Error delete class: ", error);
  }
}

export const BulkDeleteClassByIds = async (ids) => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .in('id', ids);
    if (error) {
      console.log(error);
      throw error;
    }
  } catch (error) {
    console.error("Error delete multi class: ", error);
  }
}