'use client'
import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist, checkWishlistItem } from '@/features/wishlistSlice'
import { toast } from 'react-toastify'

const WishlistButton = ({ productId, className = '', iconClass = 'fa-heart' }) => {
  const [inWishlist, setInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const { wishlistMap } = useSelector((state) => state.wishlist)

  useEffect(() => {
    // Check if product is in wishlist map from redux
    if (wishlistMap && wishlistMap[productId]) {
      setInWishlist(true)
    } else {
      // If not found in redux, check with API
      dispatch(checkWishlistItem(productId))
        .unwrap()
        .then(result => {
          setInWishlist(result.inWishlist)
        })
        .catch(() => {
          setInWishlist(false)
        })
    }
  }, [dispatch, productId, wishlistMap])

  const toggleWishlist = async () => {
    const customerId = localStorage.getItem('customerId')
    if (!customerId) {
      toast.error('Please login to add items to your wishlist')
      return
    }

    setLoading(true)
    try {
      if (inWishlist) {
        await dispatch(removeFromWishlist(productId)).unwrap()
        setInWishlist(false)
        toast.info('Product removed from wishlist')
      } else {
        await dispatch(addToWishlist(productId)).unwrap()
        setInWishlist(true)
        toast.success('Product added to wishlist')
      }
    } catch (error) {
      toast.error(error || 'Failed to update wishlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      className={`wishlist-btn ${className} ${inWishlist ? 'active' : ''}`}
      onClick={toggleWishlist}
      disabled={loading}
      style={{ 
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: inWishlist ? '#ff4a17' : 'inherit',
        opacity: loading ? 0.7 : 1
      }}
    >
      <i className={`${iconClass} ${inWishlist ? 'fas' : 'far'}`}></i>
    </button>
  )
}

export default WishlistButton 