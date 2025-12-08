
const API_URL = 'https://script.google.com/macros/s/AKfycbx9tS-hlGppgX2RuknqR339qzMxXsZ7R_ZQP5K1gi8VyGq0eUfg3-qZwawMeJO_wj_GtQ/exec';

/**
 * Create a new event in Google Calendar
 * @param {Object} eventData - { title, startTime, endTime, description, location }
 * @returns {Promise<Object>} - Response from GAS
 */
export const createCalendarEvent = async (eventData) => {
  try {
    // Google Apps Script Web App requires 'text/plain' to avoid CORS preflight issues in some cases,
    // or simply because it parses postData.contents.
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(eventData),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
};

/**
 * Get events from Google Calendar
 * @returns {Promise<Array>} - List of events
 */
export const getCalendarEvents = async () => {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};
