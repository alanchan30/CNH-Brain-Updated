import FileUpload from "@/components/ui/FileUpload";
import Header from "@/components/ui/header";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/components/constants";

export default function Upload() {
  const navigate = useNavigate();
  const { user, loading, error } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [atlas, setAtlas] = useState("");

  const [diagnosis, setDiagnosis] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      console.log("Current user:", {
        id: user.id,
        email: user.email,
        lastSignIn: user.last_sign_in_at,
        metadata: user.user_metadata,
        createdAt: user.created_at,
      });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col">
        <Header showButton redirect={() => navigate("/upload")} page="upload" />
        <div className="flex flex-grow justify-center items-center">
          Loading user data...
        </div>
      </div>
    );
  }

  if (error) {
    console.error("User fetch error:", error);
  }

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file || !user || submitting) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("gender", gender);
    formData.append("age", age);
    formData.append("diagnosis", diagnosis);
    formData.append("atlas", atlas);
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Upload response:", result);

      // Navigate to results page with the fMRI ID
      if (result.fmri_id) {
        navigate(`/results/${result.fmri_id}`);
      } else {
        throw new Error("No fMRI ID received from server");
      }
    } catch (err) {
      console.error("Upload error:", err);
      // You might want to show an error message to the user here
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <Header showButton redirect={() => navigate("/upload")} page="upload" />

      <div className="flex flex-col h-full p-8 space-y-6">
        <div className="flex flex-col space-y-2">
          <h2 className="md:text-5xl text-2xl font-bold">Upload Brain Image</h2>
          {user && (
            <p className="text-sm text-gray-600">Logged in as: {user.email}</p>
          )}
        </div>

        <div className="flex justify-center items-center">
          <FileUpload onFileSelect={handleFileChange} />
        </div>

        <Card className="w-full max-w-3xl self-center">
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="text-black font-bold whitespace-nowrap text-2xl">
                Enter Additional Information:
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <label className="text-black font-bold w-32">Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 p-2 border border-black-500 rounded bg-white text-black"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-black font-bold w-32">
                  Description:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 p-2 border border-black-500 rounded bg-white text-black"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-black font-bold w-32">Age:</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="flex-1 p-2 border border-black-500 rounded bg-white text-black"
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-black font-bold w-32">Sex:</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="flex-1 p-2 border border-black-500 rounded bg-white text-black"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-black font-bold w-32">Diagnosis:</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="flex-1 p-2 border border-black-500 rounded bg-white text-black"
                />
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-black font-bold w-32">Atlas:</label>
                <select
                  value={atlas}
                  onChange={(e) => setAtlas(e.target.value)}
                  className="flex-1 p-2 border border-black-500 rounded bg-white text-black"
                >
                  <option value="">Select</option>
                  <option value="Male">Harvard</option>
                  <option value="Female">CC200</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                className="red-button"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
