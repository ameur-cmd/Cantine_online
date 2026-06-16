// js/employee.js

let cart = [];
let selectedPlant = "";
let selectedDay = "";

// ===================== ORDER REVIEW STATE TRACKING =====================
let currentReviewRating = 0;
let currentReviewOrderId = null;

// Initialize Employee View UI elements
async function initEmployeeDashboard() {
  if (currentUser) {
    document.getElementById('employeeWelcomeName').innerText = currentUser.name || currentUser.firstName || "";
  }

  // Default plant/day from the logged-in user's profile / today's date
  selectedPlant = currentUser && currentUser.plant ? currentUser.plant : "";
  selectedDay = new Date().toISOString().slice(0, 10);

  const plantSelect = document.getElementById('plantSelect');
  if (plantSelect && selectedPlant) plantSelect.value = selectedPlant;

  const daySelect = document.getElementById('daySelect');
  if (daySelect) daySelect.value = selectedDay;

  // Reset active configurations
  cart = [];
  updateCartUI();

  showLoader(true);
  // Pull fresh food options directly from your Google Sheet
  const items = await CantineAPI.getMenuCatalog(selectedPlant, selectedDay);
  showLoader(false);

  renderMenuCatalog(items);

  // Initialize star rating event listeners
  initStarRatingInteraction();

  // Fetch recent orders and evaluate eligibility for review
  await evaluateAndPresentReviewEligibility();
}

/**
 * Initialize star rating click handlers
 * Sets up the interactive 5-star selection interface
 */
function initStarRatingInteraction() {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const value = parseInt(this.getAttribute('data-value'), 10);
      setUIDisplayRating(value);
    });
  });
}

/**
 * Update the visual star rating display
 * @param {number} value - Selected rating value (1-5)
 */
function setUIDisplayRating(value) {
  currentReviewRating = value;
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add('selected');
    } else {
      star.classList.remove('selected');
    }
  });
}

/**
 * Fetch employee's order history and determine if review is eligible
 * If latest order is completed and unrated, show the review card
 */
async function evaluateAndPresentReviewEligibility() {
  try {
    // Fetch all orders for the current employee
    const orders = await CantineAPI.getAllOrders(selectedPlant);
    if (!orders || orders.length === 0) {
      return;
    }

    // Find the most recent completed order without a rating
    let eligibleOrder = null;
    for (let i = orders.length - 1; i >= 0; i--) {
      const order = orders[i];
      // Check if order belongs to current user, is completed, and has no rating
      if (
        order.status === "completed" &&
        (!order.rating || order.rating === null || order.rating === "")
      ) {
        eligibleOrder = order;
        break;
      }
    }

    // If an eligible order is found, present the review block
    if (eligibleOrder) {
      presentReviewBlockIfEligible(eligibleOrder);
    }
  } catch (error) {
    console.error("Error evaluating review eligibility:", error);
  }
}

/**
 * Display the review feedback card if order is eligible
 * Injects order reference data and reveals the card
 * @param {Object} lastOrder - Order object with id, status, and other details
 */
function presentReviewBlockIfEligible(lastOrder) {
  if (!lastOrder || !lastOrder.id) {
    return;
  }

  // Store the order ID for submission
  currentReviewOrderId = lastOrder.id;

  // Reset rating UI state
  currentReviewRating = 0;
  setUIDisplayRating(0);

  // Clear the comment box
  const commentBox = document.getElementById('reviewCommentBox');
  if (commentBox) {
    commentBox.value = "";
  }

  // Make the review card visible
  const reviewCard = document.getElementById('recentOrdersSection');
  if (reviewCard) {
    reviewCard.classList.remove('hidden');
    // Optional: scroll to the card for better UX
    reviewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Submit the order review (rating + comment) to the backend
 * Performs validation, shows loader, handles response, and hides card on success
 */
async function submitSavedOrderFeedback() {
  // Validate that a rating was selected
  if (currentReviewRating === 0) {
    alert("Please select a star rating before submitting.");
    return;
  }

  // Validate that we have an order ID
  if (!currentReviewOrderId) {
    alert("No order found to review. Please try again.");
    return;
  }

  // Get the comment text
  const commentBox = document.getElementById('reviewCommentBox');
  const comment = commentBox ? commentBox.value.trim() : "";

  // Show loading state
  showLoader(true);

  try {
    // Submit the review via API
    const success = await CantineAPI.submitOrderReview(
      currentReviewOrderId,
      currentReviewRating,
      comment
    );

    showLoader(false);

    if (success) {
      // Provide user feedback
      alert("Thank you! Your feedback has been submitted successfully.");

      // Reset state
      currentReviewRating = 0;
      currentReviewOrderId = null;

      // Hide the review card
      const reviewCard = document.getElementById('recentOrdersSection');
      if (reviewCard) {
        reviewCard.classList.add('hidden');
      }

      // Clear the comment box
      if (commentBox) {
        commentBox.value = "";
      }

      // Reset star rating display
      setUIDisplayRating(0);
    } else {
      alert("Failed to submit your feedback. Please check your connection and try again.");
    }
  } catch (error) {
    showLoader(false);
    console.error("Error submitting order review:", error);
    alert("An unexpected error occurred. Please try again.");
  }
}

// Render available items onto the grid UI
function renderMenuCatalog(items) {
  const container = document.getElementById('menuGridContainer');
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<p class="muted">No menu items available at this time.</p>`;
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="menu-item-card ${item.available === false ? 'unavailable' : ''}">
      <div>
        <h3>${item.name}</h3>
        <p class="muted">${item.category}${item.desc ? ' · ' + item.desc : ''}</p>
        <span class="price-badge">${parseFloat(item.price).toFixed(2)} DT</span>
      </div>
      <button class="btn btn-outline btn-small" ${item.available === false ? 'disabled' : ''} onclick="addItemToCart('${item.id}', '${item.name.replace(/'/g, "\\'")}', ${item.price})">
        + Add to Order
      </button>
    </div>
  `).join('');
}

// Cart UI Operations
function addItemToCart(id, name, price) {
  const existingIndex = cart.findIndex(cartItem => cartItem.id === id);
  if (existingIndex > -1) {
    cart[existingIndex].qty += 1;
  } else {
    cart.push({ id, name, price, qty: 1 });
  }
  updateCartUI();
}

function updateCartQty(id, delta) {
  const itemIndex = cart.findIndex(cartItem => cartItem.id === id);
  if (itemIndex === -1) return;

  cart[itemIndex].qty += delta;
  if (cart[itemIndex].qty <= 0) {
    cart.splice(itemIndex, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  const tbody = document.getElementById('cartTableBody');
  const totalEl = document.getElementById('cartTotalSummary');
  if (!tbody || !totalEl) return;

  if (cart.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="muted text-center">Your cart is empty</td></tr>`;
    totalEl.innerText = "0.00 DT";
    return;
  }

  let totalSum = 0;
  tbody.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.qty;
    totalSum += itemTotal;
    return `
      <tr>
        <td><strong>${item.name}</strong><br><small class="muted">${item.price.toFixed(2)} DT</small></td>
        <td>
          <div class="qty-controls">
            <button onclick="updateCartQty('${item.id}', -1)">-</button>
            <span>${item.qty}</span>
            <button onclick="updateCartQty('${item.id}', 1)">+</button>
          </div>
        </td>
        <td class="text-right">${itemTotal.toFixed(2)} DT</td>
      </tr>
    `;
  }).join('');

  totalEl.innerText = `${totalSum.toFixed(2)} DT`;
}

// Submit Order to Google Sheets
async function submitEmployeeOrder() {
  if (cart.length === 0) {
    alert("Your shopping cart is empty!");
    return;
  }

  const plantSelect = document.getElementById('plantSelect');
  const daySelect = document.getElementById('daySelect');
  const pickupSelect = document.getElementById('pickupTimeSelect');

  const plant = plantSelect ? plantSelect.value : selectedPlant;
  const day = daySelect ? daySelect.value : selectedDay;
  const pickupTime = pickupSelect ? pickupSelect.value : "";

  if (!plant || !day || !pickupTime) {
    alert("Please select a plant location, day, and preferred pickup slot.");
    return;
  }

  const orderPayload = {
    employeeId: currentUser.id,
    employeeName: currentUser.name,
    leoniId: currentUser.badgeId || currentUser.leoniId || "",
    plant: plant,
    day: day,
    pickupAt: `${day}T${pickupTime}`,
    items: cart,
    subtotal: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
    delivery: false,
    deliveryFee: 0,
    deliveryOffice: currentUser.office || "",
    total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
    placedAt: new Date().toISOString()
  };

  showLoader(true);
  const order = await CantineAPI.createOrder(orderPayload);
  showLoader(false);

  if (order) {
    alert(`Order submitted successfully! Ticket: ${order.orderNumber}`);
    initEmployeeDashboard(); // Reset dashboard view
  } else {
    alert("Failed to post order. Please check connection parameters.");
  }
}
