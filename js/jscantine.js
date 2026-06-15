// js/cantine.js

const NEXT_STATUS = {
  'pending': 'confirmed',
  'confirmed': 'ready',
  'ready': 'completed'
};

// Initialize Admin View UI Table Layout
async function initCantineDashboard() {
  showLoader(true);
  // Pull live row orders submitted from Google Sheets
  const orders = await CantineAPI.getAllOrders();
  showLoader(false);
  
  renderCantineOrdersTable(orders);
}

// Render Order Rows into Admin Dashboard
function renderCantineOrdersTable(orders) {
  const tbody = document.getElementById('cantineOrdersTableBody');
  if (!tbody) return;

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center muted">No active orders found in sheet database.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    // Generate items string representation
    const itemsDescription = order.items.map(i => `${i.qty}× ${i.name}`).join(', ');
    const formattedDate = new Date(order.pickupAt).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    
    return `
      <tr>
        <td><span class="order-num-pill">#${order.orderNumber || order.id.slice(-4)}</span></td>
        <td><strong>${order.employeeName}</strong><br><small class="muted">Plant: ${order.plant}</small></td>
        <td>${order.day}</td>
        <td>${formattedDate}</td>
        <td>${itemsDescription}</td>
        <td class="mono font-bold">${parseFloat(order.total).toFixed(2)} DT</td>
        <td><span class="status-pill status-${order.status}">${order.status}</span></td>
        <td>
          ${order.status !== 'completed' && order.status !== 'cancelled' ? 
            `<button class="btn btn-outline btn-small" onclick="advanceCantineOrder('${order.id}', '${order.status}')">
              Mark ${NEXT_STATUS[order.status]}
             </button>` : ''
          }
          ${order.status === 'pending' ? 
            `<button class="btn btn-danger btn-small" onclick="cancelCantineOrder('${order.id}')">Cancel</button>` : ''
          }
        </td>
      </tr>
    `;
  }).join('');
}

// Update Order Workflow Lifecycle
async function advanceCantineOrder(id, currentStatus) {
  const targetStatus = NEXT_STATUS[currentStatus];
  if (!targetStatus) return;

  showLoader(true);
  await CantineAPI.updateOrderStatus(id, targetStatus);
  showLoader(false);
  
  // Refresh layout with fresh data from Google Sheets row changes
  initCantineDashboard();
}

// Cancel Order Process Execution
async function cancelCantineOrder(id) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  showLoader(true);
  await CantineAPI.updateOrderStatus(id, 'cancelled');
  showLoader(false);
  
  initCantineDashboard();
}