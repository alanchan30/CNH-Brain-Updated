import { useState, useEffect } from 'react'
import { supabase } from '../../../backend/auth/supabaseClient' // Adjust the path to your supabase client
import App from '../App' // Adjust the path to your main App component
import { AuthMFA } from './MFA' // Import your MFA component

export function AppWithMFA() {
  const [readyToShow, setReadyToShow] = useState(false)
  const [showMFAScreen, setShowMFAScreen] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
        if (error) {
          throw error
        }

        console.log(data)

        if (data.nextLevel === 'aal2' && data.nextLevel !== data.currentLevel) {
          setShowMFAScreen(true)
        }
      } finally {
        setReadyToShow(true)
      }
    })()
  }, [])

  if (readyToShow) {
    if (showMFAScreen) {
      return <AuthMFA />
    }

    return <App />
  }

  return <></>
}

export default AppWithMFA 