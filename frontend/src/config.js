// API Configuration
// For local backend: use your machine's IP address
// For ngrok testing: use ngrok URL
// For production: use Railway or cloud hosting URL

// ngrok URL: https://edgar-internuncial-paul.ngrok-free.dev
// Railway URL format: https://orchid-visitor-portal-production.up.railway.app
// Update this with your actual backend URL

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://edgar-internuncial-paul.ngrok-free.dev';

export default API_BASE_URL;
