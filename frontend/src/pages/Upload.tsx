import FileUpload from '@/components/ui/FileUpload'
import Header from '@/components/ui/header'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Upload() {
  const navigate = useNavigate()
  const handleNext = () => {
    console.log('Next button clicked');
  }

  return (
    <>
      <Header showButton redirect={() => navigate("/upload")} page="upload" />

      <div className="flex flex-col h-screen p-8">
        <div>
          <h2 className="text-2xl font-bold">Upload Brain Image</h2>
          <p className="text-black-600 font-semibold">description of image etc</p>
        </div>

        <div className="flex flex-grow justify-center items-center">
          <FileUpload />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleNext}
            // className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition"
            className="p-16"
          >
            Next
          </button>
        </div>
      </div>
    </>
  )
}
