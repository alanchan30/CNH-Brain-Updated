import React from 'react'
import logo from '@/assets/WhiteLogo.png'
import './header.css'

interface HeaderProps {
  redirect: () => void
}

export default function Header({ redirect }: HeaderProps) {
  return (
    <div className='header'>
      <div onClick={redirect}>
        <img className='logo' src={logo} alt="logo" width={240} height={156} />
      </div>

      <button>
        Dr. Humphery
      </button>

    </div>
  )
}
