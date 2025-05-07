import Header from "@/components/ui/header";
import History from "@/components/ui/history";
import { useNavigate } from "react-router-dom";

const HistoryPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col">
      <Header page="history" showButton redirect={() => navigate("/landing")} />
      <div className="flex-grow overflow-auto">
        <History />
      </div>
    </div>
  );
};

export default HistoryPage;
