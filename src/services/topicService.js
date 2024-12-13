import supabase from "./supabaseClient";
import { createNotification } from "./notificationService";

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
      .select(`*, student_group_members(*, users: student_id(*))`)
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
        registered_group: registeredGroup || null,
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

export const approveTopic = async (topicId) => {
  try {
    const { error } = await supabase
      .from("topics")
      .update({ approval_status: "approved" })
      .eq("id", topicId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error approving topic", error);
    return { error: error.message };
  }
};

export const rejectTopic = async (topicId) => {
  try {
    const { error } = await supabase
      .from("topics")
      .update({ approval_status: "rejected" })
      .eq("id", topicId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error rejecting topic", error);
    return { error: error.message };
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

export const cancelTopicRegistration = async (groupId) => {
  try {
    const { error } = await supabase
      .from("student_groups")
      .update({ topic_id: null })
      .eq("id", groupId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error canceling topic registration:", error);
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

export const requestTopicSwap = async (
  requestingGroup,
  requestedGroup,
  classId
) => {
  try {
    const { error } = await supabase.from("topic_swap_requests").insert({
      topic_id: requestingGroup.topics.id,
      requesting_group_id: requestingGroup.id,
      requested_group_id: requestedGroup.id,
      status: "pending",
    });
    if (error) throw error;

    const { data: classData, error: classErr } = await supabase
      .from("classes")
      .select("name, class_code")
      .eq("id", classId)
      .single();
    if (classErr) throw classErr;

    requestedGroup.student_group_members.forEach((member) => {
      createNotification(
        member.student_id,
        "swap_request",
        `Có 1 nhóm ở lớp ${classData.name} đã yêu cầu trao đổi đề tài ${requestingGroup.topics.name} với nhóm của bạn.`
      );
    });
    return { error: null };
  } catch (error) {
    console.error("Error requesting topic swap:", error);
    return { error: error.message };
  }
};

export const cancelTopicSwap = async (requestId) => {
  try {
    const { error } = await supabase
      .from("topic_swap_requests")
      .delete()
      .eq("id", requestId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error cancelling topic swap:", error);
    return { error: error.message };
  }
};

export const getTopicSwapRequests = async (groupId) => {
  try {
    const { data, error } = await supabase
      .from("topic_swap_requests")
      .select(
        `*, topics(*), requested_group: requested_group_id(*, student_group_members(*, users: student_id!inner(*))), requesting_group: requesting_group_id(*, student_group_members(*, users: student_id!inner(*)))`
      )
      .or(
        `requesting_group_id.eq.${groupId}, requested_group_id.eq.${groupId}`
      );
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching topic swap requests:", error);
    return { data: null, error: error.message };
  }
};

export const getUnreadSwapRequests = async (groupId) => {
  try {
    const { data, error } = await supabase
      .from("topic_swap_requests")
      .select("id", { count: "exact" })
      .eq("status", "pending")
      .eq("requested_group_id", groupId)
      .eq("read", false);
    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching unread swap requests count:", error);
    return { data: null, error: error.message };
  }
};

export const approveTopicSwap = async (request) => {
  try {
    const { error } = await supabase.rpc("handle_topic_swap", request);
    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error("Error approving topic swap:", error);
    return { error: error.message };
  }
};

export const rejectTopicSwap = async (request) => {
  try {
    const { error: updateStatusError } = await supabase
      .from("topic_swap_requests")
      .update({ status: "rejected", read: true })
      .eq("id", request.id);
    if (updateStatusError) throw updateStatusError;

    const { data: requestingGroup, error: reqGroupErr } = await supabase
      .from("student_groups")
      .select("student_group_members(student_id)")
      .eq("id", request.requesting_group_id)
      .single();
    if (reqGroupErr) throw reqGroupErr;

    const { data: requestedGroup, error: reqedGroupErr } = await supabase
      .from("student_groups")
      .select("student_group_members(student_id)")
      .eq("id", request.requested_group_id)
      .single();
    if (reqedGroupErr) throw reqedGroupErr;

    const requestingGroupStudentIds = requestingGroup.student_group_members.map(
      (member) => member.student_id
    );
    const requestedGroupStudentIds = requestedGroup.student_group_members.map(
      (member) => member.student_id
    );

    const notificationPromises = [];
    requestingGroupStudentIds.forEach((studentId) => {
      notificationPromises.push(
        createNotification(
          studentId,
          "swap_rejected",
          `Yêu cầu trao đổi đề tài "${request.topics.name}" của bạn đã bị từ chối.`
        )
      );
    });
    requestedGroupStudentIds.forEach((studentId) => {
      notificationPromises.push(
        createNotification(
          studentId,
          "swap_rejected",
          `Yêu cầu trao đổi đề tài "${request.topics.name}" đã bị từ chối.`
        )
      );
    });

    await Promise.all(notificationPromises);

    return { error: null };
  } catch (error) {
    console.error("Error rejecting topic swap:", error);
    return { error: error.message };
  }
};

export const markSwapRequestAsRead = async (requestId) => {
  try {
    const { error } = await supabase
      .from("topic_swap_requests")
      .update({ read: true })
      .eq("id", requestId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error marking swap request as read:", error);
    return { error: error.message };
  }
};

export const markAllSwapRequestsAsRead = async (groupId) => {
  try {
    const { error } = await supabase
      .from("topic_swap_requests")
      .update({ read: true })
      .eq("requested_group_id", groupId)
      .eq("status", "pending");
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error marking swap request as read:", error);
    return { error: error.message };
  }
};

export const subscribeToTopicSwapRequests = (
  groupId,
  updateSwapRequests,
  showSnackbar
) => {
  const channel = supabase
    .channel(`topic_swap_requests:group_id=${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "topic_swap_requests",
        filter: `requested_group_id.eq.${groupId} or requesting_group_id.eq.${groupId}`,
      },
      async (payload) => {
        const newRequest = payload.new;

        try {
          const { data: topicData, error: topicError } = await supabase
            .from("topics")
            .select("name")
            .eq("id", newRequest.topic_id)
            .single();
          if (topicError) throw topicError;

          const { data: requestingGroupData, error: requestingGroupError } =
            await supabase
              .from("student_groups")
              .select("group_name")
              .eq("id", newRequest.requesting_group_id)
              .single();
          if (requestingGroupError) throw requestingGroupError;

          if (newRequest.requested_group_id === groupId) {
            showSnackbar(
              `Nhóm ${requestingGroupData.group_name} đã yêu cầu trao đổi đề tài "${topicData.name}" với nhóm của bạn.`,
              "info"
            );
          }
          await updateSwapRequests();
        } catch (error) {
          console.error(
            "Error fetching additional details for swap request:",
            error
          );
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
