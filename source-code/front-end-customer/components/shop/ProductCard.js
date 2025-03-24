'use client'
import { useState } from 'react'
import Link from 'next/link'

const ProductCard = ({ product, onAddToCart }) => {
  const [loading, setLoading] = useState(false)
  
  const handleAddToCart = async () => {
    setLoading(true)
    try {
      await onAddToCart(product._id || product.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="product-wrapper mb-10">
      <div className="product-img">
        <Link href={`/shop-details/${product._id || product.id}`}>
          <img 
            src={product.images && product.images.length > 0 
              ? product.images[0] 
              : "/assets/img/product/placeholder.jpg"} 
            alt={product.name} 
            className="product-thumb img-fluid"
            style={{ maxHeight: "250px", width: "100%", objectFit: "contain" }}
          />
        </Link>
        <div className="product-action">
          <button 
            type="button" 
            className="action-btn"
            onClick={handleAddToCart}
            disabled={loading}
            title="Add to Cart"
          >
            <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-shopping-cart'}`}></i>
          </button>
          <Link href={`/shop-details/${product._id || product.id}`} className="action-btn" title="Quick View">
            <i className="fa fa-eye"></i>
          </Link>
          <button type="button" className="action-btn" title="Add to Wishlist">
            <i className="fa fa-heart"></i>
          </button>
        </div>
      </div>
      <div className="product-content">
        <h4>
          <Link href={`/shop-details/${product._id || product.id}`}>{product.name}</Link>
        </h4>
        <div className="product-price">
          <span>${(product.price || 0).toFixed(2)}</span>
        </div>
        {product.reviews && product.reviews.length > 0 && (
          <div className="product-rating">
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star} 
                  className={`fa fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`}
                ></i>
              ))}
            </div>
            <span>({product.reviews.length})</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard 