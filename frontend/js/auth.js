/**
 * Auth helpers — reading/writing session data in localStorage
 */

function getToken() {
  return localStorage.getItem('tl_token');
}

function getUser() {
  return {
    token: localStorage.getItem('tl_token'),
    username: localStorage.getItem('tl_username'),
    user_type: localStorage.getItem('tl_user_type'),
    display_name: localStorage.getItem('tl_display_name'),
  };
}

function saveUser(loginResponse) {
  localStorage.setItem('tl_token', loginResponse.token);
  localStorage.setItem('tl_username', loginResponse.username);
  localStorage.setItem('tl_user_type', loginResponse.user_type);
  localStorage.setItem('tl_display_name', loginResponse.display_name);
}

function clearUser() {
  localStorage.removeItem('tl_token');
  localStorage.removeItem('tl_username');
  localStorage.removeItem('tl_user_type');
  localStorage.removeItem('tl_display_name');
}

/** Redirect to login if not authenticated */
function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

/** Redirect to catalog if not admin */
function requireAdmin() {
  if (!requireAuth()) return false;
  const user = getUser();
  if (user.user_type !== 'admin_user') {
    window.location.href = 'catalog.html';
    return false;
  }
  return true;
}

/** Render the navbar user display */
function renderNavUser() {
  const user = getUser();
  const el = document.getElementById('nav-username');
  if (el) el.textContent = user.display_name || user.username;

  const adminLink = document.getElementById('nav-admin-link');
  if (adminLink) {
    adminLink.style.display = user.user_type === 'admin_user' ? '' : 'none';
  }
}

/** Logout: call API then clear local storage and redirect */
async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (_) {
    // ignore errors — clear local state regardless
  }
  clearUser();
  window.location.href = 'index.html';
}
