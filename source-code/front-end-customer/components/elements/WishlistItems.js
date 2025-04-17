'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useDispatch } from 'react-redux'
import { updateWishlist } from '@/features/wishlistSlice'

const WishlistItems = () => {
  const [wishlistItems, setWishlistItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    fetchWishlistItems()
  }, [])

  const fetchWishlistItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) {
        setWishlistItems([])
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Error fetching wishlist: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data && data.success && data.data && data.data.items) {
        setWishlistItems(data.data.items)
        dispatch(updateWishlist(data.data.items))
      } else {
        setWishlistItems([])
      }
    } catch (err) {
      console.error('Failed to fetch wishlist items:', err)
      setError('Failed to load wishlist items. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (productId) => {
    try {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) return

      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/wishlist/${customerId}/items/${productId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        throw new Error(`Error removing item from wishlist: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data && data.success) {
        // Update local state and Redux
        const updatedItems = wishlistItems.filter(item => item.productId._id !== productId)
        setWishlistItems(updatedItems)
        dispatch(updateWishlist(updatedItems))
      }
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err)
      alert('Failed to remove item from wishlist. Please try again.')
    }
  }

  const handleAddToCart = async (product) => {
    try {
      const customerId = localStorage.getItem('customerId')
      const token = localStorage.getItem('token')
      
      let url = `${process.env.domainApi}/api/customer/cart/items`
      if (customerId) url += `/${customerId}`
      
      const headers = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.productId._id,
          quantity: 1,
          productPrice: product.price,
          onSale: product.onSale,
          priceBeforeSale: product.priceBeforeSale
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Product added to cart!')
      } else {
        alert(data.message || 'Failed to add product to cart')
      }
    } catch (err) {
      console.error('Error adding to cart:', err)
      alert('An error occurred. Please try again.')
    }
  }

  if (loading) {
    return (
      <tr>
        <td colSpan="7" className="text-center">
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </td>
      </tr>
    )
  }

  if (error) {
    return (
      <tr>
        <td colSpan="7">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </td>
      </tr>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <tr>
        <td colSpan="7" className="text-center py-5">
          <div>
            <p className="mb-4">Your wishlist is empty</p>
            <Link href="/shop" className="tp-btn">
              Continue Shopping
            </Link>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <>
      {wishlistItems.map((item) => (
        <tr key={item.productId._id}>
          <td className="product-thumbnail">
            <Link href={`/shop-details/${item.productId._id}`}>
              <img 
                src={item.image || (item.productId.thumbnail || "/assets/img/product/placeholder.jpg")} 
                alt={item.name || item.productId.title}
                style={{ height: "80px", width: "80px", objectFit: "contain" }} 
              />
            </Link>
          </td>
          <td className="product-name">
            <Link href={`/shop-details/${item.productId._id}`}>
              {item.productId.title || item.productId.name}
            </Link>
          </td>
          <td className="product-price">
            {item.onSale ? (
              <span className="amount">
                <del className="me-2 text-muted">{(item.priceBeforeSale || 0).toLocaleString('vi-VN')}đ</del>
                <span className="text-danger">{(item.price || 0).toLocaleString('vi-VN')}đ</span>
              </span>
            ) : (
              <span className="amount">{(item.price || 0).toLocaleString('vi-VN')}đ</span>
            )}
          </td>
          <td className="product-quantity">
            <span>1</span>
          </td>
          <td className="product-subtotal">
            <span className="amount">{(item.price || 0).toLocaleString('vi-VN')}đ</span>
          </td>
          <td className="product-add-to-cart">
            <button 
              className="tp-btn-2 tp-btn-bd-3 add-cart-btn"
              onClick={() => handleAddToCart(item)}
            >
              <i className="fal fa-cart-arrow-down"></i> Add to Cart
            </button>
          </td>
          <td className="product-remove">
            <button 
              className="remove-btn"
              onClick={() => handleRemoveItem(item.productId._id)}
            >
              <i className="fa fa-times"></i>
            </button>
          </td>
        </tr>
      ))}
    </>
  )
}

export default WishlistItems
