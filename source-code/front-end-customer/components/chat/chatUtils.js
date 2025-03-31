/**
 * Kiểm tra xem đã có thông tin khách hàng chưa
 * 
 * @returns {string|null} customerId hoặc null nếu chưa có
 */
export const getChatToken = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Lấy customerId từ localStorage
    const customerId = localStorage.getItem('customerId');
    
    // Trả về customerId nếu có
    if (customerId) {
      return customerId;
    }
    
    // Nếu có thông tin khách hàng nhưng chưa có ID, vẫn coi là có thể chat
    const name = localStorage.getItem('customerName');
    const email = localStorage.getItem('customerEmail');
    const phone = localStorage.getItem('customerPhone');
    
    if (name && email && phone) {
      return 'pending'; // Trạng thái chờ tạo ID
    }
    
    return null;
  } catch (error) {
    console.error('Error getting chat credentials:', error);
    return null;
  }
};

/**
 * Store customer information for chat
 * 
 * @param {Object} customerInfo - Customer information object
 * @param {string} customerInfo.name - Customer name
 * @param {string} customerInfo.email - Customer email
 * @param {string} customerInfo.phoneNumber - Customer phone number (or phone)
 * @param {string} customerInfo.customerId - Customer ID (or customerId)
 * @returns {boolean} Whether the customer information was successfully stored
 */
export const storeCustomerInfo = (customerInfo) => {
  if (!customerInfo) return false;
  
  // Validate customer info
  if (!customerInfo.name || !customerInfo.email || !customerInfo.phoneNumber) {
    console.error('Missing required customer information');
    return false;
  }
  
  try {
    // Store in localStorage
    localStorage.setItem('customerName', customerInfo.name);
    localStorage.setItem('customerEmail', customerInfo.email);
    localStorage.setItem('customerPhone', customerInfo.phoneNumber);
    
    // If we have an ID, store it too
    if (customerInfo.customerId) {
      localStorage.setItem('customerId', customerInfo.customerId);
    }
    
    return true;
  } catch (error) {
    console.error('Error storing customer info:', error);
    return false;
  }
};

/**
 * Check if user can access chat
 * 
 * @returns {boolean} Whether the user can access chat
 */
export const canAccessChat = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Luôn cho phép truy cập chat
    return true;
  } catch (error) {
    console.error('Error checking chat access:', error);
    return false;
  }
};

/**
 * Get socket.io connection URL
 * 
 * @returns {string} The socket.io connection URL
 */
export const getChatSocketUrl = () => {
  // Use environment variable if available, otherwise use default URL
  // The socket.io connection will be to the /customer namespace
  return process.env.NEXT_PUBLIC_API_URL || process.env.domainApi || 'http://localhost:5000';
}; 