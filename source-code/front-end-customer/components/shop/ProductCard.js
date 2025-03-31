'use client'
import { useState } from 'react'
import Link from 'next/link'
import WishlistButton from '../elements/WishlistButton'

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
    <div className="product-wrapper mb-10" style={{
      border: "1px solid #e9e9e9",
      borderRadius: "8px",
      overflow: "hidden",
      transition: "box-shadow 0.3s ease",
      backgroundColor: "#fff",
      boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
    }}>
      <div className="product-img" style={{ position: "relative", overflow: "hidden" }}>
        <Link href={`/shop-details/${product._id || product.id}`}>
          <img 
            src={product.images && product.images.length > 0 
              ? product.images[0] 
              : "/assets/img/product/placeholder.jpg"} 
            alt={product.title || product.name} 
            className="product-thumb img-fluid"
            style={{ 
              height: "220px", 
              width: "100%", 
              objectFit: "contain",
              transition: "transform 0.3s ease",
              padding: "10px" 
            }}
          />
        </Link>
        {product.onSale && (
          <div 
            className="sale-badge" 
            style={{ 
              position: "absolute", 
              top: "10px", 
              left: "10px", 
              backgroundColor: "#ff4a17", 
              color: "white", 
              padding: "4px 10px", 
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              zIndex: "2"
            }}
          >
            {product.priceBeforeSale && product.price ? 
              `-${Math.round((1 - product.price / product.priceBeforeSale) * 100)}%` : 
              'SALE'}
          </div>
        )}
        <div className="product-action" style={{
          position: "absolute",
          bottom: "-50px",
          left: "0",
          right: "0",
          display: "flex",
          justifyContent: "center",
          background: "rgba(255,255,255,0.9)",
          padding: "10px 0",
          transition: "all 0.3s ease",
          opacity: "0"
        }}>
          <button 
            type="button" 
            className="action-btn"
            onClick={handleAddToCart}
            disabled={loading}
            title="Add to Cart"
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 5px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
            }}
          >
            <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-shopping-cart'}`}></i>
          </button>
          <Link 
            href={`/shop-details/${product._id || product.id}`} 
            className="action-btn" 
            title="Quick View"
            style={{
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 5px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
            }}
          >
            <i className="fa fa-eye"></i>
          </Link>
          <WishlistButton 
            productId={product._id || product.id} 
            className="action-btn" 
            style={{
              backgroundColor: "#F44336",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "0 5px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
            }}
          />
        </div>
        <style jsx>{`
          .product-img:hover .product-action {
            opacity: 1;
            bottom: 0;
          }
          .product-img:hover img {
            transform: scale(1.05);
          }
          .product-wrapper:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
          }
        `}</style>
      </div>
      <div className="product-content" style={{ padding: "15px" }}>
        <h4 style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          marginBottom: "10px",
          lineHeight: "1.4",
          height: "44px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical"
        }}>
          <Link href={`/shop-details/${product._id || product.id}`} style={{ color: "#333", transition: "color 0.3s ease" }}>
            {product.title || product.name}
          </Link>
        </h4>
        <div className="product-price" style={{ marginBottom: "8px" }}>
          {product.onSale ? (
            <>
              <del style={{ color: "#999", marginRight: "8px", fontSize: "14px" }}>${(product.priceBeforeSale || 0).toFixed(2)}</del>
              <span style={{ color: "#ff4a17", fontWeight: "700", fontSize: "16px" }}>${(product.price || 0).toFixed(2)}</span>
            </>
          ) : (
            <span style={{ color: "#333", fontWeight: "700", fontSize: "16px" }}>${(product.priceBeforeSale || product.price || 0).toFixed(2)}</span>
          )}
        </div>
        {product.reviews && product.reviews.length > 0 && (
          <div className="product-rating" style={{ display: "flex", alignItems: "center" }}>
            <div className="rating-stars" style={{ color: "#FFC107", marginRight: "5px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star} 
                  className={`fa fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`}
                  style={{ fontSize: "14px" }}
                ></i>
              ))}
            </div>
            <span style={{ color: "#777", fontSize: "12px" }}>({product.reviews.length})</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard 