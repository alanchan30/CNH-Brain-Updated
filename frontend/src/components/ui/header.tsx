import React from 'react'
import logo from '@/assets/WhiteLogo.png'
import './header.css'

export default function Header() {
  return (
    <div className='header'>
      <div>
        <img className='logo' src = {logo} alt="logo" width={240} height={156} />
      </div>
      
      <button>
        Dr. Humphery
      </button>
      
    </div>
  )
}
