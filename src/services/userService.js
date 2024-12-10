import { data } from "react-router-dom";
import supabase from "./supabaseClient";

export const getLecturerBySubject = async (id) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("department_id", id)
      .eq("role", "lecturer");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching lecturer:", error);
    return data;
  }
};

export const getStudents = async (studentIds) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .in("id", studentIds);
    if (error) throw error;

    const studentMap = data.reduce((map, student) => {
      map[student.id] = student;
      return map;
    }, {});

    return { data: studentMap, error: null };
  } catch (error) {
    console.error("Error getting students", error);
    return { data: null, error: error.message };
  }
};
