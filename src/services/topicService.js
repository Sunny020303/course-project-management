import supabase from "./supabaseClient";

export const getTopics = async (classId, user) => {
  try {
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select(`*, lecturer: lecturer_id(full_name)`)
      .eq("class_id", classId);

    if (topicsError) {
      throw topicsError;
    }

    const { data: studentGroups, error: studentGroupsError } = await supabase
      .from("student_groups")
      .select("id, topic_id")
      .eq("class_id", classId);

    if (studentGroupsError) {
      throw studentGroupsError;
    }

    const topicIdToGroupIdMap = studentGroups.reduce((map, group) => {
      map[group.topic_id] = group.id;
      return map;
    }, {});

    const studentGroupIds = studentGroups.map((group) => group.id);

    const { data: studentMembers, error: studentMembersError } = await supabase
      .from("student_group_members")
      .select("student_id, student_group_id")
      .in("student_group_id", studentGroupIds);

    if (studentMembersError) throw studentMembersError;

    const studentIdsByGroupId = studentMembers.reduce((map, member) => {
      map[member.student_group_id] = map[member.student_group_id] || [];
      map[member.student_group_id].push(member.student_id);
      return map;
    }, {});

    const topicsWithGroupInfo = topics.map((topic) => {
      const groupId = topicIdToGroupIdMap[topic.id];
      return {
        ...topic,
        student_ids: groupId ? studentIdsByGroupId[groupId] : [],
        registered_group: groupId || null,
      };
    });

    if (user) {
      topicsWithGroupInfo.forEach((topic) => {
        topic.registeredByUser = topic.student_ids.includes(user.id);
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
