import supabase from "./supabaseClient";

export const getTopics = async (classId, user) => {
  // Quay lại hàm getTopics ban đầu
  try {
    const { data, error } = await supabase
      .from("topics")
      .select(`*, lecturer: lecturer_id(full_name)`)
      .eq("class_id", classId);

    if (error) {
      throw error;
    }

    // Lấy danh sách student_group_id từ bảng student_groups
    const { data: studentGroups, error: studentGroupsError } = await supabase
      .from("student_groups")
      .select(
        "id, topic_id, student_group_members(student_id, users: student_id(full_name))"
      )
      .eq("class_id", classId); // filter by classId

    if (studentGroupsError) throw studentGroupsError;

    const studentGroupMap = studentGroups.reduce((map, group) => {
      if (group.topic_id) map[group.topic_id] = group;
      return map;
    }, {});

    const topicsWithGroupInfo = data.map((topic) => {
      const registeredGroup = studentGroupMap[topic.id] || null;
      return {
        ...topic,
        student_group_members: registeredGroup?.student_group_members || [],
        registered_group: registeredGroup?.id || null,
      };
    });

    if (user) {
      topicsWithGroupInfo.forEach((topic) => {
        topic.registeredByUser =
          topic.student_ids && topic.student_ids.includes(user.id);
      });
    }

    return { data: topicsWithGroupInfo, error: null };
  } catch (error) {
    console.error("Error fetching topics:", error);
    return { data: null, error: error.message };
  }
};

export const registerTopic = async (topicId, groupId) => {
  try {
    const { data, error } = await supabase
      .from("student_groups")
      .update({ topic_id: topicId })
      .eq("id", groupId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error registering topic:", error);
    return { error: error.message };
  }
};

export const deleteTopic = async (topicId) => {
  try {
    const { error } = await supabase.from("topics").delete().eq("id", topicId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting topic:", error);
    return { error: error.message };
  }
};
