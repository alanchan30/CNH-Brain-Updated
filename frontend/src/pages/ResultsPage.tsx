import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { useEffect } from "react";
import Header from "../components/ui/header";
import { Slider } from "@/components/ui/slider"
import { ThreeDimRes } from "@/components/ThreeDimRes";
import { TwoDimRes } from "@/components/TwoDimRes";
import { SideViewRes } from "@/components/SideViewRes";

const ResultsPage = () => {
    const { user, isAuthenticated, loading, } = useAuth();
    const navigate = useNavigate();
  
    useEffect(() => {
      if (!loading && !isAuthenticated) {
        navigate("/login");
      }
    }, [loading, isAuthenticated, navigate]);
    
    return (
        <div className="h-screen flex flex-col">
            <Header 
                redirect={() => navigate("/dashboard")} 
                showButton={true}
                page="results"
            />
             <div className="p-6 overflow-y-auto">
                <div>
                    <h1 className="text-start text-4xl font-bold">Model Results</h1>
                </div>
                <div className="w-full" style={{ backgroundColor: "var(--blue)" }}>
                    <h1 className="text-white text-center text-4xl font-bold mt-10">2D Model</h1>
                </div>
                <div>
                    {/* For the brain image */}
                    <div className="flex flex-col items-center justify-center">
                        <TwoDimRes />
                    </div>
                    {/* For the slider */}
                    <Slider defaultValue={[33]} max={100} step={1} />
                    {/* For the 3 cards */}
                    <div className="flex flex-row items-center justify-center">
                        <div>
                            <SideViewRes />
                            <h2 className="text-center text-xl font-bold">Axial View</h2>
                        </div>
                        <div>
                            <SideViewRes />
                            <h2 className="text-center text-xl font-bold">Coronal View</h2>
                        </div>
                        <div>
                            <SideViewRes />
                            <h2 className="text-center text-xl font-bold">Sagittal View</h2>
                        </div>
                    </div>
                </div>
                <div className="w-full" style={{ backgroundColor: "var(--blue)" }}>
                    <h1 className="text-white text-center text-4xl font-bold mt-10">3D Model</h1>
                </div>
                <div className="flex flex-col items-center justify-center">
                    <ThreeDimRes />
                </div>
                <div className="flex flex-col items-center">
                    <button className="text-white px-4 py-2 rounded mt-4 flex items-center justify-center" style={{ backgroundColor: "var(--red)" }}>View Anomaly Results</button>
                </div>
             </div>
        </div>
    )
}

export default ResultsPage;