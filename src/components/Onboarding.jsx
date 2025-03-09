import { useState } from 'react'

export default function Onboarding({ onSuccess }) {
  // Store the API key as user types it
  const [apiKey, setApiKey] = useState('')

  // Handle the save button click
  function saveApiKey() {
    // Save the API key to Chrome storage
    chrome.storage.local.set({ 
      geminiApiKey: apiKey 
    }, function afterSaving() {
      // Let parent component know saving was successful
      onSuccess()
      // Close the popup
      window.close()
    })
  }

  // Handle when user types in the input
  function updateApiKey(event) {
    setApiKey(event.target.value)
  }

  return (
    <div className="onboarding">
      <h2>🔑 Enter Google Gemini API Key</h2>
      <input
        type="password"
        value={apiKey}
        onChange={updateApiKey}
        placeholder="Paste your API key here"
      />
      <button onClick={saveApiKey}>Save & Start</button>
      <p className="guide-link">
        <a href="https://aistudio.google.com/app/apikey" target="_blank">
          Get free API key ↗
        </a>
      </p>
      <p className="disclaimer">
        🔒 Your key stays locally in your browser. 
      </p>
    </div>
  )
}