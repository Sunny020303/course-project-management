import React, { useState, useEffect, useMemo } from "react";
import { data, useNavigate, useParams } from "react-router-dom";
import { getSubject } from "../../services/subjectService";
import {
  CreateUpdateClass,
  getClassDetails,
} from "../../services/classService";
import { getLecturerBySubject } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import {
  Button,
  Container,
  Typography,
  TextField,
  MenuItem,
  Switch,
  Autocomplete,
} from "@mui/material";
import { InputNumber } from "antd";

//import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
//import SearchIcon from "@mui/icons-material/Search";
//import ClassListItems from "./ClassListItems";
function ClassCreate() {
  const date = new Date();
  const { user } = useAuth();
  const navigate = useNavigate();
  //dùng cho quá trình update
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [idLecturer, setIdLecturer] = useState("");
  const [idSubject, setIdSubject] = useState("");
  const [year, setYear] = useState(date.getFullYear());
  const [semester, setSemester] = useState(1);
  const [isFinal, setIsFinal] = useState(false);

  const [subjectList, setSubjectList] = useState([]);
  const [idDepartment, setIdDepartment] = useState("");
  const [lecturerList, setLecturerList] = useState([]);

  //lấy danh sách môn học
  useEffect(() => {
    const subject = getSubject();
    subject.then((data) => {
      setSubjectList(data);
    });
  }, []);

  //lấy list các giảng viên trong department đó
  useEffect(() => {
    if (idDepartment !== "") {
      const lecturer = getLecturerBySubject(idDepartment);
      lecturer.then((data) => {
        setLecturerList(data);
        //console.log(data);
      });
    }
  }, [idDepartment]);

  //xét vai trò admin
  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else {
      if (id === "new") {
        if (user.role !== "admin") navigate("/classes", { replace: true });
      } else if (user.role !== "lecturer" && user.role !== "admin")
        navigate("/classes", { replace: true });
      else {
        const classInfo = getClassDetails(id);
        classInfo.then((data) => {
          //console.log(data.data.subject_id);
          setIdSubject(data.data.subject_id);
          setIdDepartment(data.data.subjects.department_id);
          setIdLecturer(data.data.lecturer_id);
          setClassCode(data.data.class_code);
          setName(data.data.name);
          setSemester(
            data.data.semester - Math.floor(data.data.semester / 10) * 10
          );
          setYear(Math.floor(data.data.semester / 10));
          setIsFinal(data.data.is_final_project);
        });
      }
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
      isFinal
    );
    ClassCreate.then((data) => {
      //console.log(data.data);
      if (data.error == null) {
        navigate("/classes", { replace: true });
      }
    });
  };

  return (
    <Container sx={{ flexGrow: 1, marginTop: 2, justifyItems: "center" }}>
      <Typography variant="h3">Thông tin lớp học</Typography>
      <form
        style={{ display: "flex", flexDirection: "column", width: "100vh" }}
        autoComplete="off"
      >
        <TextField
          label="Chọn môn học"
          variant="outlined"
          fullWidth
          margin="normal"
          select
          value={idSubject}
          onChange={(e) => {
            setIdSubject(e.target.value);
          }}
          required
        >
          {subjectList.map((option) => (
            <MenuItem
              key={option.id}
              value={option.id}
              onClick={() => {
                setClassCode(option.subject_code);
                setName(option.name);
                setIdDepartment(option.department_id);
              }}
            >
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

        <Autocomplete
          multiple={isFinal}
          options={lecturerList}
          getOptionLabel={(option) =>
            `${option.lecturer_code} - ${option.full_name}`
          }
          value={
            isFinal
              ? lecturerList.filter((lecturer) =>
                  idLecturer.includes(lecturer.id)
                )
              : lecturerList.find((lecturer) => lecturer.id === idLecturer) ||
                null
          }
          onChange={(event, newValue) => {
            if (isFinal) {
              setIdLecturer(newValue.map((lecturer) => lecturer.id));
            } else {
              setIdLecturer(newValue ? newValue.id : "");
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="Chọn giảng viên"
              placeholder="Chọn giảng viên"
              margin="normal"
              fullWidth
              required
            />
          )}
        />

        <div
          style={{
            display: "flex",
            marginTop: 20,
            marginBottom: 20,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", width: "30%", alignItems: "center" }}>
            <Typography variant="h6" width={"45%"}>
              Học kỳ
            </Typography>
            <InputNumber
              min={1}
              max={3}
              value={semester}
              onChange={(e) => setSemester(e)}
              style={{
                width: "50%",
                borderRadius: 5,
                height: 50,
                fontSize: 17,
                alignContent: "center",
              }}
            />
          </div>
          <div style={{ display: "flex", width: "30%", alignItems: "center" }}>
            <Typography variant="h6" width={"50%"}>
              Năm học
            </Typography>
            <InputNumber
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(e)}
              style={{
                width: "50%",
                borderRadius: 5,
                height: 50,
                fontSize: 17,
                alignContent: "center",
              }}
            />
          </div>
          <div style={{ display: "flex", width: "30%", alignItems: "center" }}>
            <Typography variant="h6" width={"60%"}>
              Final Project
            </Typography>
            <Switch
              name="lecturerList"
              checked={isFinal}
              size="large"
              onChange={() => setIsFinal(!isFinal)}
            />
          </div>
        </div>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? "Đang đăng ký" : "Đăng ký"}
        </Button>

        <Button
          variant="contained"
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
  );
}

export default ClassCreate;
