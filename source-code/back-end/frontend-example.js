// This is a simple frontend example for integrating Momo payment
// You would adapt this to your actual frontend framework (React, Vue, Angular, etc.)

// Function to generate Momo QR code for payment
async function generateMomoQR(orderId) {
    try {
        const response = await fetch('/api/customer/payment/momo/generate-qr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId }),
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        return data.data;
    } catch (error) {
        console.error('Error generating Momo QR:', error);
        throw error;
    }
}

// Function to check payment status
async function checkPaymentStatus(orderId) {
    try {
        const response = await fetch(`/api/customer/payment/status/${orderId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        return data.data;
    } catch (error) {
        console.error('Error checking payment status:', error);
        throw error;
    }
}

// Example usage in checkout page:
document.addEventListener('DOMContentLoaded', () => {
    // Assume we have payment method radio buttons
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const checkoutForm = document.getElementById('checkout-form');
    const momoPaymentSection = document.getElementById('momo-payment-section');
    
    // Hide momo section initially
    momoPaymentSection.style.display = 'none';
    
    // Show/hide Momo section based on selected payment method
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            if (e.target.value === 'momo') {
                momoPaymentSection.style.display = 'block';
            } else {
                momoPaymentSection.style.display = 'none';
            }
        });
    });
    
    // Handle form submission
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get selected payment method
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // Get order ID from the form (this would be created earlier in your checkout process)
        const orderId = document.getElementById('order-id').value;
        
        if (selectedMethod === 'momo') {
            try {
                // Show loading
                document.getElementById('loading-indicator').style.display = 'block';
                
                // Generate QR code
                const momoData = await generateMomoQR(orderId);
                
                // Hide loading
                document.getElementById('loading-indicator').style.display = 'none';
                
                // Show QR code
                const qrCodeContainer = document.getElementById('qr-code-container');
                qrCodeContainer.innerHTML = `
                    <div class="qr-header">Quét mã QR để thanh toán</div>
                    <div class="amount">Số tiền: ${momoData.amount.toLocaleString('vi-VN')} VND</div>
                    <img src="${momoData.qrCodeUrl}" alt="Momo QR Code" />
                    <div class="instructions">Sử dụng ứng dụng Momo để quét mã QR</div>
                `;
                
                // Set up polling to check payment status
                const paymentCheckInterval = setInterval(async () => {
                    try {
                        const statusData = await checkPaymentStatus(orderId);
                        
                        if (statusData.paymentStatus === 'Đã thanh toán') {
                            clearInterval(paymentCheckInterval);
                            
                            // Show success message
                            qrCodeContainer.innerHTML = `
                                <div class="success-message">
                                    <div class="icon">✓</div>
                                    <div class="message">Thanh toán thành công!</div>
                                    <div class="sub-message">Cảm ơn bạn đã mua hàng.</div>
                                    <a href="/order-tracking/${orderId}" class="track-order-btn">Theo dõi đơn hàng</a>
                                </div>
                            `;
                        }
                    } catch (error) {
                        console.error('Error checking payment status:', error);
                    }
                }, 5000); // Check every 5 seconds
                
            } catch (error) {
                // Show error message
                document.getElementById('error-message').textContent = error.message;
                document.getElementById('error-message').style.display = 'block';
            }
        } else {
            // Handle other payment methods
            checkoutForm.submit();
        }
    });
}); 