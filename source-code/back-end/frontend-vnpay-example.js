// Ví dụ tích hợp VNPay vào frontend
// Bạn cần điều chỉnh code này để phù hợp với framework frontend của bạn (React, Vue, Angular, v.v.)

// Hàm tạo URL thanh toán VNPay
async function createVnpayPayment(orderId) {
    try {
        const response = await fetch('/api/customer/payment/vnpay/create-payment', {
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
        console.error('Lỗi khi tạo thanh toán VNPay:', error);
        throw error;
    }
}

// Hàm kiểm tra trạng thái thanh toán
async function checkPaymentStatus(orderId) {
    try {
        const response = await fetch(`/api/customer/payment/status/${orderId}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message);
        }
        
        return data.data;
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
        throw error;
    }
}

// Ví dụ sử dụng trong trang checkout
document.addEventListener('DOMContentLoaded', () => {
    // Giả sử có các radio button cho phương thức thanh toán
    const paymentMethods = document.querySelectorAll('input[name="payment-method"]');
    const checkoutForm = document.getElementById('checkout-form');
    const vnpaySection = document.getElementById('vnpay-section');
    
    // Ẩn phần VNPay ban đầu
    vnpaySection.style.display = 'none';
    
    // Hiển thị/ẩn phần VNPay dựa vào phương thức thanh toán được chọn
    paymentMethods.forEach(method => {
        method.addEventListener('change', (e) => {
            if (e.target.value === 'vnpay') {
                vnpaySection.style.display = 'block';
            } else {
                vnpaySection.style.display = 'none';
            }
        });
    });
    
    // Xử lý khi form được submit
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Lấy phương thức thanh toán được chọn
        const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
        
        // Lấy mã đơn hàng từ form (đây là mã được tạo trước đó trong quy trình checkout)
        const orderId = document.getElementById('order-id').value;
        
        if (selectedMethod === 'vnpay') {
            try {
                // Hiển thị loading
                document.getElementById('loading-indicator').style.display = 'block';
                
                // Tạo URL thanh toán VNPay
                const vnpayData = await createVnpayPayment(orderId);
                
                // Ẩn loading
                document.getElementById('loading-indicator').style.display = 'none';
                
                // Chuyển hướng đến trang thanh toán VNPay
                window.location.href = vnpayData.paymentUrl;
                
            } catch (error) {
                // Hiển thị thông báo lỗi
                document.getElementById('error-message').textContent = error.message;
                document.getElementById('error-message').style.display = 'block';
            }
        } else {
            // Xử lý các phương thức thanh toán khác
            checkoutForm.submit();
        }
    });
    
    // Kiểm tra xem có phải là trang kết quả thanh toán hay không
    if (window.location.pathname === '/payment/result') {
        // Phân tích URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const orderId = urlParams.get('orderId');
        const message = urlParams.get('message');
        
        const resultContainer = document.getElementById('payment-result-container');
        
        if (status === 'success') {
            // Hiển thị thông báo thành công
            resultContainer.innerHTML = `
                <div class="success-message">
                    <div class="icon">✓</div>
                    <div class="message">Thanh toán thành công!</div>
                    <div class="sub-message">Cảm ơn bạn đã mua hàng.</div>
                    <a href="/order-tracking/${orderId}" class="track-order-btn">Theo dõi đơn hàng</a>
                </div>
            `;
        } else {
            // Hiển thị thông báo lỗi
            resultContainer.innerHTML = `
                <div class="error-message">
                    <div class="icon">✗</div>
                    <div class="message">Thanh toán thất bại</div>
                    <div class="sub-message">${message || 'Đã xảy ra lỗi trong quá trình thanh toán'}</div>
                    <a href="/checkout" class="retry-btn">Thử lại</a>
                </div>
            `;
        }
    }
}); 