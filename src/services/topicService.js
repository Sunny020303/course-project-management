import supabase from "./supabaseClient";

export const getTopics = async (
  classId,
  searchQuery,
  selectedStatus,
  currentPage,
  topicsPerPage
) => {
  try {
    let query = supabase
      .from("topics")
      .select(`*, lecturers(full_name), student_groups(*)`) // Lấy thông tin nhóm sinh viên
      .eq("class_id", classId);

    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`); // Tìm kiếm theo tên đề tài
    }

    if (selectedStatus) {
      query = query.eq("approval_status", selectedStatus); // Lọc theo trạng thái
    }

    const { data, error } = await query.range(
      (currentPage - 1) * topicsPerPage,
      currentPage * topicsPerPage - 1
    ); // Phân trang
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching topics:", error);
    return { data: null, error: error.message };
  }
};

export const registerTopic = async (topicId, studentId) => {
  try {
    // Tạo nhóm mới nếu sinh viên chưa có nhóm
    let groupId = null;
    const { data: existingGroup, error: groupError } = await supabase
      .from("student_groups")
      .select("id")
      .eq("topic_id", null) // Kiểm tra nhóm chưa đăng ký đề tài
      .eq("student_ids", `{"${studentId}"}`)
      .single();

    if (groupError && groupError.code !== "PGRST116") {
      // Nếu có lỗi khác 'no data found'
      throw groupError;
    }

    if (!existingGroup) {
      const { data: newGroup, error: newGroupError } = await supabase
        .from("student_groups")
        .insert({ student_ids: [studentId] })
        .single();
      if (newGroupError) throw newGroupError;
      groupId = newGroup.id;
    } else {
      groupId = existingGroup.id;
    }

    // Đăng ký đề tài cho nhóm
    const { error: registerError } = await supabase
      .from("topics")
      .update({ registered_group: groupId, approval_status: "pending" })
      .eq("id", topicId);

    if (registerError) throw registerError;

    return { error: null };
  } catch (error) {
    console.error("Error registering topic:", error);
    return { error: error.message };
  }
};
