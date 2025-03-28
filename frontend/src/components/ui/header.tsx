import React from 'react'
import logo from '@/assets/WhiteLogo.png'
import './header.css'

interface HeaderProps {
  redirect: () => void
  showButton: boolean
  page: "upload" | "history"
}

export default function Header({ redirect, showButton, page }: HeaderProps) {
  return (
    <div className='header'>
      <div className='button-row'>
        <div className="redirect" onClick={redirect}>
          <img className='logo' src={logo} alt="logo" width={240} height={156} />
        </div>
        {(showButton ?
          <>
            <div className={(page == "upload" ? "shaded" : "unshaded")}>
              Upload
            </div>
            <div className={(page == "history" ? "shaded" : "unshaded")}>
              History
            </div>
          </>
          : <></>)}
      </div>

      <button className="header-button">
        Dr. Humphery
      </button>

    </div>
  )
}
