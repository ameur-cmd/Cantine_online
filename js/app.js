/**
 * js/app.js
 * Main Application Lifecycle Bootstrap & Shared UI Orchestrator
 * Integrates Auth, Employee Operations, and Cantine Dashboards.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize Global Loader State Tracking
  initGlobalLoader();

  // 2. Initialize Authentication Forms and State Listeners
  if (typeof initAuth === "function") {
    initAuth();
  } else {
    console.error("Critical Failure: auth.js failed to load properly.");
  }

  // 3. Attach Global Event Listeners for Logout Buttons dynamically
  const logoutButtons = document.querySelectorAll(".btn-logout");
  logoutButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (typeof handleLogout === "function") {
        handleLogout();
      }
    });
  });
});

/**
 * Ensures global dynamic loader overlays exist or setups structural fallback configurations
 */
function initGlobalLoader() {
  let loader = document.getElementById('globalLoaderElement');
  
  // If the spinner element doesn't exist in the layout HTML, build it on the fly
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'globalLoaderElement';
    loader.className = 'loader-overlay hidden';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
  }
}

/**
 * Shared Global UI Loader state modifier accessible by all sub-modules
 * @param {boolean} show - True displays the blurred loader blocking layer, False hides it.
 */
function showLoader(show) {
  const loader = document.getElementById('globalLoaderElement');
  if (!loader) return;
  
  if (show) {
    loader.classList.remove('hidden');
  } else {
    loader.classList.add('hidden');
  }
}

/**
 * NOTE: No global wrappers needed here.
 * auth.js, employee.js, and cantine.js declare their functions as plain
 * top-level `function` statements, which are already attached to `window`
 * automatically in a browser. Inline onclick="..." attributes in index.html
 * can call them directly. (A previous version of this file wrapped them
 * in window.X = () => { if (typeof X === "function") X() } — but since
 * window.X IS X in the global scope, that caused infinite self-recursion
 * and a "Maximum call stack size exceeded" crash as soon as any of them
 * were triggered.)
 */