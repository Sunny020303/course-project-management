import supabase from "./supabaseClient";

export const createGroup = async (classId, studentIds, groupName) => {
  try {
    const { data: group, error } = await supabase
      .from("student_groups")
      .insert(
        groupName
          ? { class_id: classId, group_name: groupName }
          : { class_id: classId }
      )
      .select("id")
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
      .select(`*, student_groups!inner(*, topics(*))`)
      .eq("student_id", studentId)
      .eq("student_groups.class_id", classId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: null };
      }
      throw error;
    }

    const group = data.student_groups;
    if (!group) {
      return { data: null, error: null };
    }

    const { data: members, error: membersError } = await supabase
      .from("student_group_members")
      .select("*, users: student_id(*)")
      .eq("student_group_id", group.id);

    if (membersError) throw membersError;

    group.members = members;

    return { data: group, error: null };
  } catch (error) {
    console.error("Error fetching group:", error);
    return { data: null, error: error.message };
  }
};

export const getGroups = async (classId) => {
  try {
    const { data, error } = await supabase
      .from("student_groups")
      .select(
        "*, student_group_members(student_id, users: student_id(full_name, student_code, lecturer_code))"
      )
      .eq("class_id", classId);
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching groups:", error);
    return { data: null, error: error.message };
  }
};

export const joinGroup = async (groupId, userId) => {
  try {
    const { data: groupData, error: groupDataError } = await supabase
      .from("student_groups")
      .select("topic_id")
      .eq("id", groupId)
      .single();
    if (groupDataError) throw groupDataError;

    let maxMembers = null;
    if (groupData.topic_id) {
      const { data: topicData, error: topicError } = await supabase
        .from("topics")
        .select("max_members")
        .eq("id", groupData.topic_id)
        .single();
      if (topicError) throw topicError;
      maxMembers = topicData.max_members;
    }

    const { data: members, error: membersError } = await supabase
      .from("student_group_members")
      .select("student_id")
      .eq("student_group_id", groupId);
    if (membersError) throw membersError;

    if (maxMembers !== null && members.length >= maxMembers)
      throw new Error("maxed");

    const { error } = await supabase.from("student_group_members").insert([
      {
        student_group_id: groupId,
        student_id: userId,
      },
    ]);
    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error joining group:", error);
    return { error: error.message };
  }
};

export const leaveGroup = async (groupId, userId) => {
  try {
    const { error } = await supabase.rpc(
      "delete_student_group_member_and_group",
      { groupid: groupId, studentid: userId }
    );
    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error leaving group:", error);
    return { error: error.message };
  }
};
