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
      .select(`*, lecturer: lecturer_id(full_name), student_groups(*)`) // Lấy thông tin nhóm sinh viên
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
    // Lấy nhóm của sinh viên trong lớp của đề tài (nếu có)
    const { data: topic, error: topicError } = await supabase
      .from("topics")
      .select("class_id")
      .eq("id", topicId)
      .single();

    if (topicError) throw topicError;

    const { data: existingGroup, error: existingGroupError } = await supabase
      .from("student_groups")
      .select("*")
      .eq("class_id", topic.class_id)
      .filter("student_ids", "cs", `{${studentId}}`) // contains studentId
      .maybeSingle();

    if (existingGroupError) throw existingGroupError;
    let groupId;

    if (!existingGroup) {
      // Sinh viên chưa có nhóm hoặc nhóm hiện tại không thuộc lớp này, tạo nhóm mới
      const { data: newGroup, error: createGroupError } = await supabase
        .from("student_groups")
        .insert({ student_ids: [studentId], class_id: topic.class_id })
        .single();
      if (createGroupError) throw createGroupError;
      groupId = newGroup.id;
    } else {
      // Sinh viên đã có nhóm trong lớp, kiểm tra xem nhóm đã đăng ký đề tài khác chưa
      if (existingGroup.topic_id) {
        return { error: "Bạn đã đăng ký một đề tài khác trong lớp này." };
      } else {
        groupId = existingGroup.id;
      }
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
