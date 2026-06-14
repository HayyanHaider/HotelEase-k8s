import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import 'leaflet/dist/leaflet.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'
import { resolveApiRequestUrl } from './services/urlResolver'

axios.interceptors.request.use((config) => {
  if (typeof config.url === 'string') {
    config.url = resolveApiRequestUrl(config.url);
  }

  return config;
});

const originalFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  if (typeof input === 'string') {
    return originalFetch(resolveApiRequestUrl(input), init);
  }

  if (input instanceof Request) {
    const normalizedUrl = resolveApiRequestUrl(input.url);
    if (normalizedUrl !== input.url) {
      const rewrittenRequest = new Request(normalizedUrl, input);
      return originalFetch(rewrittenRequest, init);
    }
  }

  return originalFetch(input, init);
};

createRoot(document.getElementById('root')).render(
 <StrictMode>
   <App />
 </StrictMode>,
)
