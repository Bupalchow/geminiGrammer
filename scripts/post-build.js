import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.resolve(rootDir, 'dist')

console.log('Running post-build script...')

// Make sure dist directory exists
fs.ensureDirSync(distDir)

// Copy manifest.json
fs.copyFileSync(
  path.resolve(rootDir, 'manifest.json'),
  path.resolve(distDir, 'manifest.json')
)

// Copy CSS files if not already in dist
if (!fs.existsSync(path.resolve(distDir, 'index.css'))) {
  fs.copyFileSync(
    path.resolve(rootDir, 'src/index.css'),
    path.resolve(distDir, 'index.css')
  )
}

// Add floating icon CSS
fs.appendFileSync(
  path.resolve(distDir, 'index.css'),
  `
/* Floating icon styles */
.floating-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

.floating-button button {
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 50px;
  padding: 10px 15px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
}

.suggestion-box {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
  max-width: 300px;
  position: relative;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.copy-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.onboarding {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
}

.onboarding input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.onboarding button {
  padding: 8px 15px;
  background: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
`
)

// Copy logo
try {
  fs.copyFileSync(
    path.resolve(rootDir, 'logo.png'),
    path.resolve(distDir, 'logo.png')
  )
} catch (error) {
  console.warn('Warning: logo.png not found, creating a placeholder')
  // Create a placeholder if the logo doesn't exist
  fs.writeFileSync(path.resolve(distDir, 'logo.png'), Buffer.alloc(100))
}

// Make sure index.html exists and has proper script references
const indexHtmlPath = path.resolve(distDir, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  // Update script references in the HTML file
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  // Fix script paths (vite might add /assets/ prefix)
  htmlContent = htmlContent.replace(
    /<script.*?src="\/src\/main\.jsx".*?><\/script>/,
    '<script type="module" src="./main.js"></script>'
  );
  // Also fix other asset references that might have /assets/ prefix
  htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="./assets/');
  htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="./assets/');
  
  fs.writeFileSync(indexHtmlPath, htmlContent);
  console.log('Updated index.html with correct paths');
} else {
  // If index.html doesn't exist, create a basic one
  console.warn('Warning: index.html not found in dist, creating a basic one');
  fs.writeFileSync(
    indexHtmlPath,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini Grammar Assistant</title>
  <link rel="stylesheet" href="index.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./main.js"></script>
</body>
</html>`
  );
}

// Create background.js
fs.writeFileSync(
  path.resolve(distDir, 'background.js'),
  `// Background script
console.log('Gemini Grammar Assistant: Background script loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('Gemini Grammar Assistant extension installed');
});

// Set up message handling between content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background script received message:', message);
  
  if (message.action === 'processText') {
    processWithGemini(message.text, message.apiKey)
      .then(result => {
        console.log('Processed text successfully');
        sendResponse({ success: true, result });
      })
      .catch(error => {
        console.error('Error processing text:', error);
        sendResponse({ success: false, error: error.toString() });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

// Helper function to process text with Gemini API
async function processWithGemini(text, apiKey) {
  console.log('Processing text with Gemini API');
  
  try {
    const response = await fetch(
      \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=\${apiKey}\`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: \`Rewrite this text more professionally. Provide ONLY the improved version without explanations, options, or bullet points: "\${text}"\` }]
          }]
        })
      }
    );
    
    const data = await response.json();
    console.log('Gemini API response:', data);
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error(data.error?.message || 'Invalid response from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error processing with Gemini:', error);
    throw error;
  }
}`
);

// Create content.js with the new functionality to track input fields
fs.writeFileSync(
  path.resolve(distDir, 'content.js'),
  `console.log('Gemini Grammar Assistant: Content script loaded');
    
// Initialize variables to keep track of active input elements
let activeInputElement = null;
let observers = new Map();

// Function to create the UI elements
function createUI() {
  // Create container for the UI
  const uiContainer = document.createElement('div');
  uiContainer.id = 'gemini-grammar-ui';
  uiContainer.style.position = 'absolute';
  uiContainer.style.display = 'none';
  uiContainer.style.zIndex = '9999';
  
  // Create button
  const button = document.createElement('button');
  button.textContent = '✨ Improve Writing';
  button.style.backgroundColor = '#4285f4';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '50px';
  button.style.padding = '6px 12px';
  button.style.fontSize = '12px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  button.style.marginRight = '5px';
  
  // Add the button to the UI container
  uiContainer.appendChild(button);
  
  // Add the UI container to the document
  document.body.appendChild(uiContainer);
  
  // Event listener for the button
  button.addEventListener('click', async () => {
    if (!activeInputElement) return;
    
    const text = activeInputElement.value || activeInputElement.textContent || '';
    if (!text.trim()) {
      alert('No text to improve');
      return;
    }
    
    button.textContent = '⚡ Generating...';
    button.disabled = true;
    
    try {
      // Get API key from storage
      const result = await chrome.storage.local.get('geminiApiKey');
      if (!result.geminiApiKey) {
        alert('API key not found. Please set up your API key in the extension popup.');
        return;
      }
      
      console.log('Sending processText message to background script');
      // Send message to background script
      chrome.runtime.sendMessage(
        {
          action: 'processText',
          text: text,
          apiKey: result.geminiApiKey
        },
        response => {
          console.log('Received response from background script:', response);
          if (response && response.success) {
            // Replace the text in the active input element
            if (activeInputElement instanceof HTMLInputElement || activeInputElement instanceof HTMLTextAreaElement) {
              activeInputElement.value = response.result;
              // Trigger input event to notify any listeners that the value has changed
              activeInputElement.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (activeInputElement.isContentEditable) {
              activeInputElement.textContent = response.result;
              // Trigger input event for contenteditable
              activeInputElement.dispatchEvent(new InputEvent('input', { bubbles: true }));
            }
          } else {
            alert('Error: ' + (response ? response.error : 'Unknown error'));
          }
          
          button.textContent = '✨ Improve Writing';
          button.disabled = false;
        }
      );
    } catch (error) {
      alert('Error: ' + error.message);
      console.error('Error in content script:', error);
      button.textContent = '✨ Improve Writing';
      button.disabled = false;
    }
  });
  
  return { uiContainer, button };
}

// Create the UI elements
const { uiContainer } = createUI();

// Function to position the UI near the active input
function positionUIForElement(element) {
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Position the UI above the input field
  uiContainer.style.top = (rect.top + scrollTop - 40) + 'px';
  uiContainer.style.left = (rect.left + scrollLeft) + 'px';
  uiContainer.style.display = 'block';
}

// Function to hide the UI
function hideUI() {
  uiContainer.style.display = 'none';
}

// Function to create and start an observer for an input field
function observeInputField(inputField) {
  if (observers.has(inputField)) return;
  
  const observer = new MutationObserver((mutations) => {
    if (activeInputElement === inputField) {
      positionUIForElement(inputField);
    }
  });
  
  observer.observe(inputField, { 
    childList: true,
    characterData: true,
    subtree: true 
  });
  
  observers.set(inputField, observer);
  
  // Also attach focus event
  inputField.addEventListener('focus', () => {
    activeInputElement = inputField;
    positionUIForElement(inputField);
  });
  
  // Blur event
  inputField.addEventListener('blur', (e) => {
    // Check if focus is moving to our UI to prevent hiding it when clicking the button
    if (e.relatedTarget && e.relatedTarget.closest('#gemini-grammar-ui')) {
      return;
    }
    
    // Small delay to allow button clicks to register
    setTimeout(() => {
      if (document.activeElement !== inputField && 
          !document.activeElement.closest('#gemini-grammar-ui')) {
        activeInputElement = null;
        hideUI();
      }
    }, 100);
  });
}

// Function to find and observe all input fields on page
function findAndObserveInputFields() {
  // Find all text inputs
  const textInputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
  textInputs.forEach(observeInputField);
  
  // Find all contenteditable elements
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  editableElements.forEach(observeInputField);
}

// Run initial detection
findAndObserveInputFields();

// Create a MutationObserver to detect dynamically added input fields
const bodyObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.addedNodes.length) {
      findAndObserveInputFields();
    }
  });
});

// Start observing the document body for added input fields
bodyObserver.observe(document.body, { childList: true, subtree: true });

// Handle clicks outside of input fields to hide the UI
document.addEventListener('click', (e) => {
  const isClickInInput = e.target.matches('input[type="text"], input[type="email"], textarea') ||
                         e.target.isContentEditable;
  const isClickInUI = e.target.closest('#gemini-grammar-ui');
  
  if (!isClickInInput && !isClickInUI) {
    activeInputElement = null;
    hideUI();
  }
});
`
);

// List all files in dist directory for verification
console.log('Files in dist directory:');
const distFiles = fs.readdirSync(distDir);
console.log(distFiles);

console.log('Post-build steps completed!')
