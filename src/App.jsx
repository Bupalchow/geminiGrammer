import { useEffect, useState } from 'react'
import Onboarding from './components/Onboarding.jsx'
import Settings from './components/Settings.jsx'

export default function App() {
  // Track if user has already saved an API key
  const [hasApiKey, setHasApiKey] = useState(false)
  // Track if we're still loading data from storage
  const [loading, setLoading] = useState(true)
  
  // When component loads, check if API key exists
  useEffect(function checkForApiKey() {
    // Get the API key from Chrome storage
    chrome.storage.local.get(['geminiApiKey'], function handleStorageResult(result) {
      // If the API key exists, mark that we have one
      if (result.geminiApiKey) {
        setHasApiKey(true)
      } else {
        setHasApiKey(false)
      }
      
      // Either way, we're done loading
      setLoading(false)
    })
  }, [])

  // Show loading message while checking for API key
  if (loading) {
    return <div className="loading">Loading...</div>
  }

  // Show appropriate screen based on whether user has API key
  return (
    <div className="app-container">
      {!hasApiKey ? (
        <Onboarding 
          onSuccess={function apiKeySaved() {
            setHasApiKey(true)
          }} 
        />
      ) : (
        <Settings 
          onReset={function apiKeyReset() {
            setHasApiKey(false)
          }} 
        />
      )}
    </div>
  )
}