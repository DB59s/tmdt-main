'use client'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

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
    const [orderId, setOrderId] = useState(null)

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

    const handleSubmitOrder = async (e) => {
        e.preventDefault()

        const customerId = localStorage.getItem('customerId')
        
        if (!validateForm()) {
            return
        }
        
        try {
            setLoading(true)
            
            if (!cart || !cart.items || cart.items.length === 0) {
                toast.error('Your cart is empty')
                return
            }
            
            // Prepare order data with fields exactly matching backend expectations
            const orderItems = cart.items.map(item => ({
                productId: item.productId._id || item.productId,
                quantity: item.quantity,
                price: item.price
            }))
            
            const totalAmount = calculateTotal()

            // Prepare full shipping address correctly formatted
            const fullAddress = [
                formData.address,
                formData.apartment && formData.apartment.trim() ? formData.apartment : '',
                formData.city,
                formData.state,
                formData.postcode
            ].filter(Boolean).join(', ');
            
            const orderData = {
                customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                customerPhone: formData.phone,
                customerEmail: formData.email,
                shippingAddress: fullAddress,
                customerId: customerId,
                status: 'Đang xác nhận', // Default status as specified
                totalAmount,
                paymentMethod: paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản qua ngân hàng',
                paymentStatus: 'Chưa thanh toán', // Default payment status as specified
                items: orderItems,
                discountCode: discountApplied ? discountCode : undefined,
                orderNotes: formData.orderNotes || ''
            }
            
            const response = await fetch(`${process.env.domainApi}/api/customer/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            })
            
            const data = await response.json()
            
            if (response.ok) {
                setOrderSuccess(true)
                setOrderId(data.order._id)
                
                // Save customer information to localStorage for future use
                localStorage.setItem('customerName', orderData.customerName)
                localStorage.setItem('customerEmail', orderData.customerEmail)
                
                // Clear customer cart
                const customerId = localStorage.getItem('customerId')
                if (customerId) {
                    await fetch(`${process.env.domainApi}/api/customer/cart/${customerId}`, {
                        method: 'DELETE'
                    })
                }
                
                toast.success('Your order has been placed successfully!')
                
                // Redirect to order confirmation page after a delay
                setTimeout(() => {
                    router.push(`/order-tracking?id=${data.order._id}`)
                }, 2000)
            } else {
                toast.error(data.message || 'Failed to place order')
            }
        } catch (error) {
            console.error('Error placing order:', error)
            toast.error('Failed to place order. Please try again.')
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
            return total + (item.price * item.quantity);
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
        return numericAmount.toFixed(2);
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
                                <div className="col-md-6">
                                    <div className="coupon-accordion">
                                        <h3>Returning customer? <span id="showlogin" onClick={handleLoginToggle}>Click here to login</span></h3>
                                        <div id="checkout-login" className="coupon-content" style={{ display: `${isLoginToggle ? "block" : "none"}` }}>
                                            <div className="coupon-info">
                                                <p className="coupon-text">Login to your account to access your saved addresses and speed up checkout.</p>
                                                <form action="#">
                                                    <p className="form-row-first">
                                                        <label>Email <span className="required">*</span></label>
                                                        <input type="text" />
                                                    </p>
                                                    <p className="form-row-last">
                                                        <label>Password <span className="required">*</span></label>
                                                        <input type="password" />
                                                    </p>
                                                    <p className="form-row">
                                                        <button className="tp-btn tp-color-btn" type="button">Login</button>
                                                        <label>
                                                            <input type="checkbox" />
                                                            Remember me
                                                        </label>
                                                    </p>
                                                    <p className="lost-password">
                                                        <Link href="/auth/login">Lost your password?</Link>
                                                    </p>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
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
                                                            Discount of ${formatCurrency(discountAmount)} applied successfully!
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
                                                                            <span className="amount">${(item.price * item.quantity).toFixed(2)}</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                            <tfoot>
                                                                <tr className="cart-subtotal">
                                                                    <th>Cart Subtotal</th>
                                                                    <td><span className="amount">${formatCurrency(calculateSubtotal())}</span></td>
                                                                </tr>
                                                                {discountApplied && (
                                                                    <tr className="cart-discount">
                                                                        <th>Discount</th>
                                                                        <td><span className="amount">-${formatCurrency(discountAmount)}</span></td>
                                                                    </tr>
                                                                )}
                                                                <tr className="order-total">
                                                                    <th>Order Total</th>
                                                                    <td><strong><span className="amount">${formatCurrency(calculateTotal())}</span></strong></td>
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
                                                                    id="payment-bank" 
                                                                    name="payment-method" 
                                                                    checked={paymentMethod === 'bank'}
                                                                    onChange={() => setPaymentMethod('bank')}
                                                                />
                                                                <label htmlFor="payment-bank">
                                                                    <span className="payment-option-title">Bank Transfer</span>
                                                                    <span className="payment-option-desc">Make your payment directly to our bank account.</span>
                                                                </label>
                                                            </div>
                                                            
                                                            {paymentMethod === 'bank' && (
                                                                <div className="bank-info mt-15 p-4 bg-light rounded">
                                                                    <h5>Bank Account Details</h5>
                                                                    <p>Please use your Order ID as the payment reference.</p>
                                                                    <p className="mb-10">Your order won't be shipped until the funds have cleared in our account.</p>
                                                                    <div className="qr-code text-center my-15">
                                                                        <img src="/qr_image.jpg" alt="QR Code for payment" style={{ maxWidth: '200px' }} />
                                                                        <p className="mt-10"><strong>Scan to pay</strong></p>
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
        </>
    )
}