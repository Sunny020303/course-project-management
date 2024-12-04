import React, { useState } from 'react'
import { TextField, Button, Typography } from "@mui/material"
import { InputNumber } from 'antd';
import supabase from "../../services/supabaseClient";
import { useNavigate } from 'react-router-dom';

export default function CreateTopic() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    //const [approvalStatus, setApprovalStatus] = useState("");
    //const [isFinal, setIsFinal] = useState(false);
    const [maxMember, setMaxMember] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from("topics")
                .insert([{
                    //id: "010429a7-673e-4bfe-b090-bae1758771da",
                    class_id: "00bb8171-98d9-4301-b59b-e57b24553b0c",//id class hiện tại
                    name: name,
                    description: description,
                    lecturer_id: "4fa75ffb-fa64-4e08-8ae9-f9a91de855a5",//id người tạo
                    approval_status: "rejected",
                    is_final_project: false,
                    max_members: maxMember,
                    created_by: "4fa75ffb-fa64-4e08-8ae9-f9a91de855a5",//id người tạo
                }]).select();
            if (error) {
                console.log(error);
            }
            if (data) {
                console.log(data);
            }
        } catch (error) {
            setError(error.message);
            console.error("Error registering user:", error);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: "100vh" }}>
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                }}
            >
                <form
                    onSubmit={handleSubmit}
                    style={{ display: "flex", flexDirection: "column", width: "100vh" }}
                >
                    <TextField
                        label="Tên đề tài"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextField
                        label="Mô tả đề tài"
                        variant="outlined"
                        fullWidth
                        margin="normal"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                    <div style={{ display: 'flex', marginTop: 20, marginBottom: 20, alignItems: "center" }}>
                        <Typography variant="h6" width={"25%"}>
                            Số thành viên tối đa
                        </Typography>
                        <InputNumber min={1} max={10} defaultValue={1} onChange={(e) => setMaxMember(e)} style={{ width: '20%', borderRadius: 5, height: 50, fontSize: 17, alignContent: 'center' }} />

                    </div>
                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Đang đăng ký" : "Tạo đề tài mới"}
                    </Button>
                    {error && (
                        <Typography
                            variant="body2"
                            color="error"
                            align="center"
                            sx={{ mt: 2 }}
                        >
                            {error}
                        </Typography>
                    )}

                </form>
            </div>
        </div>
    )
}
