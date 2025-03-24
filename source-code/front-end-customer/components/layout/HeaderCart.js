'use client'
import Link from "next/link"
import { useDispatch, useSelector } from "react-redux"
import { useState, useEffect } from "react"
import { toast } from "react-toastify"
import { reloadCart, fetchCartFromAPI } from "@/features/shopSlice"

export default function HeaderCart({ isCartSidebar, handleCartSidebar }) {
    const { cart, status } = useSelector((state) => state.shop) || {}
    const [cartData, setCartData] = useState({ items: [], totalAmount: 0 })
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch()

    useEffect(() => {
        if (isCartSidebar) {
            setLoading(true)
            dispatch(fetchCartFromAPI())
                .unwrap()
                .then(data => {
                    setCartData({
                        items: data.items || [],
                        totalAmount: calculateTotal(data.items || [])
                    })
                })
                .catch(error => {
                    console.error("Failed to fetch cart data:", error)
                    toast.error("Failed to load cart data")
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [isCartSidebar, dispatch])

    // Cập nhật dữ liệu giỏ hàng khi Redux state thay đổi
    useEffect(() => {
        if (cart && cart.length > 0) {
            // Convert Redux cart format to API cart format
            const cartItems = cart.map(item => ({
                productId: item.id,
                name: item.title,
                price: item.price?.max || 0,
                quantity: item.qty || 1,
                image: item.imgf ? `/assets/img/product/${item.imgf}` : "/assets/img/product/placeholder.jpg"
            }))
            
            setCartData({
                items: cartItems,
                totalAmount: calculateTotal(cartItems)
            })
        }
    }, [cart])

    const calculateTotal = (items) => {
        return items.reduce((total, item) => {
            return total + (item.price * item.quantity)
        }, 0)
    }

    const removeItem = async (productId) => {
        try {
            const customerId = localStorage.getItem('customerId')
            if (!customerId) return
            
            setLoading(true)
            
            const apiUrl = process.env.domainApi || 'http://localhost:8080'
            const response = await fetch(`${apiUrl}/api/customer/cart/items/${productId}/${customerId}`, {
                method: 'DELETE',
            })
            
            if (!response.ok) {
                throw new Error('Failed to remove item from cart')
            }
            
            const data = await response.json()
            
            if (data.success) {
                // Refresh cart with fresh data
                dispatch(fetchCartFromAPI()).unwrap()
                    .then(() => {
                        toast.success('Item removed from cart')
                    })
                    .finally(() => {
                        setLoading(false)
                    })
            } else {
                throw new Error(data.message || 'Failed to remove item from cart')
            }
        } catch (error) {
            console.error('Error removing item from cart:', error)
            toast.error('Failed to remove item from cart')
            setLoading(false)
        }
    }

    return (
        <>
            <div className={`tpcartinfo tp-cart-info-area p-relative ${isCartSidebar ? "tp-sidebar-opened" : ""}`}>
                <button className="tpcart__close" onClick={handleCartSidebar}><i className="fal fa-times" /></button>
                <div className="tpcart">
                    <h4 className="tpcart__title">Your Cart</h4>
                    <div className="tpcart__product">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : cartData.items.length === 0 ? (
                            <div className="text-center py-4">
                                <p>Your cart is empty</p>
                                <Link className="tpcart-btn" href="/shop" onClick={handleCartSidebar}>
                                    Continue Shopping
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="tpcart__product-list">
                                    <ul>
                                        {cartData.items.map((item, index) => (
                                            <li key={item.productId?._id || item.productId || index}>
                                                <div className="tpcart__item">
                                                    <div className="tpcart__img">
                                                        <img src={item.image || "/assets/img/product/placeholder.jpg"} alt={item.name} />
                                                        <div className="tpcart__del" onClick={() => removeItem(item.productId?._id || item.productId)}>
                                                            <Link href="#"><i className="far fa-times-circle" /></Link>
                                                        </div>
                                                    </div>
                                                    <div className="tpcart__content">
                                                        <span className="tpcart__content-title">
                                                            <Link href={`/shop-details/${item.productId?._id || item.productId}`}>{item.name}</Link>
                                                        </span>
                                                        <div className="tpcart__cart-price">
                                                            <span className="quantity">{item.quantity} x </span>
                                                            <span className="new-price">${item.price.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="tpcart__checkout">
                                    <div className="tpcart__total-price d-flex justify-content-between align-items-center">
                                        <span>Subtotal:</span>
                                        <span className="heilight-price">${cartData.totalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="tpcart__checkout-btn">
                                        <Link className="tpcart-btn mb-10" href="/cart" onClick={handleCartSidebar}>View Cart</Link>
                                        <Link className="tpcheck-btn" href="/checkout" onClick={handleCartSidebar}>Checkout</Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="tpcart__free-shipping text-center">
                        <span>Free shipping for orders <b>under 10km</b></span>
                    </div>
                </div>
            </div>
            <div className={`cartbody-overlay ${isCartSidebar ? "opened" : ""}`} onClick={handleCartSidebar} />
        </>
    )
}
