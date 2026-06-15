// js/employee.js

let cart = [];
let selectedPlant = "";
let selectedDay = "";

// Initialize Employee View UI elements
async function initEmployeeDashboard() {
  if (currentUser) {
    document.getElementById('employeeWelcomeName').innerText = currentUser.name;
  }
  
  // Reset active configurations
  cart = [];
  updateCartUI();
  
  showLoader(true);
  // Pull fresh food options directly from your Google Sheet
  const items = await CantineAPI.getMenuCatalog(); 
  showLoader(false);
  
  renderMenuCatalog(items);
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
    <div class="menu-card">
      <div class="menu-details">
        <h3>${item.name}</h3>
        <p class="muted">${item.category}</p>
        <span class="price-tag">${parseFloat(item.price).toFixed(2)} DT</span>
      </div>
      <button class="btn btn-outline btn-small" onclick="addItemToCart('${item.id}', '${item.name}', ${item.price})">
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

  selectedPlant = document.getElementById('plantSelect')?.value;
  selectedDay = document.getElementById('daySelect')?.value;
  const pickupTime = document.getElementById('pickupTimeSelect')?.value;

  if (!selectedPlant || !selectedDay || !pickupTime) {
    alert("Please select a plant location, day, and preferred pickup slot.");
    return;
  }

  const orderPayload = {
    employeeId: currentUser.badgeId,
    employeeName: currentUser.name,
    plant: selectedPlant,
    day: selectedDay,
    pickupAt: `${selectedDay}T${pickupTime}`,
    items: cart,
    total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  showLoader(true);
  const success = await CantineAPI.createOrder(orderPayload);
  showLoader(false);

  if (success) {
    alert("Order submitted successfully to the Cantine team!");
    initEmployeeDashboard(); // Reset dashboard view
  } else {
    alert("Failed to post order. Please check connection parameters.");
  }
}