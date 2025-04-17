'use client'
import { useState } from 'react'
import Link from 'next/link'
import WishlistButton from '../elements/WishlistButton'

const ProductCard = ({ product, onAddToCart }) => {
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  
  const handleAddToCart = async () => {
    setLoading(true)
    try {
      await onAddToCart(product._id || product.id)
    } finally {
      setLoading(false)
    }
  }

  // Format currency to VND
  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0
    return numAmount.toLocaleString('vi-VN') + ' ₫'
  }

  return (
    <div 
      className="product-wrapper mb-10" 
      style={{
        border: "1px solid #e9e9e9",
        borderRadius: "12px",
        overflow: "hidden",
        transition: "all 0.4s ease",
        backgroundColor: "#fff",
        boxShadow: hovered ? "0 10px 30px rgba(0,0,0,0.1)" : "0 2px 10px rgba(0,0,0,0.03)",
        transform: hovered ? "translateY(-5px)" : "none"
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="product-img" style={{ position: "relative", overflow: "hidden" }}>
        <Link href={`/shop-details/${product._id || product.id}`}>
          <div style={{ position: "relative", paddingBottom: "100%", overflow: "hidden" }}>
            <img 
              src={product.images && product.images.length > 0 
                ? product.images[0] 
                : "/assets/img/product/placeholder.jpg"} 
              alt={product.title || product.name} 
              className="product-thumb img-fluid"
              style={{ 
                position: "absolute",
                top: "0",
                left: "0",
                height: "100%", 
                width: "100%", 
                objectFit: "contain",
                transition: "transform 0.5s ease",
                padding: "20px",
                transform: hovered ? "scale(1.08)" : "scale(1)"
              }}
            />
          </div>
        </Link>
        
        {/* Quick View Overlay */}
        <div 
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background: "rgba(0,0,0,0.03)",
            opacity: hovered ? "1" : "0",
            transition: "opacity 0.3s ease",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <Link 
            href={`/shop-details/${product._id || product.id}`}
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              color: "#333",
              padding: "10px 20px",
              borderRadius: "30px",
              fontSize: "14px",
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              boxShadow: "0 5px 15px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
              transform: hovered ? "translateY(0)" : "translateY(20px)",
              opacity: hovered ? "1" : "0",
              textDecoration: "none"
            }}
          >
            <i className="fa fa-eye me-2"></i> Quick View
          </Link>
        </div>

        {product.onSale && (
          <div 
            className="sale-badge" 
            style={{ 
              position: "absolute", 
              top: "15px", 
              left: "15px", 
              backgroundColor: "#ff4a17", 
              color: "white", 
              padding: "5px 12px", 
              borderRadius: "30px",
              fontSize: "12px",
              fontWeight: "700",
              boxShadow: "0 3px 8px rgba(255,74,23,0.3)",
              zIndex: "2",
              letterSpacing: "0.5px"
            }}
          >
            {product.priceBeforeSale && product.price ? 
              `-${Math.round((1 - product.price / product.priceBeforeSale) * 100)}%` : 
              'SALE'}
          </div>
        )}
        
        {/* Action Buttons */}
        <div 
          className="product-action" 
          style={{
            position: "absolute",
            bottom: hovered ? "15px" : "-60px",
            left: "0",
            right: "0",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
            padding: "0 15px",
            transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            zIndex: "5"
          }}
        >
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
              width: "42px",
              height: "42px",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(76,175,80,0.25)",
              transform: hovered ? "translateY(0)" : "translateY(20px)",
              opacity: hovered ? "1" : "0"
            }}
          >
            <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-shopping-cart'}`} style={{ fontSize: "16px" }}></i>
          </button>
          
          <WishlistButton 
            productId={product._id || product.id} 
            className="action-btn" 
            style={{
              backgroundColor: "#F44336",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "42px",
              height: "42px",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(244,67,54,0.25)",
              transform: hovered ? "translateY(0)" : "translateY(20px)",
              opacity: hovered ? "1" : "0"
            }}
          />
          
          <Link 
            href={`/shop-details/${product._id || product.id}`} 
            className="action-btn" 
            title="View Details"
            style={{
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "42px",
              height: "42px",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 15px rgba(33,150,243,0.25)",
              transform: hovered ? "translateY(0)" : "translateY(20px)",
              opacity: hovered ? "1" : "0"
            }}
          >
            <i className="fa fa-arrow-right" style={{ fontSize: "16px" }}></i>
          </Link>
        </div>
      </div>
      
      <div className="product-content" style={{ padding: "20px" }}>
        <h4 style={{ 
          fontSize: "16px", 
          fontWeight: "600", 
          marginBottom: "12px",
          lineHeight: "1.5",
          height: "48px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical",
          transition: "color 0.3s ease"
        }}>
          <Link 
            href={`/shop-details/${product._id || product.id}`} 
            style={{ 
              color: hovered ? "#ff4a17" : "#333", 
              transition: "color 0.3s ease",
              textDecoration: "none"
            }}
          >
            {product.title || product.name}
          </Link>
        </h4>
        
        <div className="product-price" style={{ 
          marginBottom: "12px",
          display: "flex",
          alignItems: "center", 
          fontFamily: "'Poppins', sans-serif"
        }}>
          {product.onSale ? (
            <>
              <del style={{ 
                color: "#999", 
                marginRight: "10px", 
                fontSize: "14px"
              }}>
                {formatCurrency(product.priceBeforeSale || 0)}
              </del>
              <span style={{ 
                color: "#ff4a17", 
                fontWeight: "600", 
                fontSize: "18px"
              }}>
                {formatCurrency(product.price || 0)}
              </span>
            </>
          ) : (
            <span style={{ 
              color: "#ff4a17", 
              fontWeight: "600", 
              fontSize: "18px"
            }}>
              {formatCurrency(product.price || product.priceBeforeSale || 0)}
            </span>
          )}
        </div>
        
        {product.reviews && product.reviews.length > 0 && (
          <div className="product-rating" style={{ 
            display: "flex", 
            alignItems: "center",
            marginBottom: "5px" 
          }}>
            <div className="rating-stars" style={{ 
              color: "#FFC107", 
              marginRight: "8px",
              display: "flex"
            }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <i 
                  key={star} 
                  className={`fa fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`}
                  style={{ fontSize: "14px", marginRight: "2px" }}
                ></i>
              ))}
            </div>
            <span style={{ 
              color: "#777", 
              fontSize: "13px"
            }}>
              ({product.reviews.length})
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductCard 