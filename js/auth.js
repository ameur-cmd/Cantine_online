// js/auth.js

// Global state for the currently logged-in user
let currentUser = null;

// Initialize Authentication Event Listeners
function initAuth() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
  
  // Check if a user session already exists in localStorage
  const savedUser = localStorage.getItem('leoni_current_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    routeToApp(currentUser.role);
  }
}

// Handle Login Submission
async function handleLogin(e) {
  e.preventDefault();
  const badgeId = document.getElementById('loginBadgeId').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!badgeId || !password) {
    alert("Please fill in all fields.");
    return;
  }

  showLoader(true);
  // Call your Google Sheets backend API
  const user = await CantineAPI.loginUser(badgeId, password);
  showLoader(false);

  if (user) {
    currentUser = user;
    localStorage.setItem('leoni_current_user', JSON.stringify(user));
    routeToApp(user.role);
  } else {
    alert("Invalid Badge ID or Password.");
  }
}

// Handle Registration Submission
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const badgeId = document.getElementById('regBadgeId').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;

  if (!name || !badgeId || !password) {
    alert("Please fill in all fields.");
    return;
  }

  showLoader(true);
  const success = await CantineAPI.registerUser({ name, badgeId, password, role });
  showLoader(false);

  if (success) {
    alert("Registration successful! Please log in.");
    toggleAuthTab('login');
  } else {
    alert("Registration failed. Badge ID might already exist.");
  }
}

// Logout Utility
function handleLogout() {
  currentUser = null;
  localStorage.removeItem('leoni_current_user');
  
  // Hide application views and show login screen
  document.getElementById('employeeApp').classList.add('hidden');
  document.getElementById('cantineApp').classList.add('hidden');
  document.getElementById('authPage').classList.remove('hidden');
}

// Navigation Router based on Leoni Roles
function routeToApp(role) {
  document.getElementById('authPage').classList.add('hidden');
  
  if (role === 'cantine') {
    document.getElementById('cantineApp').classList.remove('hidden');
    initCantineDashboard();
  } else {
    document.getElementById('employeeApp').classList.remove('hidden');
    initEmployeeDashboard();
  }
}

// UI tab switching logic between Login & Sign Up view wrappers
function toggleAuthTab(tab) {
  const loginWrapper = document.getElementById('loginWrapper');
  const registerWrapper = document.getElementById('registerWrapper');
  
  if (tab === 'login') {
    loginWrapper.classList.remove('hidden');
    registerWrapper.classList.add('hidden');
  } else {
    loginWrapper.classList.add('hidden');
    registerWrapper.classList.remove('hidden');
  }
}