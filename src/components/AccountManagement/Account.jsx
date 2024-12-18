import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Container,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Link,
  CardActions,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../../context/AuthContext';
import { getAccount, getClassUser } from '../../services/userService';
export default function Account() {
  const { id } = useParams();
  const { user } = useAuth();
  //const [disabled, setDisable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [classList, setClassList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else {
      const userAccount = getAccount(id);
      const userClass = getClassUser(id);
      //console.log(userAccount);
      userAccount.then((data) => {
        setUserInfo(data.data[0]);
      });
      //console.log("Class list: ", userClass);
      userClass.then((data) => {
        setClassList(data.data);
      });
    }
  }, [user, navigate])



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
          Chi tiết thông tin {userInfo.role === "student" ? "sinh viên" : "giảng viên"}
        </Typography>
        <CardContent>
          <div style={{ display: 'flex', alignItems: "center" }}>
            <Typography variant='h5' fontWeight="bold" style={{ marginRight: 10 }}>
              Họ và tên đầy đủ:
            </Typography>
            <Typography variant='h5' >
              {userInfo.full_name}
            </Typography>
          </div>
          <div style={{ display: 'flex', alignItems: "center" }}>
            <Typography variant='h5' fontWeight="bold" style={{ marginRight: 10 }}>
              {userInfo.role === 'student' ? "Mã số sinh viên:" : "Mã giảng viên"}
            </Typography>
            <Typography variant='h5' >
              {userInfo.role === 'student' ? userInfo.student_code : userInfo.leturer_code}
            </Typography>
          </div>
          <div style={{ display: 'flex', alignItems: "center" }}>
            <Typography variant='h5' fontWeight="bold" style={{ marginRight: 10 }}>
              Email
            </Typography>
            <Typography variant='h5' >
              {userInfo.email}
            </Typography>
          </div>
          <div style={{ display: 'flex', alignItems: "center" }}>
            <Typography variant='h5' fontWeight="bold" style={{ marginRight: 10 }}>
              Chuyên ngành:
            </Typography>
            <Typography variant='h5' >
              {userInfo.departments && userInfo.departments.name}
            </Typography>
          </div>
        </CardContent>
        <CardActions sx={{ display: "flex", justifyContent: "flex-end"}}>
          <Button variant="outlined" onClick={() => {
            navigate(`/accountupdate/${id}`);
          }}
          >
            <EditIcon sx={{ marginRight: 1 }} /> Chỉnh sửa tài khoản
          </Button>
        </CardActions>
      </Card>

      <Card
        sx={{
          //borderColor: topic.registeredByUser ? "green" : "default",
          //borderWidth: topic.registeredByUser ? 2 : 1,
          borderStyle: "solid",
          borderWidth: 1,
          width: "80%",
          padding: 5,
          marginTop: 5
        }}
      >
        <Typography
          variant='h4'
          align='center'
          fontWeight="bold"
        >
          Cách lớp đã đăng ký
        </Typography>
        <CardContent>
          {classList.map((i) => {
            return (
              <Link
                component={RouterLink}
                to={`/classes/${i.class_id}`}
              >
                <div style={{ display: 'flex', alignItems: "center", marginBottom: 10 }}>

                  <Typography variant='h5' fontWeight="bold" style={{ marginRight: 10 }}>
                    {i.classes.class_code}
                  </Typography>
                  <Typography variant='h5' >
                    {i.classes.name}
                  </Typography>
                </div>
              </Link>
            );
          })}
        </CardContent>

        <CardActions>

        </CardActions>
      </Card>
    </Container>
  )
}

