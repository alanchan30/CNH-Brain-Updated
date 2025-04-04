import React from "react";
import Header from "@/components/ui/header";
import { useNavigate } from "react-router-dom";

const Redirect = () => {
  const navigate = useNavigate();
  return (
    <div className="w-screen h-screen bg-black">
      <Header
        redirect={() => navigate("/")}
        showButton={false}
        page="landing"
      />
    </div>
  );
};

export default Redirect;
