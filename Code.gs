/**
 * Code.gs
 * Google Apps Script Backend - Leoni Cantine Multi-Plant Management Portal
 * 
 * This file serves as the central Apps Script Web App entry point.
 * Deployed as a web app with "Execute as: me" permissions.
 */

// Replace with your Google Sheet ID
const SHEET_ID = "YOUR_SHEET_ID_HERE";

/**
 * Main HTTP Request Handler for all Frontend API calls
 * Routes incoming actions to appropriate handler functions
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action || "";

    let response = {};

    // Route to appropriate handler based on action
    if (action === "loginUser") {
      response = handleLoginUser(postData);
    } else if (action === "registerUser") {
      response = handleRegisterUser(postData);
    } else if (action === "getMenu") {
      response = handleGetMenu(postData);
    } else if (action === "saveMenuItem") {
      response = handleSaveMenuItem(postData);
    } else if (action === "toggleAvailability") {
      response = handleToggleAvailability(postData);
    } else if (action === "deleteItem") {
      response = handleDeleteItem(postData);
    } else if (action === "getOrders") {
      response = handleGetOrders(postData);
    } else if (action === "createOrder") {
      response = handleCreateOrder(postData);
    } else if (action === "updateStatus") {
      response = handleUpdateStatus(postData);
    } else if (action === "submitOrderReview") {
      response = handleSubmitOrderReview(postData);
    } else {
      response = { success: false, message: "Unknown action: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, message: "Server error: " + error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handler: submitOrderReview
 * 
 * Receives order feedback (rating and comment) and persists to the Orders sheet.
 * 
 * @param {Object} postData - Contains: id (Order ID), rating (1-5), comment (text)
 * @returns {Object} - { success: boolean, message: string }
 */
function handleSubmitOrderReview(postData) {
  try {
    const orderId = postData.id || "";
    const rating = postData.rating || null;
    const comment = postData.comment || "";

    // Validate inputs
    if (!orderId || rating === null) {
      return {
        success: false,
        message: "Missing required fields: id and rating"
      };
    }

    // Validate rating is 1-5
    const ratingValue = parseInt(rating, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return {
        success: false,
        message: "Rating must be an integer between 1 and 5"
      };
    }

    // Open the Orders sheet
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Orders");
    if (!sheet) {
      return {
        success: false,
        message: "Orders sheet not found"
      };
    }

    // Read the header row (row 1)
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Dynamically find or create 'rating' and 'comment' columns
    let ratingColIndex = headerRow.indexOf("rating");
    let commentColIndex = headerRow.indexOf("comment");

    // If columns don't exist, append them
    if (ratingColIndex === -1) {
      ratingColIndex = headerRow.length;
      sheet.getRange(1, ratingColIndex + 1).setValue("rating");
    }
    if (commentColIndex === -1) {
      commentColIndex = headerRow.length + (ratingColIndex === headerRow.length ? 1 : 0);
      sheet.getRange(1, commentColIndex + 1).setValue("comment");
    }

    // Find the row matching the order ID
    // Assume first column (or configurable) contains the order ID
    const dataRange = sheet.getDataRange();
    const allValues = dataRange.getValues();
    
    let targetRowIndex = -1;
    for (let i = 1; i < allValues.length; i++) {
      if (allValues[i][0].toString() === orderId.toString()) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      return {
        success: false,
        message: "Order with ID " + orderId + " not found"
      };
    }

    // Write rating and comment to the matching row
    sheet.getRange(targetRowIndex + 1, ratingColIndex + 1).setValue(ratingValue);
    sheet.getRange(targetRowIndex + 1, commentColIndex + 1).setValue(comment);

    return {
      success: true,
      message: "Order review submitted successfully"
    };

  } catch (error) {
    return {
      success: false,
      message: "Error submitting review: " + error.toString()
    };
  }
}

/**
 * Placeholder handlers for other actions
 * (Implement these based on your existing backend logic)
 */

function handleLoginUser(postData) {
  // TODO: Implement login logic
  return { success: false, message: "Not implemented" };
}

function handleRegisterUser(postData) {
  // TODO: Implement registration logic
  return { success: false, message: "Not implemented" };
}

function handleGetMenu(postData) {
  // TODO: Implement menu retrieval logic
  return { success: false, message: "Not implemented", items: [] };
}

function handleSaveMenuItem(postData) {
  // TODO: Implement menu item save logic
  return { success: false, message: "Not implemented" };
}

function handleToggleAvailability(postData) {
  // TODO: Implement availability toggle logic
  return { success: false, message: "Not implemented" };
}

function handleDeleteItem(postData) {
  // TODO: Implement item deletion logic
  return { success: false, message: "Not implemented" };
}

function handleGetOrders(postData) {
  // TODO: Implement order retrieval logic
  return { success: false, message: "Not implemented", orders: [] };
}

function handleCreateOrder(postData) {
  // TODO: Implement order creation logic
  return { success: false, message: "Not implemented" };
}

function handleUpdateStatus(postData) {
  // TODO: Implement order status update logic
  return { success: false, message: "Not implemented" };
}
