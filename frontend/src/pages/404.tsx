import { useNavigate } from "react-router-dom";
import Header from "../components/ui/header";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col">
      <Header
        redirect={() => navigate("/landing")}
        showButton={true}
        page="landing"
      />
      <div className="flex flex-col items-center justify-center flex-grow text-center p-6">
        <div className="bg-white shadow-lg p-8 rounded-lg max-w-md w-full">
          <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col gap-4">
            <button
              onClick={() => navigate("/landing")}
              className="bg-red-500 hover:bg-red-600 transition-colors text-white px-6 py-3 rounded flex items-center justify-center"
            >
              Go to Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors px-6 py-3 rounded flex items-center justify-center"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
