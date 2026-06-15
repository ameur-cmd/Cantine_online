/**
 * js/api.js
 * Serverless Backend Communication Gateway Layer
 * Connects Leoni Cantine Frontend interface directly to Google Apps Script Web App.
 */

// Replace this with your deployed Google Apps Script URL exec deployment link
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwmzn6n-9mSlHgaGH_xXYRPlGrVNSzDqqvi1Xr1n3ohKgUE3AqdEZ_SNjQ5QpR9jP3H/exec";

const CantineAPI = {
  
  /**
   * Helper utility to perform safe network HTTP requests
   */
  async _request(params = {}, options = {}) {
    try {
      let url = GOOGLE_SCRIPT_URL;
      
      // If parameters exist and it's a GET request, attach them as query parameters
      if (options.method !== "POST" && Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url += `?${queryString}`;
      }

      const response = await fetch(url, {
        method: options.method || "GET",
        mode: "cors", // Use cors mode to securely handle response objects
        headers: {
          "Content-Type": "application/json",
          ...options.headers
        },
        body: options.method === "POST" ? JSON.stringify(params) : null
      });

      if (!response.ok) {
        throw new Error(`Network response error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("CantineAPI Network Layer Failure:", error);
      return null;
    }
  },

  /**
   * 1. AUTHENTICATION SERVICES
   */
  async loginUser(email, password, role) {
    const response = await this._request({
      action: "loginUser",
      email: email.trim().toLowerCase(),
      password: password,
      role: role
    }, { method: "POST" });
    
    // Returns user object if valid, or null if unauthorized
    return response && response.success ? response.user : null;
  },

  async registerUser(userData) {
    const response = await this._request({
      action: "registerUser",
      role: userData.role,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      leoniId: userData.leoniId || "",
      position: userData.position || "",
      plant: userData.plant,
      office: userData.office || ""
    }, { method: "POST" });

    return response && response.success;
  },

  /**
   * 2. MENU CONTENT MANAGEMENT SERVICES
   */
  async getMenuCatalog(plantId, dayName) {
    const response = await this._request({
      action: "getMenu",
      plant: plantId,
      day: dayName
    });

    // Returns array of items or empty fallback list if spreadsheet is unpopulated
    return response && response.items ? response.items : [];
  },

  async saveMenuItem(plantId, itemPayload) {
    const response = await this._request({
      action: "saveMenuItem",
      plant: plantId,
      id: itemPayload.id || "", // Empty if generating a new item creation
      day: itemPayload.day,
      name: itemPayload.name,
      desc: itemPayload.desc,
      price: parseFloat(itemPayload.price),
      category: itemPayload.category,
      offer: !!itemPayload.offer,
      available: !!itemPayload.available
    }, { method: "POST" });

    return response && response.success;
  },

  async toggleItemAvailability(plantId, dayName, itemId, currentAvailableState) {
    const response = await this._request({
      action: "toggleAvailability",
      plant: plantId,
      day: dayName,
      id: itemId,
      available: !currentAvailableState
    }, { method: "POST" });

    return response && response.success;
  },

  async deleteMenuItem(plantId, dayName, itemId) {
    const response = await this._request({
      action: "deleteItem",
      plant: plantId,
      day: dayName,
      id: itemId
    }, { method: "POST" });

    return response && response.success;
  },

  /**
   * 3. INCOMING & HISTORICAL ORDER LIFECYCLE SERVICES
   */
  async getAllOrders(plantId) {
    const response = await this._request({
      action: "getOrders",
      plant: plantId
    });

    return response && response.orders ? response.orders : [];
  },

  async createOrder(orderPayload) {
    const response = await this._request({
      action: "createOrder",
      employeeId: orderPayload.employeeId,
      employeeName: orderPayload.employeeName,
      leoniId: orderPayload.leoniId,
      plant: orderPayload.plant,
      day: orderPayload.day,
      pickupAt: orderPayload.pickupAt,
      items: orderPayload.items, // Array payload containing mapped quantities
      subtotal: parseFloat(orderPayload.subtotal),
      delivery: !!orderPayload.delivery,
      deliveryFee: parseFloat(orderPayload.deliveryFee),
      deliveryOffice: orderPayload.deliveryOffice,
      total: parseFloat(orderPayload.total),
      status: "pending",
      placedAt: orderPayload.placedAt,
      paid: !!orderPayload.paid
    }, { method: "POST" });

    // Returns structural server context detailing completed object fields (e.g. assigned ticket #)
    return response && response.success ? response.order : null;
  },

  async updateOrderStatus(orderId, targetStatus) {
    const response = await this._request({
      action: "updateStatus",
      id: orderId,
      status: targetStatus
    }, { method: "POST" });

    return response && response.success;
  }
};
