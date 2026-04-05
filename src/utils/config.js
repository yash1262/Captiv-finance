// API Configuration for production and development
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://localhost:3000' 
  : 'https://captiv-finance.onrender.com';

export default API_BASE_URL;
