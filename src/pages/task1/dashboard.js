import React,{useState} from "react";
import { Button, Form, Input } from "antd";
import { Link, Navigate, useNavigate } from "react-router-dom";

export default function Dashboard() {

    const navigate = useNavigate();

    const toLogin = () => {
        navigate("/dang-nhap");
    }
    return (
        <div>
            <h1>This is dashboard</h1>
            <Button type="primary" onClick={toLogin}>To login</Button>
            <Button type="primary" onClick={() => {navigate("/dang-ky")}} >To Signup</Button>
            <Button type="primary">test</Button>
            <p></p>
            <Link to="/dang-ky" style={{ color: "#4B268F", marginTop: 30 }}>
                Dang ky
            </Link>
        </div>
    );
}
 