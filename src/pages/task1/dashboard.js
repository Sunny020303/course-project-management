import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  navigate("/login", { replace: true });
  return null;
}
