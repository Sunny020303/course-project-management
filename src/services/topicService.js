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
      .select(
        `id, topic_id, student_group_members(student_id, users: student_id(full_name))`
      )
      .eq("class_id", classId);

    if (studentGroupsError) {
      throw studentGroupsError;
    }

    const studentGroupsByTopicId = studentGroups.reduce((map, group) => {
      map[group.topic_id] = group;
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
      const registeredGroup = studentGroupsByTopicId[topic.id];
      const studentIds =
        registeredGroup?.student_group_members.map(
          (member) => member.student_id
        ) || [];
      return {
        ...topic,
        student_ids: studentIds,
        student_group_members: registeredGroup?.student_group_members || [], // Add student_group_members
        registered_group: registeredGroup?.id || null, // Add registered group ID
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
