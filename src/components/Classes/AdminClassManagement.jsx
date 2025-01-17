import React, { useEffect, useState } from 'react'
import {
    Button,
    Container,
    Box,
    Alert,
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { getAllClassesDetails, DeleteClassById, bulkCreateClass } from '../../services/classService';
import { getSubject } from '../../services/subjectService';
import { getLecturerAndAdminAccountList } from '../../services/userService';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import { Add } from "@mui/icons-material";
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckIcon from '@mui/icons-material/Check';
import * as XLSX from 'xlsx';

export default function AdminAccountManagement() {
    const navigate = useNavigate();
    const [excelData, setExcelData] = useState([]);
    const [upload, setUpload]=useState("none");
    const [classList, setClassList] = useState([]);
    const [newClassList, setNewClassList] = useState(false);

    const [lecturerList, setLecturerList] = useState([]);
    const [subjectList, setSubjectList] = useState([]);

    useEffect(() => {
        setNewClassList(false);
        setUpload('success');
        try {
            const listOfClass = getAllClassesDetails();
            listOfClass.then((data) => {
                setClassList(data.data);
                //console.log(data.data);
            })
        } catch (e) {
            throw (e);
        }

    }, [newClassList]);

    useEffect(() => {
        setUpload('none');
        const listOfClass = getAllClassesDetails();
        listOfClass.then((data) => {
            setClassList(data.data);
            //console.log(data.data);
        })
        const listOfLecturer = getLecturerAndAdminAccountList();
        listOfLecturer.then((data) => {
            setLecturerList(data.data);
            //console.log(data.data);
        })
        const subject = getSubject();
        subject.then((data) => {
            setSubjectList(data);
        });
    }, [])

    

    const handleUploadFile = () => {
        setUpload('uploading');
        try {
            const classes = bulkCreateClass(excelData);
            classes.then((data) => {
                setNewClassList(true);
                //console.log(data.data);
            })
        } catch (e) {
            throw (e);
        }
    }

    

    const handleFileImport = (e) => {
        try {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const bstr = e.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                let data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                data = data.slice(1);
                for (let i = 0; i < data.length; i++) {
                    //console.log(data[i][4]);
                    const lecturer = lecturerList.filter((temp) => temp.lecturer_code == data[i][4]);
                    const subject = subjectList.filter((temp) => temp.subject_code == data[i][3]);
                    const temp = {
                        class_code: data[i][1],
                        name: data[i][2],
                        subject_id: subject[0].id,
                        lecturer_id: lecturer[0].id,
                        semester: "" + data[i][6] + data[i][5],
                        is_final_project: data[i][7] === 'Yes' ? true : false,
                    };
                    data[i] = temp;
                }
                setExcelData(data);
            };
            reader.readAsBinaryString(file);
            //console.log(excelData);

        } catch (e) {
            throw (e);
        }
    };

    function exportToExcel(data, filename = 'data.xlsx') {
        // Tạo một worksheet
        const ws = XLSX.utils.json_to_sheet(data);
    
        // Tạo một workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1'); // 'Sheet1' là tên của sheet
    
        // Xuất file
        XLSX.writeFile(wb, filename);
    }

    const handleFileExport = () => {
        exportToExcel(classList, 'ClassList.xlsx');    
    };
    const columns = [
        { field: 'class_code', headerName: 'Mã lớp', width: 150 },
        {
            field: 'name',
            headerName: 'Tên lớp',
            width: 200,
            editable: false,
        },
        {
            field: 'subjects',
            headerName: 'Mã môn',
            width: 200,
            editable: false,
            valueGetter: (params) => params.name
        },
        {
            field: 'lecturer',
            headerName: 'Giảng viên',
            width: 200,
            editable: false,
            valueGetter: (params) => params.full_name
        },
        {
            field: 'semester',
            headerName: 'Thời gian',
            width: 180,
            editable: false,
            valueGetter: (params) => {
                return 'Năm học '+(Math.floor(params/10))+", học kỳ "+((params-(Math.floor(params/10))*10));
            }
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 180,
            renderCell: (params) => {
                const handleDeleteClick = (id) => {
                    console.log(`Delete row with id: ${id}`);
                    DeleteClassById(id);
                };
                const handleEditClick = (id) => {
                    console.log(`Edit row with id: ${id}`);
                    // Xử lý logic edit ở đây
                    navigate(`/createclass/${id}`);
                }

                return (
                    <div>
                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            sx={{ width: 70, marginRight: 1 }}
                            onClick={() => handleDeleteClick(params.id)}
                        >
                            Xóa
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<EditIcon />}
                            sx={{ width: 70 }}
                            onClick={() => handleEditClick(params.id)}
                        >
                            Sửa
                        </Button>
                    </div>
                );
            },
        },
    ];


    return (
        <Container sx={{ flexGrow: 1, marginTop: 2, justifyItems: "center", width: "100%" }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: "100%", marginTop: 2, marginBottom: 2 }}>
                <Button variant="outlined" onClick={() => {
                    navigate("/createclass/new");
                }} sx={{ marginRight: 1 }}>
                    <Add sx={{ marginRight: 1 }} /> Thêm lớp mới
                </Button>
                <Button
                    component="label"
                    role={undefined}
                    variant="outlined"
                    tabIndex={-1}
                    sx={{ marginRight: 1 }}
                    startIcon={<AttachFileIcon />}
                >
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileImport} />
                </Button>
                {excelData.length !== 0 && <Button color={upload==='success'? 'success' : "primary"} variant="outlined" onClick={handleUploadFile} startIcon={upload==='success'? <CheckIcon/> :<CloudUploadIcon />} sx={{ marginRight: 1 }}>
                    {upload==='none' ? "Upload file" : upload==='uploading' ? "Uploading" : "Success"}
                </Button>}
                <Button variant="outlined" onClick={handleFileExport} sx={{ marginRight: 1 }}>
                    <FileDownloadIcon sx={{ marginRight: 1 }} /> Export file
                </Button>
            </Box>
            <DataGrid
                rows={classList}
                columns={columns}
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
