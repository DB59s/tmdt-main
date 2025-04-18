'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProductCard from './ProductCard'

const ProductList = ({ 
  category = null, 
  limit = 12, 
  searchTerm = '', 
  sortOption = 'name-asc',
  viewMode = 'grid',
  priceRange = { min: 0, max: 1000 },
  onSale = null
}) => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortField, setSortField] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  
  // Xử lý thay đổi sortOption từ FilterShopBox
  useEffect(() => {
    if (sortOption) {
      const [field, order] = sortOption.includes('-') 
        ? sortOption.split('-') 
        : [sortOption === 'newest' ? 'createdAt' : 'name', sortOption === 'newest' ? 'desc' : 'asc'];
      
      setSortField(field);
      setSortOrder(order);
    }
  }, [sortOption]);
  
  useEffect(() => {
    fetchProducts()
  }, [category, searchTerm, sortOption, limit, page, priceRange, onSale])
  
  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Tạo query parameters
      const params = new URLSearchParams()
      
      if (category) {
        params.append('category', category)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      if (sortOption) {
        params.append('sort', sortOption)
      }
      
      if (limit) {
        params.append('limit', limit)
      }
      
      if (page) {
        params.append('page', page)
      }
      
      // Thêm tham số lọc giá
      if (priceRange && priceRange.min !== undefined) {
        params.append('minPrice', priceRange.min)
      }
      
      if (priceRange && priceRange.max !== undefined) {
        params.append('maxPrice', priceRange.max)
      }
      
      // Thêm tham số lọc onSale
      if (onSale !== null) {
        params.append('onSale', onSale)
      }
      
      // Tạo URL với query parameters
      const url = `${process.env.domainApi}/api/customer/products?${params.toString()}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data) {
        setProducts(data.products || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError('Failed to load products. Please try again later.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleSort = (option) => {
    const [field, order] = option.split('-')
    setSortField(field)
    setSortOrder(order)
    setPage(1)
  }
  
  const handleAddToCart = async (productId) => {
    try {
      // Find the product to get its details
      const product = products.find(p => p._id === productId || p.id === productId)
      if (!product) return
      
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
          productId,
          quantity: 1,
          productPrice: product.price,
          onSale: product.onSale,
          priceBeforeSale: product.priceBeforeSale
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Show success notification
        alert('Product added to cart!')
      } else {
        // Show error notification
        alert(data.message || 'Failed to add product to cart')
      }
    } catch (err) {
      alert('An error occurred. Please try again.')
    }
  }
  
  const renderPagination = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => setPage(i)}
          >
            {i}
          </button>
        </li>
      )
    }
    
    return (
      <div className="basic-pagination mt-30">
        <nav>
          <ul className="pagination">
            <li className="page-item">
              <button 
                className="page-link" 
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                <i className="fa fa-angle-left"></i>
              </button>
            </li>
            {pages}
            <li className="page-item">
              <button 
                className="page-link" 
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                <i className="fa fa-angle-right"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    )
  }
  
  if (loading && products.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    )
  }
  
  if (products.length === 0) {
    return (
      <div className="alert alert-info" role="alert">
        No products found.
      </div>
    )
  }
  
  return (
    <div className="product-list-area">
      <div className="product-list-top mb-20">
        <div className="row align-items-center">
        </div>
      </div>
      
      <div className="products-wrapper">
        {viewMode === 'grid' ? (
          <div className="row">
            {products.map((product) => (
              <div key={product._id || product.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-6">
                <ProductCard 
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="product-list-view">
            {products.map((product) => {
              const [hovered, setHovered] = useState(false);
              const [loading, setLoading] = useState(false);
              
              const handleAddToCartInList = async () => {
                setLoading(true);
                try {
                  await handleAddToCart(product._id || product.id);
                } finally {
                  setLoading(false);
                }
              };
              
              return (
                <div 
                  key={product._id || product.id} 
                  className="product-list-item mb-30" 
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
                  <div className="row align-items-center">
                    <div className="col-lg-4">
                      <div className="product-list-img" style={{ position: "relative", padding: "20px" }}>
                        <Link href={`/shop-details/${product._id || product.id}`}>
                          <div style={{ position: "relative", paddingBottom: "80%", overflow: "hidden" }}>
                            <img 
                              src={product.images && product.images.length > 0 
                                ? product.images[0] 
                                : "/assets/img/product/placeholder.jpg"} 
                              alt={product.title || product.name} 
                              className="img-fluid"
                              style={{ 
                                position: "absolute",
                                top: "0",
                                left: "0",
                                height: "100%", 
                                width: "100%", 
                                objectFit: "contain",
                                transition: "transform 0.5s ease",
                                transform: hovered ? "scale(1.05)" : "scale(1)"
                              }}
                            />
                          </div>
                        </Link>
                        {product.onSale && (
                          <div 
                            style={{ 
                              position: "absolute", 
                              top: "20px", 
                              left: "20px", 
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
                      </div>
                    </div>
                    <div className="col-lg-8">
                      <div className="product-list-content" style={{ padding: "25px" }}>
                        <h4 style={{ 
                          fontSize: "22px", 
                          fontWeight: "600", 
                          marginBottom: "15px",
                          lineHeight: "1.4",
                          transition: "color 0.3s ease"
                        }}>
                          <Link href={`/shop-details/${product._id || product.id}`} style={{ 
                            color: hovered ? "#ff4a17" : "#333", 
                            transition: "color 0.3s ease",
                            textDecoration: "none"
                          }}>
                            {product.title || product.name}
                          </Link>
                        </h4>
                        <div className="product-price mb-15" style={{ 
                          display: "flex", 
                          alignItems: "center",
                          fontFamily: "'Poppins', sans-serif"
                        }}>
                          {product.onSale ? (
                            <>
                              <del style={{ 
                                color: "#999", 
                                marginRight: "12px", 
                                fontSize: "16px"
                              }}>
                                {(product.priceBeforeSale || 0).toLocaleString('vi-VN')}đ
                              </del>
                              <span style={{ 
                                color: "#ff4a17", 
                                fontWeight: "700", 
                                fontSize: "22px"
                              }}>
                                {(product.price || 0).toLocaleString('vi-VN')}đ
                              </span>
                            </>
                          ) : (
                            <span style={{ 
                              color: "#333", 
                              fontWeight: "700", 
                              fontSize: "22px"
                            }}>
                              {(product.priceBeforeSale || product.price || 0).toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                        {product.reviews && product.reviews.length > 0 && (
                          <div className="product-rating mb-15" style={{ 
                            display: "flex", 
                            alignItems: "center" 
                          }}>
                            <div style={{ 
                              display: "flex", 
                              color: "#FFC107", 
                              marginRight: "10px" 
                            }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <i 
                                  key={star} 
                                  className={`fa fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`}
                                  style={{ fontSize: "16px", marginRight: "3px" }}
                                ></i>
                              ))}
                            </div>
                            <span style={{ 
                              color: "#777", 
                              fontSize: "14px"
                            }}>
                              ({product.reviews.length} reviews)
                            </span>
                          </div>
                        )}
                        <p className="mb-20" style={{ 
                          color: "#666", 
                          lineHeight: "1.7", 
                          fontSize: "15px",
                          maxHeight: "80px",
                          overflow: "hidden"
                        }}>
                          {product.description?.substring(0, 180)}...
                        </p>
                        <div className="product-list-action" style={{ 
                          display: "flex", 
                          alignItems: "center",
                          gap: "15px"
                        }}>
                          <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleAddToCartInList}
                            style={{
                              backgroundColor: "#4CAF50",
                              border: "none",
                              borderRadius: "30px",
                              padding: "10px 24px",
                              fontSize: "14px",
                              fontWeight: "600",
                              boxShadow: "0 4px 12px rgba(76,175,80,0.2)",
                              transition: "all 0.3s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}
                          >
                            <i className={`fa ${loading ? 'fa-spinner fa-spin' : 'fa-shopping-cart'}`}></i> 
                            <span>Add to Cart</span>
                          </button>
                          <WishlistButton 
                            productId={product._id || product.id}
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
                              boxShadow: "0 4px 12px rgba(244,67,54,0.2)"
                            }}
                          />
                          <Link 
                            href={`/shop-details/${product._id || product.id}`} 
                            className="btn btn-outline-primary"
                            style={{
                              borderColor: "#2196F3",
                              color: "#2196F3",
                              backgroundColor: "transparent",
                              borderRadius: "30px",
                              padding: "9px 24px",
                              fontSize: "14px",
                              fontWeight: "600",
                              boxShadow: "0 4px 12px rgba(33,150,243,0.1)",
                              transition: "all 0.3s ease",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              textDecoration: "none"
                            }}
                          >
                            <i className="fa fa-eye"></i>
                            <span>View Details</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {totalPages > 1 && renderPagination()}
    </div>
  )
}

export default ProductList 