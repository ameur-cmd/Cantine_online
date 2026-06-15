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
 * GLOBAL SCOPE WRAPPERS
 * Because GitHub Pages runs standard ES5/ES6 sequential script attachments, 
 * button interactions using inline attributes (e.g., onclick="handleOrderAdvance()")
 * require target actions to be explicitly mounted or mapped onto the global window object.
 */
window.addItemToCart = (id, name, price) => {
  if (typeof addItemToCart === "function") addItemToCart(id, name, price);
};

window.updateCartQty = (id, delta) => {
  if (typeof updateCartQty === "function") updateCartQty(id, delta);
};

window.submitEmployeeOrder = () => {
  if (typeof submitEmployeeOrder === "function") submitEmployeeOrder();
};

window.advanceCantineOrder = (id, currentStatus) => {
  if (typeof advanceCantineOrder === "function") advanceCantineOrder(id, currentStatus);
};

window.cancelCantineOrder = (id) => {
  if (typeof cancelCantineOrder === "function") cancelCantineOrder(id);
};

window.toggleAuthTab = (tab) => {
  if (typeof toggleAuthTab === "function") toggleAuthTab(tab);
};