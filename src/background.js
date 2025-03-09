console.log('Gemini Grammar Assistant: Background script loaded');

// When the extension is installed
chrome.runtime.onInstalled.addListener(function handleInstalled() {
  console.log('Gemini Grammar Assistant extension installed');
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener(function handleMessages(message, sender, sendResponse) {
  console.log('Background script received message:', message);
  
  // If the message is asking to process text with Gemini
  if (message.action === 'processText') {
    // Process the text with Gemini API
    processTextWithGemini(message.text, message.apiKey)
      .then(function handleSuccess(result) {
        console.log('Processed text successfully');
        // Send the successful result back
        sendResponse({ success: true, result: result });
      })
      .catch(function handleError(error) {
        console.error('Error processing text:', error);
        // Send the error back
        sendResponse({ success: false, error: error.toString() });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

// Function to process text with Gemini API
async function processTextWithGemini(text, apiKey) {
  console.log('Processing text with Gemini API');
  
  try {
    // Call the Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Rewrite this text more professionally. Provide ONLY the improved version without explanations, options, or bullet points: "${text}"` 
            }]
          }]
        })
      }
    );
    
    // Parse the API response
    const data = await response.json();
    console.log('Gemini API response:', data);
    
    // Check if the response is valid
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(data.error?.message || 'Invalid response from Gemini API');
    }
    
    // Return the improved text
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error processing with Gemini:', error);
    throw error;
  }
}