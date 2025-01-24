import React, { useEffect, useState } from 'react'
import {
  Button,
  Container,
  Typography,
  Chip,
  Switch,
  Box
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { getStudentAccountList, DeleteUserById, getLecturerAndAdminAccountList } from '../../services/userService';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { Add } from "@mui/icons-material";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';

export default function AdminAccountManagement() {
  const navigate = useNavigate();
  const [accountList, setAccountList] = useState([{ id: "123", full_name: "Duong", email: "neko", departments: { name: "doanxem" } }]);
  const [lecturerList, setLectturerList] = useState([{ id: "123", full_name: "Duong", email: "neko", departments: { name: "doanxem" } }]);
  const [listType, setListType] = useState(true);
  useEffect(() => {
    const listOfStudentAccount = getStudentAccountList();
    listOfStudentAccount.then((data) => {
      setAccountList(data.data);
      //console.log(data.data);
    })
    const listOfLecturerAccount = getLecturerAndAdminAccountList();
    listOfLecturerAccount.then((data) => {
      setLectturerList(data.data);
      //console.log(data.data);
    })
  }, [])

  function exportToExcel(data, filename = 'data.xlsx') {
    let count = 1;
    const formattedData = data.map(item => ({
      "STT": count++,
      "Mã số": item.student_code? item.student_code : item.lecturer_code,
      "Email": item.email,
      "Khoa": item.departments?.name,
      "Phân loại": item.role,
    }));
    // Tạo một worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);

    // Tạo một workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1'); // 'Sheet1' là tên của sheet

    // Xuất file
    XLSX.writeFile(wb, filename);
  }

  const handleExportFile = () => {
    exportToExcel(listType ? accountList : lecturerList, 'AccountList.xlsx');
  };
  const columns = [
    {
      field: 'student_code',
      headerName: 'ID',
      width: 100,
    },
    {
      field: 'full_name',
      headerName: 'Họ và tên',
      width: 180,
      editable: false,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 230,
      editable: false,
    },
    {
      field: 'departments',
      headerName: 'Khoa',
      width: 250,
      editable: false,
      valueGetter: (params) => params.name
    },
    {
      field: 'role',
      headerName: 'Phân loại',
      width: 130,
      editable: false,
      renderCell: (params) => {
        return (
          <Chip label={params.row.role} color={params.row.role === "student" ? 'secondary' : params.row.role === "lecturer" ? 'primary' : 'error'} />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => {
        const handleDeleteClick = (id) => {
          console.log(`Delete row with id: ${id}`);
          //DeleteUserById(id);
        };
        const handleEditClick = (id) => {
          console.log(`Edit row with id: ${id}`);
          // Xử lý logic edit ở đây
          navigate(`/accountupdate/${id}`);
        }

        return (
          <div>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ width: 80, marginRight: 1 }}
              onClick={() => handleDeleteClick(params.id)}
            >
              Xóa
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              sx={{ width: 80 }}
              onClick={() => handleEditClick(params.id)}
            >
              Sửa
            </Button>
          </div>
        );
      },
    },
  ];

  const columnsLecturer = [
    {
      field: 'lecturer_code',
      headerName: 'ID',
      width: 100,
    },
    {
      field: 'full_name',
      headerName: 'Họ và tên',
      width: 180,
      editable: false,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 230,
      editable: false,
    },
    {
      field: 'departments',
      headerName: 'Khoa',
      width: 250,
      editable: false,
      valueGetter: (params) => params.name
    },
    {
      field: 'role',
      headerName: 'Phân loại',
      width: 130,
      editable: false,
      renderCell: (params) => {
        return (
          <Chip label={params.row.role} color={params.row.role === "student" ? 'secondary' : params.row.role === "lecturer" ? 'primary' : 'error'} />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => {
        const handleDeleteClick = (id) => {
          //console.log(`Delete row with id: ${id}`);
          DeleteUserById(id);
          setAccountList(accountList.filter((i) => i.id !== id));
          setLectturerList(lecturerList.filter((i) => i.id !== id));
        };
        const handleEditClick = (id) => {
          console.log(`Edit row with id: ${id}`);
          // Xử lý logic edit ở đây
          navigate(`/accountupdate/${id}`);
        }

        return (
          <div>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ width: 80, marginRight: 1 }}
              onClick={() => handleDeleteClick(params.id)}
            >
              Xóa
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<EditIcon />}
              sx={{ width: 80 }}
              onClick={() => handleEditClick(params.id)}
            >
              Sửa
            </Button>
          </div>
        );
      },
    },
  ];

  const handleRowClick = (params) => {
    console.log(params);
  }
  return (
    <Container sx={{ flexGrow: 1, justifyItems: "center", width: "100%" }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: "100%", marginTop: 2, marginBottom: 2 }}>
        <Box>
          <Button variant="outlined" onClick={() => {
            navigate("/register");
          }} sx={{ marginRight: 1 }}>
            <Add sx={{ marginRight: 1 }} /> Thêm lớp tài khoản mới
          </Button>
          <Button variant="outlined" onClick={() => {
            //handleImportFile();
          }} sx={{ marginRight: 1 }}>
            <AttachFileIcon sx={{ marginRight: 1 }} /> Import file
          </Button>
          <Button variant="outlined" onClick={() => {
            handleExportFile();
          }} sx={{ marginRight: 1 }}>
            <FileDownloadIcon sx={{ marginRight: 1 }} /> Export file
          </Button>
        </Box>


        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Typography variant='subtitle2'>Danh sách sinh viên</Typography>
          <Switch name='lecturerList' onChange={() => setListType(!listType)} />
          <Typography variant='subtitle2'>Danh sách giảng viên</Typography>
        </Box>
      </Box>
      <DataGrid
        rows={listType ? accountList : lecturerList}
        columns={listType ? columns : columnsLecturer}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        sx={{ width: "100%" }}
        pageSizeOptions={[10]}
        checkboxSelection
        disableRowSelectionOnClick
      //onRowClick={(e)=>handleRowClick(e)}
      />
    </Container>
  )
}
