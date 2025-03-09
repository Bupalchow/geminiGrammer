export default function Settings({ onReset }) {
  // Handle the reset button click
  function resetApiKey() {
    // Remove the API key from Chrome storage
    chrome.storage.local.remove('geminiApiKey', function afterRemoving() {
      // Let parent component know key was removed
      onReset()
      // Close the popup
      window.close()
    })
  }

  return (
    <div className="settings">
      <h2>⚙️ Settings</h2>
      <button onClick={resetApiKey} className="reset-btn">
        🔑 Reset API Key
      </button>
      <p className="help-text">
        Need help?{' '}
        <a 
          href="https://ai.google.dev/" 
          target="_blank"
          rel="noopener noreferrer"
        >
          Get API key guide
        </a>
      </p>
    </div>
  )
}