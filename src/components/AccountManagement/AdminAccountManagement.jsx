import React, { useEffect, useState } from 'react'
import {
  Button,
  Container,
  Typography,
  TextField,
  MenuItem
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { getAccountList } from '../../services/userService';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';

export default function AdminAccountManagement() {
  const navigate= useNavigate();
  const [accountList, setAccountList] = useState([{id: "123", full_name: "Duong", email: "neko",departments: {name: "doanxem"}}]);
  const [lecturerList, setLectturerList] = useState(false);
  useEffect(() => {
    const listOfAccount = getAccountList();
    listOfAccount.then((data) => {
      setAccountList(data.data);
      console.log(data.data);
    })
  }, [])
  const columns = [
    { field: 'student_code', headerName: 'ID', width: 100 },
    {
      field: 'full_name',
      headerName: 'Họ và tên',
      width: 200,
      editable: false,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 250,
      editable: false,
    },
    {
      field: 'departments',
      headerName: 'Khoa',
      width: 300,
      editable: false,
      valueGetter: (params) => params.name
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 250,
      renderCell: (params) => {
        const handleDeleteClick = (id) => {
          console.log(`Delete row with id: ${id}`);
          // Xử lý logic xóa ở đây
        };
          const handleEditClick = (id) => {
              console.log(`Edit row with id: ${id}`);
              // Xử lý logic edit ở đây
          }
  
        return (
          <div>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{width: 90, marginRight: 2}}
              onClick={() => handleDeleteClick(params.id)}
            >
              Xóa
            </Button>
              <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  sx={{width: 90}}
                  onClick={() => navigate(`/accountupdate/${params.id}`)}
              >
                  Sửa
              </Button>
          </div>
        );
      },
    },
  ];

  const handleRowClick = (params) =>{
    console.log(params);
  }
  return (
    <Container sx={{ flexGrow: 1, marginTop: 2, justifyItems: "center", width: "100%" }}>
      <DataGrid
        rows={accountList}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        sx={{width: "100%"}}
        pageSizeOptions={[10]}
        checkboxSelection
        disableRowSelectionOnClick
        //onRowClick={(e)=>handleRowClick(e)}
      />
    </Container>
  )
}
