'use client'
import { useState, useEffect } from 'react'
import Layout from "@/components/layout/Layout"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'

export default function Cart() {
    const [cart, setCart] = useState(null)
    const [loading, setLoading] = useState(true)
    const [couponCode, setCouponCode] = useState('')
    const router = useRouter()
    
    useEffect(() => {
        fetchCart()
    }, [])
    
    const fetchCart = async () => {
        try {
            setLoading(true)
            // Assume we have the customer ID from localStorage or cookies
            const customerId = localStorage.getItem('customerId') || '123456' // Fallback ID for testing
            
            const response = await fetch(`${process.env.domainApi}/api/customer/cart/${customerId}`)
            const data = await response.json()
            
            if (data.success) {
                setCart(data.data)
            } else {
                toast.error(data.message || 'Error fetching cart')
            }
        } catch (error) {
            console.error('Error fetching cart:', error)
            toast.error('Failed to load cart. Please try again.')
        } finally {
            setLoading(false)
        }
    }
    
    const updateItemQuantity = async (productId, quantity) => {
        try {
            const customerId = localStorage.getItem('customerId') || '123456'
            
            const response = await fetch(`${process.env.domainApi}/api/customer/cart/items/${productId}/${customerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setCart(data.data)
                toast.success(data.message)
            } else {
                toast.error(data.message || 'Error updating item')
            }
        } catch (error) {
            console.error('Error updating item quantity:', error)
            toast.error('Failed to update item. Please try again.')
        }
    }
    
    const removeItem = async (productId) => {
        try {
            const customerId = localStorage.getItem('customerId') || '123456'
            
            const response = await fetch(`${process.env.domainApi}/api/customer/cart/items/${productId}/${customerId}`, {
                method: 'DELETE'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setCart(data.data)
                toast.success('Item removed from cart')
            } else {
                toast.error(data.message || 'Error removing item')
            }
        } catch (error) {
            console.error('Error removing item:', error)
            toast.error('Failed to remove item. Please try again.')
        }
    }
    
    const clearCart = async () => {
        try {
            const customerId = localStorage.getItem('customerId') || '123456'
            
            const response = await fetch(`${process.env.domainApi}/api/customer/cart/${customerId}`, {
                method: 'DELETE'
            })
            
            const data = await response.json()
            
            if (data.success) {
                setCart(data.data)
                toast.success('Cart cleared successfully')
            } else {
                toast.error(data.message || 'Error clearing cart')
            }
        } catch (error) {
            console.error('Error clearing cart:', error)
            toast.error('Failed to clear cart. Please try again.')
        }
    }
    
    const addToCart = async (productId, quantity = 1) => {
        try {
            const customerId = localStorage.getItem('customerId') || '123456'
            
            const response = await fetch(`${process.env.domainApi}/api/customer/cart/items/${customerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    productId,
                    quantity 
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                setCart(data.data)
                toast.success('Item added to cart')
            } else {
                toast.error(data.message || 'Error adding item to cart')
            }
        } catch (error) {
            console.error('Error adding item to cart:', error)
            toast.error('Failed to add item to cart. Please try again.')
        }
    }
    
    const applyCoupon = (e) => {
        console.log("e prevent default", e.preventDefault())
        e.preventDefault()
        
        console.log("couponCode", couponCode)

        const checkCoupon = async () => {
            const response = await fetch(`${process.env.domainApi}/api/customer/discount/check-discount`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: couponCode })
            })
            const data = await response.json()
            console.log("data", data)
            if (data.success) {
                toast.success('Coupon applied successfully')
            } else {
                toast.error(data.message || 'Error applying coupon')
            }
        }
        checkCoupon()
        // API call for coupon validation would go here
    }
    
    const updateCart = (e) => {
        e.preventDefault()
        fetchCart()
        toast.success('Cart updated successfully')
    }
    
    // Calculate totals
    const subtotal = cart?.items?.reduce((acc, item) => {
        return acc + (item.price * item.quantity)
    }, 0) || 0
    
    // You can add tax, shipping, discounts calculation here
    const total = subtotal
    
    return (
        <>
            <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Shopping Cart">
                <section className="cart-area pt-80 pb-80 wow fadeInUp" data-wow-duration=".8s" data-wow-delay=".2s">
                    <div className="container">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading your cart...</p>
                            </div>
                        ) : cart?.items?.length === 0 || !cart?.items ? (
                            <div className="empty-cart text-center py-5">
                                <div className="empty-cart-icon mb-4">
                                    <i className="fas fa-shopping-cart fa-4x text-muted"></i>
                                </div>
                                <h3>Your cart is empty</h3>
                                <p className="text-muted mb-4">Looks like you haven't added any items to your cart yet.</p>
                                <Link href="/shop" className="tp-btn tp-color-btn banner-animation">
                                    Continue Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-12">
                                    <form action="#">
                                        <div className="table-content table-responsive">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th className="product-thumbnail">Image</th>
                                                        <th className="cart-product-name">Product</th>
                                                        <th className="product-price">Unit Price</th>
                                                        <th className="product-quantity">Quantity</th>
                                                        <th className="product-subtotal">Total</th>
                                                        <th className="product-remove">Remove</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cart?.items?.map((item) => (
                                                        <tr key={item.productId?._id || item.productId}>
                                                            <td className="product-thumbnail">
                                                                <Link href={`/shop/${item.productId?._id || item.productId}`}>
                                                                    <img 
                                                                        src={item.image || `/assets/img/product/placeholder.jpg`} 
                                                                        alt={item.name} 
                                                                        style={{ maxWidth: '80px', maxHeight: '80px' }}
                                                                    />
                                                                </Link>
                                                            </td>
                                                            <td className="product-name">
                                                                <Link href={`/shop/${item.productId?._id || item.productId}`}>
                                                                    {item.name}
                                                                </Link>
                                                            </td>
                                                            <td className="product-price">${item.price?.toFixed(2)}</td>
                                                            <td className="product-quantity">
                                                                <div className="item-quantity">
                                                                    <input
                                                                        type="number"
                                                                        className="qty"
                                                                        min={1}
                                                                        value={item.quantity}
                                                                        onChange={(e) => {
                                                                            const newQty = parseInt(e.target.value);
                                                                            if (newQty > 0) {
                                                                                updateItemQuantity(item.productId?._id || item.productId, newQty)
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="product-subtotal">
                                                                <span className="amount">
                                                                    ${(item.price * item.quantity).toFixed(2)}
                                                                </span>
                                                            </td>
                                                            <td className="product-remove">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeItem(item.productId?._id || item.productId)}
                                                                    className="remove"
                                                                >
                                                                    <i className="fa fa-times"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="coupon-all">
                                                    <div className="coupon">
                                                        <input 
                                                            id="coupon_code" 
                                                            className="input-text" 
                                                            name="coupon_code" 
                                                            placeholder="Coupon code" 
                                                            type="text"
                                                            value={couponCode}
                                                            onChange={(e) => setCouponCode(e.target.value)}
                                                        />
                                                        <button 
                                                            className="tp-btn tp-color-btn banner-animation" 
                                                            name="apply_coupon" 
                                                            type="button"
                                                            onClick={applyCoupon}
                                                        >
                                                            Apply Coupon
                                                        </button>
                                                    </div>
                                                    <div className="coupon2">
                                                        <button 
                                                            className="tp-btn tp-color-btn banner-animation" 
                                                            name="update_cart" 
                                                            type="button"
                                                            onClick={updateCart}
                                                        >
                                                            Update cart
                                                        </button>
                                                        <button 
                                                            className="tp-btn banner-animation ml-2" 
                                                            type="button"
                                                            onClick={clearCart}
                                                            style={{ marginLeft: '10px' }}
                                                        >
                                                            Clear cart
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row justify-content-end">
                                            <div className="col-md-5">
                                                <div className="cart-page-total">
                                                    <h2>Cart totals</h2>
                                                    <ul className="mb-20">
                                                        <li>Subtotal <span>${subtotal.toFixed(2)}</span></li>
                                                        <li>Total <span>${total.toFixed(2)}</span></li>
                                                    </ul>
                                                    <Link href="/checkout" className="tp-btn tp-color-btn banner-animation">Proceed to Checkout</Link>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </Layout>
        </>
    )
}