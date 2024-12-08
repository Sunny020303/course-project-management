import { data } from "react-router-dom";
import supabase from "./supabaseClient";

export const getSubject = async () => {
    try {
        const { data, error } = await supabase.from("subjects").select("*");
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching subject:", error);
        return data;
    }
}