import React, { useState, useEffect, useMemo } from "react";
import { data, useNavigate, useParams } from "react-router-dom";
import { getSubject } from "../../services/subjectService";
import { CreateUpdateClass } from "../../services/classService";
import { getLecturerBySubject } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import {
  Button,
  Container,
  Typography,
  TextField,
  MenuItem
} from "@mui/material";
import { InputNumber } from 'antd';

//import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
//import SearchIcon from "@mui/icons-material/Search";
//import ClassListItems from "./ClassListItems";
function ClassCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  //dùng cho quá trình update
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [idLecturer, setIdLecturer] = useState("");
  const [idSubject, setIdSubject] = useState("");
  const [year, setYear] = useState(2024);
  const [semester, setSemester] = useState(1);
  const [subjectList, setSubjectList] = useState([]);

  const [idDepartment, setIdDepartment] = useState("");
  const [lecturerList, setLecturerList] = useState([]);

  //lấy danh sách môn học 
  useEffect(() => {
    const subject = getSubject();
    subject.then((data) => {
      setSubjectList(data);
    });
  }, [])

  //lấy list các giảng viên trong department đó
  useEffect(() => {
    if (idDepartment !== "") {
      const lecturer = getLecturerBySubject(idDepartment);
      lecturer.then((data) => {
        setLecturerList(data);
        //console.log(data);
      });
    }
  }, [idDepartment])

  //xét vai trò admin
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else {
      if(id==='new'){
        if (user.role !== "admin") navigate("/classes", { replace: true });
      } else if(user.role !=="lecturer") navigate("/classes", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = () => {
    setLoading(false);
    const ClassCreate = CreateUpdateClass(
      id,
      classCode,
      name,
      idSubject,
      idLecturer,
      semester + "",
      year + "",
    );
    ClassCreate.then((data) => {
      //console.log(data.data);
      if (data.error == null) {
        navigate("/classes", { replace: true });
      }
    })
  }

  return (
    <Container sx={{ flexGrow: 1, marginTop: 2, justifyItems: "center" }}>
      <Typography variant="h3">Thông tin lớp học</Typography>
      <form style={{ display: "flex", flexDirection: "column", width: "100vh" }} autoComplete="off">
        <TextField
          label="Chọn môn học"
          variant="outlined"
          fullWidth
          margin="normal"
          select
          value={idSubject}
          onChange={(e) => {
            setIdSubject(e.target.value)
          }}
          required
        >
          {subjectList.map((option) => (
            <MenuItem key={option.id} value={option.id} onClick={() => {
              setClassCode(option.subject_code);
              setName(option.name);
              setIdDepartment(option.department_id);
            }}>
              {option.subject_code + " - " + option.name}
            </MenuItem>
          ))}
        </TextField>


        <TextField
          label="Tên lớp"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          label="Mã lớp"
          variant="outlined"
          fullWidth
          margin="normal"
          value={classCode}
          onChange={(e) => setClassCode(e.target.value)}
          required

        />

        <TextField
          label="Chọn giảng viên"
          variant="outlined"
          fullWidth
          margin="normal"
          select
          value={idLecturer}
          onChange={(e) => {
            setIdLecturer(e.target.value)
          }}
          required
        >
          {lecturerList.map((option) => (
            <MenuItem key={option.id} value={option.id} onClick={() => {

            }}>
              {option.lecturer_code + " - " + option.full_name}
            </MenuItem>
          ))}
        </TextField>


        <div style={{ display: 'flex', marginTop: 20, marginBottom: 20, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: 'flex', width: '50%', alignItems: "center" }}>
            <Typography variant="h6" width={"20%"}>
              Học kỳ
            </Typography>
            <InputNumber min={1} max={3} defaultValue={1} onChange={(e) => setSemester(e)} style={{ width: '50%', borderRadius: 5, height: 50, fontSize: 17, alignContent: 'center' }} />
          </div>
          <div style={{ display: 'flex', width: '50%', alignItems: "center" }}>
            <Typography variant="h6" width={"27%"}>
              Năm học
            </Typography>
            <InputNumber min={2000} max={2100} defaultValue={2024} onChange={(e) => setYear(e)} style={{ width: '50%', borderRadius: 5, height: 50, fontSize: 17, alignContent: 'center' }} />
          </div>

        </div>
        <Button variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Đang đăng ký" : "Đăng ký"}
        </Button>

        <Button variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 10 }}
          onClick={() => {
            console.log({
              id,
              classCode,
              name,
              idSubject,
              idLecturer,
              semester,
              year,
            });
          }}
        >
          Test
        </Button>
      </form>
    </Container>
  )
}

export default ClassCreate