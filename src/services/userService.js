import { data } from "react-router-dom";
import supabase from "./supabaseClient";

export const getLecturerBySubject = async (id) => {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("department_id",id)
            .eq("role","lecturer");
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching lecturer:", error);
        return data;
    }
}