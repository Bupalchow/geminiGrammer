import { createRoot } from 'react-dom/client';
import FloatingIcon from './components/FloatingIcon';

// Find the container we created in content.js
const containerElement = document.getElementById('ai-writing-root');

// If the container exists, render our React component into it
if (containerElement) {
  // Create a React root in our container
  const reactRoot = createRoot(containerElement);
  
  // Render the FloatingIcon component in the container
  reactRoot.render(<FloatingIcon />);
}