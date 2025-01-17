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

export const getAccountList = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*, departments!department_id(name)");
    if (error) throw error;


    return { data: data, error: null };
  } catch (error) {
    console.error("Error getting all account", error);
    return { data: null, error: error.message };
  }
};

export const getStudentAccountList = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*, departments!department_id(name)")
      .not('student_code', 'is',null);
    if (error) throw error;


    return { data: data, error: null };
  } catch (error) {
    console.error("Error getting students account", error);
    return { data: null, error: error.message };
  }
};

export const getLecturerAndAdminAccountList = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*, departments!department_id(name)")
      .is('student_code',null);
    if (error) throw error;


    return { data: data, error: null };
  } catch (error) {
    console.error("Error getting Lecturer and Admin account", error);
    return { data: null, error: error.message };
  }
};
export const getAccount = async (id) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*, departments!department_id(*)")
      .eq("id", id)
    if (error) throw error;


    return { data: data, error: null };
  } catch (error) {
    console.error("Error getting user account information", error);
    return { data: null, error: error.message };
  }
};

export const getClassUser = async (id) => {
  try {
    const { data, error } = await supabase
      .from("student_class_enrollment")
      .select("*, classes(*)")
      .eq("student_id", id)
    if (error) throw error;


    return { data: data, error: null };
  } catch (error) {
    console.error("Error getting class for user", error);
    return { data: null, error: error.message };
  }
};

export const updateUser = async (id, email, role, name, idDepartment, idLecturer, idStudent) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .upsert([{
        id: id,
        email: email,
        role: role,
        full_name: name,
        department_id: idDepartment,
        lecturer_code: idLecturer,
        student_code: idStudent,
      }])
      .select();
    if (error) {
      //console.log(error);
      throw error;
    }
    if (data) {
      console.log(data);
    }
    return { data: data, error: error };
  } catch (e) {
    console.error("Error update info user data: ", e);
    return {
      data: null,
      error: `Không thể update user: ${e.message}`
    };
  }
};

export const DeleteUserById = async (id) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) {
      //console.log(error);
      throw error;
    }
    //const { data, error: AuthError } = await supabase.auth.admin.deleteUser(id)
    //const { error: AuthError } = await supabase.auth
    //if (AuthError) throw AuthError;
  } catch (error) {
    console.error("Error delete user: ", error);
  }
}

export const BulkDeleteUserByIds = async (ids) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .in('id', ids);
    if (error) {
      console.log(error);
      throw error;
    }
  } catch (error) {
    console.error("Error delete multi users: ", error);
  }
}