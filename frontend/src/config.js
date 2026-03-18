// API Configuration
// For local backend: use your machine's IP address
// For ngrok testing: use ngrok URL
// For production: use Railway or cloud hosting URL

// Update .env file with your current ngrok URL when it changes
// ngrok free URLs expire after 2 hours of inactivity

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default API_BASE_URL;
