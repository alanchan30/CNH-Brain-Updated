import FileUpload from "@/components/ui/FileUpload";
import Header from "@/components/ui/header";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import { Card, CardContent } from "@/components/ui/card";
import { API_URL } from "@/components/constants";
import { useToast } from "@/components/ui/toast";
import { BeatLoader } from "react-spinners";

export default function Upload() {
  const navigate = useNavigate();
  const { user, loading: userLoading, error: userError } = useUser();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [atlas, setAtlas] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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

  useEffect(() => {
    if (userError) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "There was a problem with your user session.",
      });
    }
  }, [userError, toast]);

  if (userLoading) {
    return (
      <div className="h-screen flex flex-col">
        <Header showButton redirect={() => navigate("/upload")} page="upload" />
        <div className="flex flex-grow justify-center items-center">
          <BeatLoader color="#0177CD" size={15} />
          <span className="ml-3 text-gray-700">Loading user data...</span>
        </div>
      </div>
    );
  }

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    // Clear any previous file error
    setErrors(prev => ({ ...prev, file: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!file) newErrors.file = "Please upload a brain image file";
    if (!title.trim()) newErrors.title = "Title is required";
    if (!gender) newErrors.gender = "Please select a gender";
    if (!age) newErrors.age = "Age is required";
    if (!diagnosis.trim()) newErrors.diagnosis = "Diagnosis is required";
    if (!atlas) newErrors.atlas = "Please select an atlas";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user || submitting) return;
    
    // Validate form first
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setSubmitting(true);
    setUploadProgress(10);
    
    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("gender", gender);
    formData.append("age", age);
    formData.append("diagnosis", diagnosis);
    formData.append("atlas", atlas);
    formData.append("file", file as File);

    try {
      // Get access token from localStorage
      const accessToken = localStorage.getItem('access_token');
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: formData,
        credentials: 'include',
        mode: 'cors'
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Upload failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Upload failed: ${response.statusText || 'Server error'}`);
      }

      const result = await response.json();
      console.log("Upload response:", result);

      toast({
        variant: "success",
        title: "Upload Successful",
        description: "Your brain scan has been uploaded successfully!",
      });

      // Navigate to results page with the fMRI ID
      if (result.fmri_id) {
        setTimeout(() => {
          navigate(`/results/${result.fmri_id}`);
        }, 1000); // Give time for the user to see the success message
      } else {
        throw new Error("No fMRI ID received from server");
      }
    } catch (err) {
      console.error("Upload error:", err);
      
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
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
          <FileUpload 
            onFileSelect={handleFileChange} 
            error={errors.file}
          />
        </div>

        <Card className="w-full max-w-3xl self-center shadow-md">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center space-x-4">
              <h3 className="text-black font-bold whitespace-nowrap text-2xl">
                Enter Additional Information
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col space-y-2">
                <label className="text-black font-semibold">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors(prev => ({ ...prev, title: "" }));
                  }}
                  className={`p-3 border rounded-md bg-white text-black focus:ring-2 focus:ring-blue-300 focus:outline-none transition ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter a title for this scan"
                />
                {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-black font-semibold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-3 border border-gray-300 rounded-md bg-white text-black focus:ring-2 focus:ring-blue-300 focus:outline-none transition min-h-24 resize-y"
                  placeholder="Add any relevant details about this scan"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col space-y-2">
                  <label className="text-black font-semibold">Age <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => {
                      setAge(e.target.value);
                      setErrors(prev => ({ ...prev, age: "" }));
                    }}
                    className={`p-3 border rounded-md bg-white text-black focus:ring-2 focus:ring-blue-300 focus:outline-none transition ${
                      errors.age ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Patient age"
                  />
                  {errors.age && <p className="text-red-500 text-sm">{errors.age}</p>}
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-black font-semibold">Sex <span className="text-red-500">*</span></label>
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      setErrors(prev => ({ ...prev, gender: "" }));
                    }}
                    className={`p-3 border rounded-md bg-white text-black focus:ring-2 focus:ring-blue-300 focus:outline-none transition ${
                      errors.gender ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col space-y-2">
                  <label className="text-black font-semibold">Diagnosis <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => {
                      setDiagnosis(e.target.value);
                      setErrors(prev => ({ ...prev, diagnosis: "" }));
                    }}
                    className={`p-3 border rounded-md bg-white text-black focus:ring-2 focus:ring-blue-300 focus:outline-none transition ${
                      errors.diagnosis ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Current diagnosis"
                  />
                  {errors.diagnosis && <p className="text-red-500 text-sm">{errors.diagnosis}</p>}
                </div>

                <div className="flex flex-col space-y-2">
                  <label className="text-black font-semibold">Atlas <span className="text-red-500">*</span></label>
                  <select
                    value={atlas}
                    onChange={(e) => {
                      setAtlas(e.target.value);
                      setErrors(prev => ({ ...prev, atlas: "" }));
                    }}
                    className={`p-3 border rounded-md bg-white text-black focus:ring-2 focus:ring-blue-300 focus:outline-none transition ${
                      errors.atlas ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">Select atlas</option>
                    <option value="Harvard">Harvard</option>
                    <option value="CC200">CC200</option>
                  </select>
                  {errors.atlas && <p className="text-red-500 text-sm">{errors.atlas}</p>}
                </div>
              </div>
            </div>

            {/* Upload progress bar */}
            {submitting && (
              <div className="mt-4">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-center mt-2 text-gray-600">
                  {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-md transition-all text-white font-medium ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-[#0177CD] hover:bg-blue-700 active:bg-blue-800'
                }`}
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <BeatLoader color="#ffffff" size={8} />
                    <span className="ml-2">Uploading...</span>
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
