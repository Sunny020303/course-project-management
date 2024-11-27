import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import supabase from "../supabaseClient";

function TopicDetails() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false); // new state

  useEffect(() => {
    const fetchTopic = async () => {
      const { data, error } = await supabase
        .from("topics")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching topic details:", error);
      } else {
        setTopic(data);
      }
      setLoading(false);
    };

    fetchTopic();
  }, [id]);

  // Check if current user is registered for this topic.
  useEffect(() => {
    const checkRegistration = async () => {
      const user = supabase.auth.user();
      if (user && topic) {
        const { data, error } = await supabase.rpc("check_topic_registration", {
          student_id: user.id,
          topic_id: topic.id,
        });
        if (error) {
          console.error("Error checking topic registration:", error);
        } else {
          setIsRegistered(data);
        }
      }
    };

    checkRegistration();
  }, [topic]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!topic) {
    return <p>Không tìm thấy đề tài.</p>;
  }

  return (
    <div>
      <h2>{topic.name}</h2>
      <p>{topic.description}</p>
      {!isRegistered && (
        <Link to={`/topics/${topic.id}/register`}>Đăng ký đề tài</Link>
      )}
      <Link to="/">Quay lại danh sách đề tài</Link>
    </div>
  );
}

export default TopicDetails;
