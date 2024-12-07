import supabase from "./supabaseClient";

export const getTopics = async (classId, user) => {
  try {
    const { data, error } = await supabase
      .from("topics")
      .select(`*, lecturer: lecturer_id(full_name)`)
      .eq("class_id", classId);

    if (error) {
      throw error;
    }

    const topicIds = data.map((topic) => topic.id);

    const { data: studentGroups, error: studentGroupsError } = await supabase
      .from("student_groups")
      .select(
        `
                id,
                topic_id,
                student_group_members(
                    student_id,
                    users: student_id(full_name)
                )
            `
      )
      .in("topic_id", topicIds);

    if (studentGroupsError) throw studentGroupsError;

    const studentGroupsByTopicId = studentGroups.reduce((map, group) => {
      map[group.topic_id] = group;
      return map;
    }, {});

    const topicsWithGroupInfo = data.map((topic) => {
      const registeredGroup = studentGroupsByTopicId[topic.id] || null;
      const members = registeredGroup?.student_group_members || [];

      let registeredByUser = false;
      if (user) {
        registeredByUser = members.some(
          (member) => member.student_id === user.id
        );
      }

      return {
        ...topic,
        student_group_members: members,
        registered_group: registeredGroup?.id || null,
        student_ids: members.map((member) => member.student_id),
        registeredByUser,
      };
    });

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
