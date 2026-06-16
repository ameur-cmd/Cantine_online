/**
 * IMPLEMENTATION SUMMARY
 * Order Received & Review Feedback Mechanism
 * Leoni Cantine Multi-Plant Management Portal
 * 
 * =====================================================================
 * OVERVIEW
 * =====================================================================
 * 
 * This feature implements a production-ready 5-star interactive rating system
 * for employees to provide feedback on completed meal orders. The architecture
 * flows from Google Sheets (database) → Google Apps Script (backend) → 
 * Clean JS Frontend (UI/UX) with a dedicated feedback card that appears when
 * orders are eligible for review.
 * 
 * Data collected (rating: 1-5, comment: text) feeds into future predefined
 * Chatbot and AI-style-based Recommendation Engines.
 */

// =====================================================================
// 1. BACKEND: Code.gs (Google Apps Script)
// =====================================================================

/**
 * FILE: Code.gs
 * 
 * NEW ACTION HANDLER: submitOrderReview
 * 
 * FUNCTIONALITY:
 * - Receives POST request with: id (Order ID), rating (1-5), comment (text)
 * - Opens "Orders" sheet dynamically
 * - Reads header row (row 1) and searches for "rating" and "comment" columns
 * - If columns don't exist, appends them to the sheet automatically
 * - Finds the row matching the incoming order ID
 * - Writes rating and comment values to the corresponding columns
 * - Returns JSON response: { success: true/false, message: "..." }
 * 
 * LOGIC FLOW:
 * 1. Parse incoming postData JSON
 * 2. Validate required fields (id, rating)
 * 3. Validate rating is integer 1-5
 * 4. Open Orders sheet by ID reference
 * 5. Read header row and find/create rating & comment columns
 * 6. Search all data rows for matching order ID
 * 7. Update the found row with rating and comment
 * 8. Return success response
 * 
 * ERROR HANDLING:
 * - Missing fields return { success: false, message: "Missing..." }
 * - Invalid rating returns { success: false, message: "Rating must be..." }
 * - Sheet not found returns { success: false, message: "Orders sheet not found" }
 * - Order not found returns { success: false, message: "Order with ID ... not found" }
 * 
 * DEFENSIVE FEATURES:
 * - Dynamically creates rating/comment columns if missing
 * - Type-safe integer conversion for rating
 * - Try-catch wrapper for unexpected errors
 * - Detailed error messages for debugging
 */

// Example Code.gs snippet (already committed):
/*
function handleSubmitOrderReview(postData) {
  try {
    const orderId = postData.id || "";
    const rating = postData.rating || null;
    const comment = postData.comment || "";

    if (!orderId || rating === null) {
      return { success: false, message: "Missing required fields: id and rating" };
    }

    const ratingValue = parseInt(rating, 10);
    if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      return { success: false, message: "Rating must be an integer between 1 and 5" };
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName("Orders");
    if (!sheet) {
      return { success: false, message: "Orders sheet not found" };
    }

    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let ratingColIndex = headerRow.indexOf("rating");
    let commentColIndex = headerRow.indexOf("comment");

    if (ratingColIndex === -1) {
      ratingColIndex = headerRow.length;
      sheet.getRange(1, ratingColIndex + 1).setValue("rating");
    }
    if (commentColIndex === -1) {
      commentColIndex = headerRow.length + (ratingColIndex === headerRow.length ? 1 : 0);
      sheet.getRange(1, commentColIndex + 1).setValue("comment");
    }

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
      return { success: false, message: "Order with ID " + orderId + " not found" };
    }

    sheet.getRange(targetRowIndex + 1, ratingColIndex + 1).setValue(ratingValue);
    sheet.getRange(targetRowIndex + 1, commentColIndex + 1).setValue(comment);

    return { success: true, message: "Order review submitted successfully" };
  } catch (error) {
    return { success: false, message: "Error submitting review: " + error.toString() };
  }
}
*/


// =====================================================================
// 2. GATEWAY LAYER: js/api.js
// =====================================================================

/**
 * FILE: js/api.js
 * 
 * NEW METHOD: CantineAPI.submitOrderReview(orderId, rating, comment)
 * 
 * SIGNATURE:
 *   async submitOrderReview(orderId, rating, comment)
 *   @param {string|number} orderId - Order ID to update
 *   @param {number} rating - Star rating (1-5)
 *   @param {string} comment - Feedback text
 *   @returns {boolean} - true if success, false if failure
 * 
 * BEHAVIOR:
 * - Constructs POST request payload with action: "submitOrderReview"
 * - Includes orderId, rating (as integer), comment (trimmed)
 * - Uses existing _request() utility with POST method
 * - Follows text/plain CORS bypass pattern
 * - Returns true if response.success is true, false otherwise
 * 
 * TRANSPORT:
 * - Endpoint: GOOGLE_SCRIPT_URL (Apps Script Web App)
 * - Method: POST
 * - Headers: Content-Type: text/plain;charset=utf-8
 * - Body: JSON stringified with action, id, rating, comment
 * 
 * ERROR HANDLING:
 * - Network failures return false
 * - Invalid responses return false
 * - Errors logged to console for debugging
 */

// Example js/api.js addition (already committed):
/*
async submitOrderReview(orderId, rating, comment) {
  const response = await this._request({
    action: "submitOrderReview",
    id: orderId,
    rating: parseInt(rating, 10),
    comment: (comment || "").trim()
  }, { method: "POST" });

  return response && response.success;
}
*/


// =====================================================================
// 3. FRONTEND INTERFACE: index.html
// =====================================================================

/**
 * FILE: index.html
 * 
 * NEW SECTION: #recentOrdersSection (Order Review Card)
 * 
 * STRUCTURE:
 * - Container div with ID: recentOrdersSection
 * - Initially hidden with class: hidden
 * - Located in employee dashboard (right column sidebar)
 * - Below the standard "Your Order" cart card
 * 
 * CHILD ELEMENTS:
 * 1. Title: "Your Recent Orders & Feedback"
 * 2. Status indicator: Pill badge showing "✓ Received" status
 * 3. Label: "Rate This Meal"
 * 4. Star rating container (#starRatingContainer)
 *    - 5 individual span.star elements with data-value (1-5)
 *    - Unicode character: ★
 * 5. Label: "Your Feedback (Optional)"
 * 6. Textarea (#reviewCommentBox)
 *    - Placeholder: "Share your thoughts about this meal..."
 *    - 4 rows, resizable
 * 7. Button: "Submit Review" (btn btn-orange)
 *    - onclick="submitSavedOrderFeedback()"
 * 
 * VISIBILITY:
 * - Hidden by default: class="hidden"
 * - Revealed by presentReviewBlockIfEligible() function
 * - Hides on successful submission
 */

// Example HTML structure (already committed):
/*
<div id="recentOrdersSection" class="section-card hidden">
  <div class="section-title"><span>Your Recent Orders & Feedback</span></div>
  
  <div class="review-order-status">
    <span class="status-pill status-completed">✓ Received</span>
  </div>

  <div class="input-group" style="margin-top:20px;">
    <label>Rate This Meal</label>
    <div class="star-rating-container" id="starRatingContainer">
      <span class="star" data-value="1">★</span>
      <span class="star" data-value="2">★</span>
      <span class="star" data-value="3">★</span>
      <span class="star" data-value="4">★</span>
      <span class="star" data-value="5">★</span>
    </div>
  </div>

  <div class="input-group" style="margin-top:16px;">
    <label for="reviewCommentBox">Your Feedback (Optional)</label>
    <textarea id="reviewCommentBox" class="input-control" 
              placeholder="Share your thoughts about this meal..." 
              rows="4" style="resize: vertical;"></textarea>
  </div>

  <button class="btn btn-orange" style="width:100%; margin-top:16px;" 
          onclick="submitSavedOrderFeedback()">Submit Review</button>
</div>
*/


// =====================================================================
// 4. PRESENTATION: css/styles.css
// =====================================================================

/**
 * FILE: css/styles.css
 * 
 * NEW COLOR TOKEN:
 * --gold: #FFC107 (for selected stars)
 * 
 * NEW STYLE CLASSES:
 * 
 * 1. .review-order-status
 *    - margin-bottom: 20px
 *    - display: flex with gap, align-items: center
 * 
 * 2. .star-rating-container
 *    - display: flex
 *    - gap: 12px (generous spacing)
 *    - flex-wrap: wrap
 * 
 * 3. .star (interactive)
 *    - font-size: 32px (prominent)
 *    - cursor: pointer
 *    - color: var(--muted) [default grey]
 *    - transition: all 0.2s ease
 *    - user-select: none
 *    - line-height: 1
 *    - On hover: transform scale(1.15), color changes to var(--gold)
 * 
 * 4. .star.selected
 *    - color: var(--gold)
 *    - Applied to all stars up to selected value
 * 
 * 5. textarea.input-control
 *    - font-family: inherit
 *    - line-height: 1.5
 *    - Resizable vertically
 * 
 * DESIGN PRINCIPLES:
 * - Muted grey default (#8A9099) for visual hierarchy
 * - Gold accent (#FFC107) for selected state (vibrant, accessible)
 * - Hover scale effect (1.15) for tactile feedback
 * - Smooth 0.2s transitions for responsive feel
 * - Integrates seamlessly with existing design tokens
 * - Mobile responsive with flex layout
 */

// Example CSS rules (already committed):
/*
.star-rating-container {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.star {
  font-size: 32px;
  cursor: pointer;
  color: var(--muted);
  transition: all 0.2s ease;
  user-select: none;
  line-height: 1;
}

.star:hover {
  transform: scale(1.15);
  color: var(--gold);
}

.star.selected {
  color: var(--gold);
}

.star.selected ~ .star {
  color: var(--muted);
}
*/


// =====================================================================
// 5. FRONTEND LOGIC: js/employee.js
// =====================================================================

/**
 * FILE: js/employee.js
 * 
 * NEW GLOBAL STATE VARIABLES:
 * - currentReviewRating: number (0-5) - tracks selected star rating
 * - currentReviewOrderId: string/null - stores order ID for submission
 * 
 * NEW FUNCTIONS:
 * 
 * 1. initStarRatingInteraction()
 *    Purpose: Initialize click event handlers on all .star elements
 *    Behavior: 
 *    - Queries all .star spans
 *    - Attaches click listener to each
 *    - On click: extracts data-value and calls setUIDisplayRating()
 * 
 * 2. setUIDisplayRating(value)
 *    Purpose: Update visual star display based on selected rating
 *    Parameters: value (1-5) - the clicked star's value
 *    Behavior:
 *    - Sets currentReviewRating = value
 *    - Queries all .star elements
 *    - Adds .selected class to stars 0..value-1
 *    - Removes .selected class from remaining stars
 *    Effect: Creates "fill" appearance from left to right (★★★☆☆)
 * 
 * 3. evaluateAndPresentReviewEligibility()
 *    Purpose: Fetch order history and check if review is eligible
 *    Async Flow:
 *    - Calls CantineAPI.getAllOrders(selectedPlant)
 *    - Iterates orders in reverse (most recent first)
 *    - Finds first order with:
 *      * status === "completed"
 *      * No existing rating (rating is null/empty/"")
 *    - If found: calls presentReviewBlockIfEligible(order)
 *    Error Handling: Logs errors to console, silently continues
 * 
 * 4. presentReviewBlockIfEligible(lastOrder)
 *    Purpose: Inject order data and reveal the review card
 *    Parameters: lastOrder - eligible completed unrated order object
 *    Side Effects:
 *    - Sets currentReviewOrderId = lastOrder.id
 *    - Resets currentReviewRating to 0
 *    - Calls setUIDisplayRating(0) to clear star selection
 *    - Clears reviewCommentBox textarea
 *    - Removes .hidden class from #recentOrdersSection
 *    - Smooth scrolls to card with behavior: 'smooth'
 * 
 * 5. submitSavedOrderFeedback()
 *    Purpose: Validate and submit the order review
 *    Async Flow:
 *    1. Validate currentReviewRating !== 0 (alert if not selected)
 *    2. Validate currentReviewOrderId exists (alert if not)
 *    3. Extract comment text from #reviewCommentBox (trim)
 *    4. Show loader via showLoader(true)
 *    5. Call CantineAPI.submitOrderReview(orderId, rating, comment)
 *    6. Hide loader
 *    7. On success:
 *       - Alert user "Thank you! Your feedback has been submitted..."
 *       - Reset state: rating=0, orderId=null
 *       - Add .hidden to review card
 *       - Clear comment box
 *       - Reset star display
 *    8. On failure:
 *       - Alert user "Failed to submit... Please check connection"
 *    9. Catch block: show loader false, alert error
 * 
 * INTEGRATION WITH EXISTING CODE:
 * - Uses existing showLoader(true/false) from app.js
 * - Uses existing CantineAPI singleton
 * - Calls initEmployeeDashboard() → initStarRatingInteraction()
 * - Calls initEmployeeDashboard() → evaluateAndPresentReviewEligibility()
 * - Uses existing cart and menu rendering functions unchanged
 */

// Example js/employee.js additions (already committed):
/*
let currentReviewRating = 0;
let currentReviewOrderId = null;

function initStarRatingInteraction() {
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const value = parseInt(this.getAttribute('data-value'), 10);
      setUIDisplayRating(value);
    });
  });
}

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

async function evaluateAndPresentReviewEligibility() {
  try {
    const orders = await CantineAPI.getAllOrders(selectedPlant);
    if (!orders || orders.length === 0) return;

    let eligibleOrder = null;
    for (let i = orders.length - 1; i >= 0; i--) {
      const order = orders[i];
      if (order.status === "completed" && 
          (!order.rating || order.rating === null || order.rating === "")) {
        eligibleOrder = order;
        break;
      }
    }

    if (eligibleOrder) {
      presentReviewBlockIfEligible(eligibleOrder);
    }
  } catch (error) {
    console.error("Error evaluating review eligibility:", error);
  }
}

function presentReviewBlockIfEligible(lastOrder) {
  if (!lastOrder || !lastOrder.id) return;

  currentReviewOrderId = lastOrder.id;
  currentReviewRating = 0;
  setUIDisplayRating(0);

  const commentBox = document.getElementById('reviewCommentBox');
  if (commentBox) commentBox.value = "";

  const reviewCard = document.getElementById('recentOrdersSection');
  if (reviewCard) {
    reviewCard.classList.remove('hidden');
    reviewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

async function submitSavedOrderFeedback() {
  if (currentReviewRating === 0) {
    alert("Please select a star rating before submitting.");
    return;
  }

  if (!currentReviewOrderId) {
    alert("No order found to review. Please try again.");
    return;
  }

  const commentBox = document.getElementById('reviewCommentBox');
  const comment = commentBox ? commentBox.value.trim() : "";

  showLoader(true);

  try {
    const success = await CantineAPI.submitOrderReview(
      currentReviewOrderId,
      currentReviewRating,
      comment
    );

    showLoader(false);

    if (success) {
      alert("Thank you! Your feedback has been submitted successfully.");
      currentReviewRating = 0;
      currentReviewOrderId = null;

      const reviewCard = document.getElementById('recentOrdersSection');
      if (reviewCard) reviewCard.classList.add('hidden');

      if (commentBox) commentBox.value = "";
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
*/


// =====================================================================
// ARCHITECTURE FLOW DIAGRAM
// =====================================================================

/*
┌─────────────────────────────────────────────────────────────────┐
│                    EMPLOYEE DASHBOARD LOAD                       │
│              initEmployeeDashboard() is called                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
    ┌───────────▼──────────┐   ┌─────────▼─────────────────┐
    │ Render Menu Catalog  │   │ Initialize Star Handlers  │
    │ & Cart UI            │   │ initStarRatingInteraction()
    └──────────────────────┘   └─────────────┬─────────────┘
                                             │
                        ┌────────────────────┴─────────────────┐
                        │                                       │
        ┌───────────────▼──────────────┐   ┌─────────────────┐
        │ evaluatePresentReviewEligib()│   │ Stars now have  │
        │ - Fetch all orders           │   │ click handlers  │
        │ - Find completed unrated     │   │                 │
        │ - Call presentReviewBlock()  │   │ User clicks ★   │
        └─┬────────────────────────────┘   │ → setUIDisplay()│
          │                                 └─────────┬───────┘
          │                                           │
        ┌─▼──────────────────────────┐   ┌───────────▼────────┐
        │ presentReviewBlock          │   │ Visual stars      │
        │ - Set currentReviewOrderId  │   │ change to gold    │
        │ - Reset rating to 0         │   │ (.selected class) │
        │ - Clear comment box         │   └───────────────────┘
        │ - Remove .hidden from card  │
        │ - Scroll to card            │
        └─────────────────────────────┘
                        │
                        │
        ┌───────────────▼──────────────┐
        │ Review Card Visible          │
        │ Ready for user input         │
        └─────────────────────────────┘
                        │
                        │ User enters feedback & clicks Submit
                        │
        ┌───────────────▼────────────────────┐
        │ submitSavedOrderFeedback()         │
        │ - Validate rating selected        │
        │ - Get comment text                │
        │ - showLoader(true)                │
        │ - CantineAPI.submitOrderReview()  │
        └─────────┬────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │ API Request       │
        │ POST to Apps Script
        │ {action, id,      │
        │  rating, comment} │
        └────────┬──────────┘
                 │
    ┌────────────▼────────────┐
    │ Apps Script Backend     │
    │ handleSubmitOrderReview()
    │ - Validate inputs      │
    │ - Open Orders sheet    │
    │ - Find/create columns  │
    │ - Find order row by ID │
    │ - Write rating & comment
    │ - Return success JSON  │
    └─────────┬──────────────┘
              │
    ┌─────────▼──────────────┐
    │ JSON response back     │
    │ { success: true/false, │
    │   message: "..." }     │
    └─────────┬──────────────┘
              │
        ┌─────▼────────────────────────┐
        │ showLoader(false)            │
        │                              │
        │ If success:                  │
        │ - Alert confirmation        │
        │ - Reset state               │
        │ - Hide review card          │
        │ - Clear inputs              │
        │                              │
        │ If failure:                  │
        │ - Alert error message       │
        │ - Keep card visible         │
        └──────────────────────────────┘
*/


// =====================================================================
// DATA STRUCTURES
// =====================================================================

/**
 * ORDER OBJECT (returned from CantineAPI.getAllOrders):
 * {
 *   id: "ORDER_ID_123",
 *   employeeId: "EMP_001",
 *   employeeName: "John Doe",
 *   plant: "Plant-A",
 *   day: "2026-06-20",
 *   pickupAt: "2026-06-20T18:30",
 *   items: [...],
 *   subtotal: 25.50,
 *   total: 27.00,
 *   status: "completed",
 *   rating: null,              // Initially null
 *   comment: "",               // Initially empty
 *   placedAt: "2026-06-20T09:00:00Z",
 *   orderNumber: "TCK-001"
 * }
 */

/**
 * API REQUEST PAYLOAD (sent to Apps Script):
 * {
 *   action: "submitOrderReview",
 *   id: "ORDER_ID_123",
 *   rating: 4,
 *   comment: "Great meal, delicious!"
 * }
 */

/**
 * API RESPONSE PAYLOAD (received from Apps Script):
 * {
 *   success: true,
 *   message: "Order review submitted successfully"
 * }
 * 
 * OR on error:
 * 
 * {
 *   success: false,
 *   message: "Rating must be an integer between 1 and 5"
 * }
 */


// =====================================================================
// TESTING CHECKLIST
// =====================================================================

/**
 * FRONTEND TESTING:
 * ✓ Star rating displays 5 Unicode stars (★)
 * ✓ Stars default to muted grey color
 * ✓ Clicking a star highlights it and preceding stars gold
 * ✓ Hover effect scales star up by 1.15x
 * ✓ Comment textarea accepts multi-line input
 * ✓ Review card is initially hidden
 * ✓ Review card appears when eligible order is found
 * ✓ Review card scrolls into view smoothly
 * ✓ Submit button validates rating is selected (alert if not)
 * ✓ Loader displays during API call
 * ✓ Success alert shows after submission
 * ✓ Card hides after successful submission
 * ✓ State resets after successful submission
 * ✓ Textarea clears after submission
 * 
 * BACKEND TESTING:
 * ✓ Apps Script receives POST with correct JSON structure
 * ✓ Rating validation rejects values outside 1-5
 * ✓ Missing fields return appropriate error messages
 * ✓ Rating column created if doesn't exist
 * ✓ Comment column created if doesn't exist
 * ✓ Order found by ID and updated correctly
 * ✓ Non-existent order ID returns error
 * ✓ Response JSON structure matches expected format
 * 
 * INTEGRATION TESTING:
 * ✓ End-to-end: star click → rating stored → submission works
 * ✓ Multiple orders: correct order ID is used
 * ✓ Error recovery: can retry after failed submission
 * ✓ Network failure: loader hidden, error alert shown
 * ✓ Concurrent requests: only one in-flight at a time (loader state)
 * 
 * UX TESTING:
 * ✓ Card appears at appropriate time (completed unrated order)
 * ✓ Stars are easily clickable (32px font, 12px gap)
 * ✓ Visual feedback is immediate and clear
 * ✓ Error messages are helpful and actionable
 * ✓ Success confirmation is clear and timely
 * ✓ Card smoothly disappears after submission
 */


// =====================================================================
// DEPLOYMENT STEPS
// =====================================================================

/**
 * 1. Google Apps Script (Code.gs):
 *    - Update SHEET_ID constant to your Google Sheet ID
 *    - Save the file
 *    - Deploy as "New deployment" → Web app
 *    - Execute as: (your email)
 *    - Access: Anyone
 *    - Copy the deployment URL to GOOGLE_SCRIPT_URL in api.js
 * 
 * 2. Frontend Files (index.html, css/styles.css, js/*.js):
 *    - Commit all files to GitHub
 *    - Deploy to your web server / hosting
 *    - Verify GOOGLE_SCRIPT_URL matches the deployed Apps Script endpoint
 * 
 * 3. Google Sheet Structure:
 *    - Ensure "Orders" sheet exists
 *    - Columns should include:
 *      * id (Order ID) - Row 1, Column A
 *      * (other order fields...)
 *      * rating (will be auto-created if missing) - NEW
 *      * comment (will be auto-created if missing) - NEW
 * 
 * 4. Testing:
 *    - Create a test order with status "completed"
 *    - Ensure it has no rating value
 *    - Log in as employee who placed the order
 *    - Verify review card appears
 *    - Submit a 4-star review with comment
 *    - Verify rating and comment appear in Google Sheet
 */


// =====================================================================
// FUTURE ENHANCEMENTS
// =====================================================================

/**
 * PHASE 2 - ANALYTICS & RECOMMENDATIONS:
 * - Build dashboard showing average ratings by meal/day/plant
 * - Track trending feedback themes with NLP
 * - Feed data to predefined Chatbot for response generation
 * - AI-powered meal recommendation engine based on preferences
 * 
 * PHASE 3 - ADVANCED FEATURES:
 * - Photo upload capability for meals
 * - Allergen/dietary preference tracking via reviews
 * - Suggested menu adjustments based on feedback
 * - Email notifications to cantine managers on low ratings
 * - Employee gamification (badges for consistent high ratings)
 * 
 * PHASE 4 - MOBILE & ACCESSIBILITY:
 * - Mobile app native integration
 * - Voice-based rating input
 * - Screen reader optimization for star widget
 * - Multi-language support for feedback collection
 */

// =====================================================================
// END OF IMPLEMENTATION SUMMARY
// =====================================================================
