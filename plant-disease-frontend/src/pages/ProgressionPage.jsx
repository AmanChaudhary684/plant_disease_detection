// pages/ProgressionPage.jsx
import ProgressionTracker from "../ProgressionTracker";
import { useNavigate } from "react-router-dom";
export default function ProgressionPage() {
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
      <ProgressionTracker onClose={() => navigate("/")} />
    </div>
  );
}