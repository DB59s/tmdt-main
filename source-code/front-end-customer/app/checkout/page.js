'use client'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import MomoPaymentModal from '@/components/modals/MomoPaymentModal'
import UsdtPaymentModal from '@/components/modals/UsdtPaymentModal'
import SolanaPaymentModal from '@/components/modals/SolanaPaymentModal'

export default function Checkout() {
    const router = useRouter()
    const [isLoginToggle, setLoginToggle] = useState(false)
    const handleLoginToggle = () => setLoginToggle(!isLoginToggle)

    const [isCuponToggle, setCuponToggle] = useState(false)
    const handleCuponToggle = () => setCuponToggle(!isCuponToggle)

    const [isCboxToggle, setCboxToggle] = useState(false)
    const handleCboxToggle = () => setCboxToggle(!isCboxToggle)

    const [isShipToggle, setShipToggle] = useState(false)
    const handleShipToggle = () => setShipToggle(!isShipToggle)

    const [paymentMethod, setPaymentMethod] = useState('cod')
    const [loading, setLoading] = useState(false)
    const [cart, setCart] = useState(null)
    const [discountCode, setDiscountCode] = useState('')
    const [discountApplied, setDiscountApplied] = useState(false)
    const [discountAmount, setDiscountAmount] = useState(0)
    const [discountError, setDiscountError] = useState('')
    
    // Thêm state cho Momo payment
    const [showMomoModal, setShowMomoModal] = useState(false)
    const [momoPaymentData, setMomoPaymentData] = useState(null)
    const [orderId, setOrderId] = useState(null)
    const [checkingPayment, setCheckingPayment] = useState(false)
    const [paymentPollingInterval, setPaymentPollingInterval] = useState(null)
    
    // Thêm state cho USDT payment
    const [showUsdtModal, setShowUsdtModal] = useState(false)
    const [usdtPaymentData, setUsdtPaymentData] = useState(null)
    
    // Thêm state cho Solana payment
    const [showSolanaModal, setShowSolanaModal] = useState(false)
    const [solanaPaymentData, setSolanaPaymentData] = useState(null)
    
    // Billing form state - adjusted to match backend requirements
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        state: '',
        postcode: '',
        email: '',
        phone: '',
        orderNotes: ''
    })

    // Order states
    const [orderSuccess, setOrderSuccess] = useState(false)

    useEffect(() => {
        fetchCart()
        
        // Pre-fill form with user data if available
        const customerName = localStorage.getItem('customerName')
        const customerEmail = localStorage.getItem('customerEmail')
        
        if (customerName) {
            const nameParts = customerName.split(' ')
            setFormData(prev => ({
                ...prev,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || ''
            }))
        }
        
        if (customerEmail) {
            setFormData(prev => ({
                ...prev,
                email: customerEmail
            }))
        }
    }, [])

    const fetchCart = async () => {
        try {
            setLoading(true)
            const customerId = localStorage.getItem('customerId')
            
            if (!customerId) {
                toast.error('No customer ID found. Please add items to your cart first.')
                router.push('/shop')
                return
            }
            
            const response = await fetch(`${process.env.domainApi}/api/customer/cart/${customerId}`)
            const data = await response.json()
            
            if (data.success && data.data?.items?.length > 0) {
                setCart(data.data)
            } else {
                toast.error('Your cart is empty. Please add items before checkout.')
                router.push('/shop')
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            toast.error('Failed to load cart. Please try again.')
            router.push('/cart')
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: value
        })
    }

    const applyCoupon = async (e) => {
        e.preventDefault()
        
        if (!discountCode.trim()) {
            toast.error('Please enter a discount code')
            return
        }
        
        try {
            setLoading(true)
            setDiscountError('')
            
            // Call backend API to verify discount code
            const response = await fetch(`${process.env.domainApi}/api/customer/discount/check-discount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: discountCode })
            })
            
            const data = await response.json()

            if(data.success) {
                // Apply discount and ensure discountAmount is a number

                console.log("data", data)
                setDiscountApplied(true)
                setDiscountAmount(data.discount.amount || 0) // Use 0 as fallback if amount is missing
                toast.success('Discount code applied successfully!')
            } else {
                setDiscountError(data.message || 'Invalid discount code')
                toast.error(data.message || 'Invalid discount code')
                // Reset discount data on error
                setDiscountApplied(false)
                setDiscountAmount(0)
            }
        } catch (error) {
            console.error('Error applying discount:', error)
            toast.error('Failed to apply discount code. Please try again.')
            setDiscountApplied(false)
            setDiscountAmount(0)
            setDiscountError('An error occurred while applying the discount code')
        } finally {
            setLoading(false)
        }
    }

    const validateForm = () => {
        const requiredFields = ['firstName', 'lastName', 'address', 'city', 'email', 'phone']
        const missingFields = requiredFields.filter(field => !formData[field])
        
        if (missingFields.length > 0) {
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`)
            return false
        }
        
        if (!formData.email.includes('@')) {
            toast.error('Please enter a valid email address')
            return false
        }
        
        return true
    }

    // Thêm hàm tạo mã QR Momo
    const generateMomoQR = async (orderId) => {
        try {
            setCheckingPayment(true)
            
            const response = await fetch(`${process.env.domainApi}/api/customer/payment/momo/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            })
            
            const data = await response.json()
            
            if (!response.ok || !data.success) {
                toast.error(data.message || 'Không thể tạo mã QR Momo')
                setCheckingPayment(false)
                return false
            }
            
            // Lưu thông tin thanh toán Momo
            setMomoPaymentData(data.data)
            
            // Hiển thị modal thanh toán Momo
            setShowMomoModal(true)
            
            // Bắt đầu kiểm tra trạng thái thanh toán
            startPaymentStatusPolling(orderId)
            
            setCheckingPayment(false)
            return true
        } catch (error) {
            console.error('Error generating Momo QR:', error)
            toast.error('Đã xảy ra lỗi khi tạo mã QR Momo')
            setCheckingPayment(false)
            return false
        }
    }
    
    // Thêm hàm tạo thông tin thanh toán USDT
    const generateUsdtPayment = async (orderId) => {
        try {
            setCheckingPayment(true)
            
            const response = await fetch(`${process.env.domainApi}/api/customer/payment/usdt/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            })
            
            const data = await response.json()
            
            if (!response.ok || !data.success) {
                toast.error(data.message || 'Không thể tạo thông tin thanh toán USDT')
                setCheckingPayment(false)
                return false
            }
            
            // Lưu thông tin thanh toán USDT
            setUsdtPaymentData(data.data)
            
            // Hiển thị modal thanh toán USDT
            setShowUsdtModal(true)
            
            // Bắt đầu kiểm tra trạng thái thanh toán
            startPaymentStatusPolling(orderId)
            
            setCheckingPayment(false)
            return true
        } catch (error) {
            console.error('Error generating USDT payment info:', error)
            toast.error('Đã xảy ra lỗi khi tạo thông tin thanh toán USDT')
            setCheckingPayment(false)
            return false
        }
    }
    
    // Thêm hàm tạo thông tin thanh toán Solana
    const generateSolanaPayment = async (orderId) => {
        try {
            setCheckingPayment(true)
            
            const response = await fetch(`${process.env.domainApi}/api/customer/payment/solana/create-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderId })
            })
            
            const data = await response.json()
            
            if (!response.ok || !data.success) {
                toast.error(data.message || 'Không thể tạo thông tin thanh toán Solana')
                setCheckingPayment(false)
                return false
            }
            
            // Lưu thông tin thanh toán Solana
            setSolanaPaymentData(data.data)
            
            // Hiển thị modal thanh toán Solana
            setShowSolanaModal(true)
            
            // Bắt đầu kiểm tra trạng thái thanh toán
            startPaymentStatusPolling(orderId)
            
            setCheckingPayment(false)
            return true
        } catch (error) {
            console.error('Error generating Solana payment info:', error)
            toast.error('Đã xảy ra lỗi khi tạo thông tin thanh toán Solana')
            setCheckingPayment(false)
            return false
        }
    }
    
    // Cập nhật hàm kiểm tra trạng thái thanh toán
    const checkPaymentStatus = async (orderId) => {
        try {
            setCheckingPayment(true)
            
            // Gọi API kiểm tra trạng thái thanh toán
            const response = await fetch(`${process.env.domainApi}/api/customer/payment/check-status/${orderId}`)
            const data = await response.json()
            
            if (response.ok && data.success) {
                // Nếu đã thanh toán, đóng modal và chuyển hướng
                if (data.data.paymentStatus === 'Đã thanh toán') {
                    stopPaymentStatusPolling()
                    setShowMomoModal(false)
                    toast.success('Thanh toán đơn hàng thành công!')
                    
                    // Xóa giỏ hàng
                    await clearCart()
                    
                    // Chuyển hướng đến trang theo dõi đơn hàng
                    router.push(`/order-tracking?id=${orderId}`)
                }
            }
        } catch (error) {
            console.error('Error checking payment status:', error)
        } finally {
            setCheckingPayment(false)
        }
    }

    // Hàm xóa giỏ hàng
    const clearCart = async () => {
        try {
            const customerId = localStorage.getItem('customerId')
            if (customerId) {
                await fetch(`${process.env.domainApi}/api/customer/cart/${customerId}`, {
                    method: 'DELETE'
                })
            }
        } catch (error) {
            console.error('Error clearing cart:', error)
        }
    }
    
    // Thêm hàm bắt đầu kiểm tra trạng thái thanh toán
    const startPaymentStatusPolling = (orderId) => {
        // Kiểm tra ngay lập tức
        checkPaymentStatus(orderId)
        
        // Sau đó kiểm tra mỗi 5 giây
        const interval = setInterval(() => {
            checkPaymentStatus(orderId)
        }, 5000)
        
        setPaymentPollingInterval(interval)
    }
    
    // Thêm hàm dừng kiểm tra trạng thái thanh toán
    const stopPaymentStatusPolling = () => {
        if (paymentPollingInterval) {
            clearInterval(paymentPollingInterval)
            setPaymentPollingInterval(null)
        }
    }
    
    // Xóa interval khi component unmount
    useEffect(() => {
        return () => {
            stopPaymentStatusPolling()
        }
    }, [paymentPollingInterval])

    // Điều chỉnh lại hàm handleSubmitOrder để tách biệt xử lý thanh toán Momo
    const handleSubmitOrder = async (e) => {
        e.preventDefault()

        const customerId = localStorage.getItem('customerId')
        
        if (!validateForm()) {
            return
        }
        
        try {
            setLoading(true)
            
            if (!cart || !cart.items || cart.items.length === 0) {
                toast.error('Giỏ hàng của bạn đang trống')
                return
            }
            
            // Chuẩn bị dữ liệu đơn hàng
            const orderItems = cart.items.map(item => ({
                productId: item.productId._id || item.productId,
                quantity: item.quantity,
                price: item.price,
                priceBeforeSale: item.priceBeforeSale,
                onSale: item.onSale
            }))
            
            const totalAmount = calculateTotal()

            // Tạo địa chỉ giao hàng đầy đủ
            const fullAddress = [
                formData.address,
                formData.apartment && formData.apartment.trim() ? formData.apartment : '',
                formData.city,
                formData.state,
                formData.postcode
            ].filter(Boolean).join(', ');
            
            // Ánh xạ phương thức thanh toán theo backend
            let mappedPaymentMethod = 'Thanh toán khi nhận hàng'
            
            if (paymentMethod === 'momo') {
                mappedPaymentMethod = 'Thanh toán qua Momo'
            } else if (paymentMethod === 'usdt') {
                mappedPaymentMethod = 'Thanh toán qua USDT'
            } else if (paymentMethod === 'solana') {
                mappedPaymentMethod = 'Thanh toán qua Solana'
            }
            
            const orderData = {
                customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                customerPhone: formData.phone,
                customerEmail: formData.email,
                shippingAddress: fullAddress,
                customerId: customerId,
                status: 'Đang xác nhận',
                totalAmount,
                paymentMethod: mappedPaymentMethod,
                paymentStatus: 'Chưa thanh toán',
                items: orderItems,
                discountCode: discountApplied ? discountCode : undefined,
                orderNotes: formData.orderNotes || ''
            }
            
            // Gọi API tạo đơn hàng
            const response = await fetch(`${process.env.domainApi}/api/customer/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            })
            
            const data = await response.json()
            
            if (!response.ok) {
                toast.error(data.message || 'Không thể tạo đơn hàng. Vui lòng thử lại.')
                return
            }
            
            // Lưu ID đơn hàng và thông tin khách hàng
            const newOrderId = data.order._id
            const orderCode = data.order.orderId
            setOrderId(newOrderId)
            
            localStorage.setItem('customerName', orderData.customerName)
            localStorage.setItem('customerEmail', orderData.customerEmail)
            
            // Xử lý theo phương thức thanh toán
            if (paymentMethod === 'momo') {
                // Tạo QR Momo và hiển thị modal thanh toán
                const momoSuccess = await generateMomoQR(orderCode)
                
                if (!momoSuccess) {
                    // Nếu không thể tạo QR, vẫn chuyển hướng đến trang đơn hàng
                    toast.warning('Không thể tạo mã QR Momo, nhưng đơn hàng của bạn đã được ghi nhận.')
                    router.push(`/order-tracking?id=${newOrderId}`)
                }
            } else if (paymentMethod === 'usdt') {
                // Tạo thông tin thanh toán USDT và hiển thị modal
                const usdtSuccess = await generateUsdtPayment(orderCode)
                
                if (!usdtSuccess) {
                    // Nếu không thể tạo thông tin thanh toán, vẫn chuyển hướng đến trang đơn hàng
                    toast.warning('Không thể tạo thông tin thanh toán USDT, nhưng đơn hàng của bạn đã được ghi nhận.')
                    router.push(`/order-tracking?id=${newOrderId}`)
                }
            } else if (paymentMethod === 'solana') {
                // Tạo thông tin thanh toán Solana và hiển thị modal
                const solanaSuccess = await generateSolanaPayment(orderCode)
                
                if (!solanaSuccess) {
                    // Nếu không thể tạo thông tin thanh toán, vẫn chuyển hướng đến trang đơn hàng
                    toast.warning('Không thể tạo thông tin thanh toán Solana, nhưng đơn hàng của bạn đã được ghi nhận.')
                    router.push(`/order-tracking?id=${newOrderId}`)
                }
            } else {
                // Với các phương thức thanh toán khác
                setOrderSuccess(true)
                
                // Xóa giỏ hàng
                await clearCart()
                
                toast.success('Đơn hàng của bạn đã được đặt thành công!')
                
                // Chuyển hướng sau 2 giây
                setTimeout(() => {
                    router.push(`/order-tracking?id=${newOrderId}`)
                }, 2000)
            }
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    // Utility function to calculate the total
    const calculateSubtotal = () => {
        if (!cart || !cart.items || cart.items.length === 0) {
            return 0;
        }
        
        return cart.items.reduce((total, item) => {
            const priceToUse = item.onSale ? item.price : (item.priceBeforeSale || item.price)
            return total + (priceToUse * item.quantity);
        }, 0);
    }
    
    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        // Ensure discountAmount is a number and apply it only when discount is applied
        const discount = discountApplied ? (discountAmount || 0) : 0;
        
        return Math.max(0, subtotal - discount); // Ensure total is never negative
    }

    // Thêm hàm trợ giúp để kiểm tra và định dạng giá trị tiền
    const formatCurrency = (amount) => {
        // Đảm bảo amount là một số
        const numericAmount = Number(amount) || 0;
        // Định dạng tiền Việt Nam đồng
        return numericAmount.toLocaleString('vi-VN') + ' ₫';
    };

    if (orderSuccess) {
        return (
            <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Order Confirmation">
                <section className="order-complete-area pt-100 pb-100">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                <div className="order-complete-wrapper text-center">
                                    <div className="order-complete-icon mb-30">
                                        <i className="fas fa-check-circle fa-5x text-success"></i>
                                    </div>
                                    <div className="order-complete-content">
                                        <h3 className="mb-20">Your order has been placed successfully!</h3>
                                        <p>Order ID: {orderId}</p>
                                        <p className="mb-30">You will receive a confirmation email shortly.</p>
                                        <div className="order-complete-btn">
                                            <Link href={`/order-tracking?id=${orderId}`} className="tp-btn tp-color-btn mr-20">
                                                Track Your Order
                                            </Link>
                                            <Link href="/shop" className="tp-btn">
                                                Continue Shopping
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        )
    }

    return (
        <>
            <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Checkout">
                <div>
                    <section className="coupon-area pt-80 pb-30 wow fadeInUp" data-wow-duration=".8s" data-wow-delay=".2s">
                        <div className="container">
                            <div className="row">
                                <div className="">
                                    <div className="coupon-accordion">
                                        <h3>Have a discount code? <span id="showcoupon" onClick={handleCuponToggle}>Click here to enter your code</span></h3>
                                        <div id="checkout_coupon" className="coupon-checkout-content" style={{ display: `${isCuponToggle ? "block" : "none"}` }}>
                                            <div className="coupon-info">
                                                <form onSubmit={applyCoupon}>
                                                    <p className="checkout-coupon">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Discount Code" 
                                                            value={discountCode}
                                                            onChange={(e) => {
                                                                setDiscountCode(e.target.value)
                                                                setDiscountError('')
                                                            }}
                                                        />
                                                        <button 
                                                            className="tp-btn tp-color-btn" 
                                                            type="submit"
                                                            disabled={loading}
                                                        >
                                                            {loading ? 'Applying...' : 'Apply Discount'}
                                                        </button>
                                                    </p>
                                                    {discountError && (
                                                        <p className="text-danger mt-2 mb-0">{discountError}</p>
                                                    )}
                                                    {discountApplied && (
                                                        <p className="text-success mt-2 mb-0">
                                                            Giảm giá {formatCurrency(discountAmount)} đã được áp dụng!
                                                        </p>
                                                    )}
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    
                    <section className="checkout-area pb-50 wow fadeInUp" data-wow-duration=".8s" data-wow-delay=".2s">
                        <div className="container">
                            <form onSubmit={handleSubmitOrder}>
                                <div className="row">
                                    <div className="col-lg-6 col-md-12">
                                        <div className="checkbox-form">
                                            <h3>Billing Details</h3>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="checkout-form-list">
                                                        <label>First Name <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            name="firstName"
                                                            value={formData.firstName}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="checkout-form-list">
                                                        <label>Last Name <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            name="lastName"
                                                            value={formData.lastName}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="checkout-form-list">
                                                        <label>Address <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Street address" 
                                                            name="address"
                                                            value={formData.address}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="checkout-form-list">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Apartment, suite, unit etc. (optional)" 
                                                            name="apartment"
                                                            value={formData.apartment}
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-12">
                                                    <div className="checkout-form-list">
                                                        <label>Town / City <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Town / City" 
                                                            name="city"
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="checkout-form-list">
                                                        <label>State / Province <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            name="state"
                                                            value={formData.state}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="checkout-form-list">
                                                        <label>Postcode / Zip <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Postcode / Zip" 
                                                            name="postcode"
                                                            value={formData.postcode}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="checkout-form-list">
                                                        <label>Email Address <span className="required">*</span></label>
                                                        <input 
                                                            type="email" 
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="checkout-form-list">
                                                        <label>Phone <span className="required">*</span></label>
                                                        <input 
                                                            type="text" 
                                                            placeholder="Phone number" 
                                                            name="phone"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="order-notes">
                                                <div className="checkout-form-list">
                                                    <label>Order Notes</label>
                                                    <textarea 
                                                        id="checkout-mess" 
                                                        cols={30} 
                                                        rows={10} 
                                                        placeholder="Notes about your order, e.g. special notes for delivery." 
                                                        name="orderNotes"
                                                        value={formData.orderNotes}
                                                        onChange={handleInputChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-lg-6 col-md-12">
                                        <div className="your-order mb-30 ">
                                            <h3>Your order</h3>
                                            {loading ? (
                                                <div className="text-center py-4">
                                                    <div className="spinner-border" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="your-order-table table-responsive">
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th className="product-name">Product</th>
                                                                    <th className="product-total">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {cart?.items?.map((item, index) => (
                                                                    <tr className="cart_item" key={index}>
                                                                        <td className="product-name">
                                                                            {item.name} <strong className="product-quantity"> × {item.quantity}</strong>
                                                                        </td>
                                                                        <td className="product-total">
                                                                            <span className="amount">
                                                                                {formatCurrency((item.onSale ? item.price : (item.priceBeforeSale || item.price)) * item.quantity)}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className="cart-subtotal">
                                                                    <th>Tổng giỏ hàng</th>
                                                                    <td><span className="amount">{formatCurrency(calculateSubtotal())}</span></td>
                                                                </tr>
                                                                {discountApplied && (
                                                                    <tr className="cart-discount">
                                                                        <th>Giảm giá</th>
                                                                        <td><span className="amount">-{formatCurrency(discountAmount)}</span></td>
                                                                    </tr>
                                                                )}
                                                                <tr className="order-total">
                                                                    <th>Tổng đơn hàng</th>
                                                                    <td><strong><span className="amount">{formatCurrency(calculateTotal())}</span></strong></td>
                                                                </tr>
                                                            </tfoot>
                                                        </table>
                                                    </div>
                                                    <div className="payment-method">
                                                        <h4 className="mb-20">Payment Method</h4>
                                                        <div className="payment-options mb-30">
                                                            <div className="payment-option mb-15">
                                                                <input 
                                                                    type="radio" 
                                                                    id="payment-cod" 
                                                                    name="payment-method" 
                                                                    checked={paymentMethod === 'cod'}
                                                                    onChange={() => setPaymentMethod('cod')}
                                                                />
                                                                <label htmlFor="payment-cod">
                                                                    <span className="payment-option-title">Cash on Delivery</span>
                                                                    <span className="payment-option-desc">Pay with cash when your order is delivered.</span>
                                                                </label>
                                                            </div>
                                                            <div className="payment-option mb-15">
                                                                <input 
                                                                    type="radio" 
                                                                    id="payment-usdt" 
                                                                    name="payment-method" 
                                                                    checked={paymentMethod === 'usdt'}
                                                                    onChange={() => setPaymentMethod('usdt')}
                                                                />
                                                                <label htmlFor="payment-usdt">
                                                                    <span className="payment-option-title">
                                                                        <img 
                                                                            src="/assets/img/payment/usdt-logo.png" 
                                                                            alt="USDT" 
                                                                            style={{ 
                                                                                height: '20px', 
                                                                                marginRight: '8px',
                                                                                verticalAlign: 'middle' 
                                                                            }} 
                                                                        />
                                                                        Thanh toán qua USDT (TRC20)
                                                                    </span>
                                                                    <span className="payment-option-desc">Chuyển USDT qua mạng TRC20 để thanh toán.</span>
                                                                </label>
                                                            </div>
                                                            
                                                            <div className="payment-option mb-15">
                                                                <input 
                                                                    type="radio" 
                                                                    id="payment-solana" 
                                                                    name="payment-method" 
                                                                    checked={paymentMethod === 'solana'}
                                                                    onChange={() => setPaymentMethod('solana')}
                                                                />
                                                                <label htmlFor="payment-solana">
                                                                    <span className="payment-option-title">
                                                                        <img 
                                                                            src="/assets/img/payment/solana-logo.png" 
                                                                            alt="Solana" 
                                                                            style={{ 
                                                                                height: '20px', 
                                                                                marginRight: '8px',
                                                                                verticalAlign: 'middle' 
                                                                            }} 
                                                                        />
                                                                        Thanh toán qua Solana Pay
                                                                    </span>
                                                                    <span className="payment-option-desc">Thanh toán nhanh chóng và an toàn với Solana Pay.</span>
                                                                </label>
                                                            </div>
                                                            
                                                            <div className="payment-option mb-15">
                                                                <input 
                                                                    type="radio" 
                                                                    id="payment-momo" 
                                                                    name="payment-method" 
                                                                    checked={paymentMethod === 'momo'}
                                                                    onChange={() => setPaymentMethod('momo')}
                                                                />
                                                                <label htmlFor="payment-momo">
                                                                    <span className="payment-option-title">
                                                                        <img 
                                                                            src="/assets/img/payment/momo-logo.png" 
                                                                            alt="Momo" 
                                                                            style={{ 
                                                                                height: '20px', 
                                                                                marginRight: '8px',
                                                                                verticalAlign: 'middle' 
                                                                            }} 
                                                                        />
                                                                        Thanh toán qua Momo
                                                                    </span>
                                                                    <span className="payment-option-desc">Quét mã QR hoặc mở app Momo để thanh toán.</span>
                                                                </label>
                                                            </div>
                                                            
                                                            {paymentMethod === 'usdt' && (
                                                                <div className="usdt-info mt-15 p-4 bg-light rounded">
                                                                    <h5>Thanh toán qua USDT (TRC20)</h5>
                                                                    <p>Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán USDT với thông tin chi tiết.</p>
                                                                    <p>Sử dụng ví tiền điện tử hỗ trợ USDT trên mạng TRC20 để thanh toán.</p>
                                                                    <div className="text-center my-15">
                                                                        <img 
                                                                            src="/assets/img/payment/usdt-logo.png" 
                                                                            alt="USDT Payment" 
                                                                            style={{ maxWidth: '100px' }} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {paymentMethod === 'solana' && (
                                                                <div className="solana-info mt-15 p-4 bg-light rounded">
                                                                    <h5>Thanh toán qua Solana Pay</h5>
                                                                    <p>Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán Solana với mã QR.</p>
                                                                    <p>Sử dụng ví Solana để quét mã QR hoặc mở URL thanh toán và hoàn tất giao dịch.</p>
                                                                    <div className="text-center my-15">
                                                                        <img 
                                                                            src="/assets/img/payment/solana-logo.png" 
                                                                            alt="Solana Payment" 
                                                                            style={{ maxWidth: '100px' }} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                            
                                                            {paymentMethod === 'momo' && (
                                                                <div className="momo-info mt-15 p-4 bg-light rounded">
                                                                    <h5>Thanh toán qua Momo</h5>
                                                                    <p>Sau khi đặt hàng, bạn sẽ được chuyển đến trang thanh toán Momo với mã QR.</p>
                                                                    <p>Sử dụng ứng dụng Momo để quét mã QR và hoàn tất thanh toán.</p>
                                                                    <div className="text-center my-15">
                                                                        <img 
                                                                            src="/assets/img/payment/momo-logo.png" 
                                                                            alt="Momo Payment" 
                                                                            style={{ maxWidth: '100px' }} 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        
                                                        <div className="order-button-payment mt-20">
                                                            <button 
                                                                type="submit" 
                                                                className="tp-btn tp-color-btn w-100 banner-animation"
                                                                disabled={loading || !cart || cart.items?.length === 0}
                                                            >
                                                                {loading ? 'Processing...' : 'Place order'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </section>
                </div>
            </Layout>
            
            {/* Momo Payment Modal */}
            {showMomoModal && momoPaymentData && (
                <MomoPaymentModal
                    show={showMomoModal}
                    handleClose={() => {
                        setShowMomoModal(false)
                        stopPaymentStatusPolling()
                        router.push(`/order-tracking?id=${orderId}`)
                    }}
                    paymentData={momoPaymentData}
                    checkingPayment={checkingPayment}
                />
            )}
            
            {/* USDT Payment Modal */}
            {showUsdtModal && usdtPaymentData && (
                <UsdtPaymentModal
                    show={showUsdtModal}
                    handleClose={() => {
                        setShowUsdtModal(false)
                        stopPaymentStatusPolling()
                        router.push(`/order-tracking?id=${orderId}`)
                    }}
                    paymentData={usdtPaymentData}
                    checkingPayment={checkingPayment}
                />
            )}
            
            {/* Solana Payment Modal */}
            {showSolanaModal && solanaPaymentData && (
                <SolanaPaymentModal
                    show={showSolanaModal}
                    handleClose={() => {
                        setShowSolanaModal(false)
                        stopPaymentStatusPolling()
                        router.push(`/order-tracking?id=${orderId}`)
                    }}
                    paymentData={solanaPaymentData}
                    checkingPayment={checkingPayment}
                />
            )}
        </>
    )
}