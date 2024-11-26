import React,{useState} from "react";
import { Button, Form, Input } from "antd";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
    const nav = useNavigate();

    return (
        <div>
            <h1>This is login</h1>
            <Button type="primary" onClick={() => nav("/")}>Login</Button>

        </div>
        
    );
}
 