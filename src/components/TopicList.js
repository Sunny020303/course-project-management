import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import supabase from "../supabaseClient";

function TopicList() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data, error } = await supabase.from("topics").select("*");

      if (error) {
        console.error("Error fetching topics:", error);
      } else {
        setTopics(data);
      }
      setLoading(false);
    };

    fetchTopics();
  }, []);

  return (
    <div>
      <h1>Danh sách đề tài</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {topics.map((topic) => (
            <li key={topic.id}>
              <Link to={`/topics/${topic.id}`}>{topic.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TopicList;
