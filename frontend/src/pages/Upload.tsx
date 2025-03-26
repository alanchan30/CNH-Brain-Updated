import Header from '@/components/ui/header'
import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Upload() {
  const navigate = useNavigate()
  return (
    <>
      <Header showButton redirect={() => navigate("/upload")} page="upload" />
      <div>asnfdjhdskanf</div>
    </>
  )
}
