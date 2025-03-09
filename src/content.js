console.log('Content script loaded');

// Create a container for our React app
const rootElement = document.createElement('div');
rootElement.id = 'ai-writing-root';
document.body.appendChild(rootElement);

// Load the React component
// This will add the floating button to the page
import('./mountContent.jsx').catch(function handleError(error) {
  console.error('Failed to load the AI writing assistant:', error);
});