import { useState, useEffect } from 'react'
import React from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import { Container, Card, Typography, CardContent, CardActions, TextField, Button, MenuItem } from '@mui/material'
import { useAuth } from '../../context/AuthContext';
import { updateUser } from '../../services/userService';
import { getDepartments } from '../../services/departmentService';
import { getAccount } from '../../services/userService';
import DoneIcon from '@mui/icons-material/Done';

export default function AccountUpdate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState([]);
  const [departmentId, setDepartmentId] = useState([]);

  //const [schoolId, setSchoolID] = useState("");
  const [idStudent, setIdStudent] = useState(null);
  const [idLecturer, setIdLecturer] = useState(null);
  const handleSubmit = () => {
    const userUpdate = updateUser(
      id,
      email,
      role,
      name,
      departmentId,
      idLecturer,
      idStudent,
    );
    userUpdate.then((data) => {
      //console.log(data.data);
      if (data.error == null) {
        navigate("/account", { replace: true });
      }
    })
  }
  useEffect(() => {
    const departmentList = getDepartments();
    departmentList.then((data) => {
      setDepartment(data.data);
      //console.log(data.data);
    })
  }, []);

  useEffect(() => {
      if (!user) navigate("/login", { replace: true });
      else {
        const userAccount = getAccount(id);
        
        userAccount.then((data) => {
          setName(data.data[0].full_name);
          setEmail(data.data[0].email);
          setIdLecturer(data.data[0].lecturer_code);
          setIdStudent(data.data[0].student_code);
          setRole(data.data[0].role);
          setDepartmentId(data.data[0].department_id);

        });
        
      }
    }, [user])

  useEffect(()=>{

  },)

  return (
    <Container sx={{ flexGrow: 1, marginTop: 2, justifyItems: "center", width: "100%" }}>
      <Card
        sx={{
          //borderColor: topic.registeredByUser ? "green" : "default",
          //borderWidth: topic.registeredByUser ? 2 : 1,
          borderStyle: "solid",
          borderWidth: 1,
          width: "80%",
          padding: 5
        }}
      >
        <Typography
          variant='h4'
          align='center'
          fontWeight="bold"
        >
          Chỉnh sửa thông tin tài khoản
        </Typography>
        <CardContent sx={{ display: "flex", flexDirection: "column" }}>
          <TextField
            label="Họ và tên đầy đủ"
            variant="outlined"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label="Mã số"
            variant="outlined"
            fullWidth
            margin="normal"
            value={role === "student" ? idStudent : idLecturer}
            onChange={(e) => { role === "student" ? setIdStudent(e.target.value) : setIdLecturer(e.target.value) }}
            required
          />
          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Chọn chức vụ"
            variant="outlined"
            fullWidth
            margin="normal"
            select
            value={role}
            onChange={(e) => {
              setRole(e.target.value)
            }}
            required
          >
            <MenuItem key={1} value={"student"}>
              Sinh viên
            </MenuItem>
            <MenuItem key={2} value={"lecturer"}>
              Giảng viên
            </MenuItem>
            <MenuItem key={1} value={"admin"}>
              Admin
            </MenuItem>
          </TextField>

          <TextField
            label="Chọn khoa"
            variant="outlined"
            fullWidth
            margin="normal"
            select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value)
            }}
            required
          >
            {department.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>

        </CardContent>
        <CardActions sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => {
            handleSubmit();
          }}
            sx={{ marginRight: 1 }}
          >
            <DoneIcon sx={{ marginRight: 1 }} />Lưu thống tin tài khoản
          </Button>
        </CardActions>
      </Card>
    </Container>
  )
}
