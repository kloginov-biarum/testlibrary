/**
 * TestLibrary API client
 * Change API_BASE to point to your deployed backend.
 */
const API_BASE = 'https://testlibrary-2.onrender.com';

/**
 * Centralized fetch wrapper.
 * - Injects Authorization header from localStorage
 * - Redirects to login on 401
 * - Returns parsed JSON or throws an Error with the server's detail message
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('tl_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  let resp;
  try {
    resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error('Cannot connect to the server. Is the backend running?');
  }

  if (resp.status === 401) {
    localStorage.clear();
    window.location.href = 'index.html';
    return;
  }

  // For 204 No Content
  if (resp.status === 204) return null;

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    throw new Error(data.detail || `HTTP ${resp.status}`);
  }

  return data;
}
