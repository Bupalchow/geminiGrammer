import { useState } from 'react'

export default function FloatingIcon() {
  // Store the suggestion text from the API
  const [suggestion, setSuggestion] = useState('')
  // Track if we're waiting for the API response
  const [loading, setLoading] = useState(false)

  // Handle the generate button click
  async function improveSelectedText() {
    // Get the text that user has selected on the page
    const selectedText = window.getSelection().toString()
    
    // If nothing is selected, do nothing
    if (!selectedText) {
      return
    }
    
    try {
      // Show loading state
      setLoading(true)
      
      // Get the API key from Chrome storage
      const storageData = await chrome.storage.local.get('geminiApiKey')
      const geminiApiKey = storageData.geminiApiKey
      
      // Call the Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ 
                text: `Rewrite this text more professionally. Provide ONLY the improved version without explanations, options, or bullet points: "${selectedText}"` 
              }]
            }]
          })
        }
      )
      
      // Parse the API response
      const data = await response.json()
      
      // Get the improved text from the response
      const improvedText = data.candidates[0].content.parts[0].text
      
      // Update our state with the improved text
      setSuggestion(improvedText)
    } catch (error) {
      // If there's an error, show an alert
      alert('Error: Check API key or internet connection. ' + error)
    } finally {
      // Always hide the loading state when done
      setLoading(false)
    }
  }

  // Handle copying the suggestion to clipboard
  function copySuggestionToClipboard() {
    navigator.clipboard.writeText(suggestion)
  }

  return (
    <div className="floating-button">
      {/* Button that triggers text improvement */}
      <button onClick={improveSelectedText} disabled={loading}>
        {loading ? '⚡ Generating...' : '✨ AI Rewrite'}
      </button>
      
      {/* Only show suggestion box when we have a suggestion */}
      {suggestion && (
        <div className="suggestion-box">
          {suggestion}
          <button 
            className="copy-btn" 
            onClick={copySuggestionToClipboard}
          >
            📋
          </button>
        </div>
      )}
    </div>
  )
}