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
            {products.map((product) => (
              <div key={product._id || product.id} className="product-list-item mb-30" style={{
                border: "1px solid #e9e9e9",
                borderRadius: "8px",
                overflow: "hidden",
                transition: "box-shadow 0.3s ease",
                backgroundColor: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)"
              }}>
                <div className="row align-items-center">
                  <div className="col-lg-4">
                    <div className="product-list-img" style={{ position: "relative", padding: "20px" }}>
                      <Link href={`/shop-details/${product._id || product.id}`}>
                        <img 
                          src={product.images && product.images.length > 0 
                            ? product.images[0] 
                            : "/assets/img/product/placeholder.jpg"} 
                          alt={product.title || product.name} 
                          className="img-fluid"
                          style={{ 
                            height: "220px", 
                            width: "100%", 
                            objectFit: "contain",
                            transition: "transform 0.3s ease" 
                          }}
                        />
                      </Link>
                      {product.onSale && (
                        <div 
                          style={{ 
                            position: "absolute", 
                            top: "15px", 
                            left: "15px", 
                            backgroundColor: "#ff4a17", 
                            color: "white", 
                            padding: "4px 10px", 
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "600",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
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
                        fontSize: "20px", 
                        fontWeight: "600", 
                        marginBottom: "12px",
                        lineHeight: "1.4",
                      }}>
                        <Link href={`/shop-details/${product._id || product.id}`} style={{ color: "#333", transition: "color 0.3s ease" }}>
                          {product.title || product.name}
                        </Link>
                      </h4>
                      <div className="product-price mb-10">
                        {product.onSale ? (
                          <>
                            <del style={{ color: "#999", marginRight: "10px", fontSize: "16px" }}>${(product.priceBeforeSale || 0).toFixed(2)}</del>
                            <span style={{ color: "#ff4a17", fontWeight: "700", fontSize: "20px" }}>${(product.price || 0).toFixed(2)}</span>
                          </>
                        ) : (
                          <span style={{ color: "#333", fontWeight: "700", fontSize: "20px" }}>${(product.priceBeforeSale || product.price || 0).toFixed(2)}</span>
                        )}
                      </div>
                      {product.reviews && product.reviews.length > 0 && (
                        <div className="product-rating mb-10" style={{ display: "flex", alignItems: "center" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i 
                              key={star} 
                              className={`fa fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`}
                              style={{ color: "#FFC107", fontSize: "14px", marginRight: "2px" }}
                            ></i>
                          ))}
                          <span style={{ color: "#777", fontSize: "14px", marginLeft: "5px" }}>({product.reviews.length})</span>
                        </div>
                      )}
                      <p className="mb-15" style={{ 
                        color: "#666", 
                        lineHeight: "1.6", 
                        fontSize: "14px",
                        marginBottom: "20px"
                      }}>
                        {product.description?.substring(0, 150)}...
                      </p>
                      <div className="product-list-action">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleAddToCart(product._id || product.id)}
                          style={{
                            backgroundColor: "#4CAF50",
                            border: "none",
                            borderRadius: "4px",
                            padding: "8px 15px",
                            fontSize: "14px",
                            fontWeight: "500",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                            transition: "all 0.3s ease"
                          }}
                        >
                          <i className="fa fa-shopping-cart me-1"></i> Add to Cart
                        </button>
                        <Link 
                          href={`/shop-details/${product._id || product.id}`} 
                          className="btn btn-sm btn-outline-primary"
                          style={{
                            borderColor: "#2196F3",
                            color: "#2196F3",
                            backgroundColor: "transparent",
                            borderRadius: "4px",
                            padding: "8px 15px",
                            fontSize: "14px",
                            fontWeight: "500",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                            transition: "all 0.3s ease",
                            marginLeft: "8px"
                          }}
                        >
                          <i className="fa fa-eye me-1"></i> View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {totalPages > 1 && renderPagination()}
    </div>
  )
}

export default ProductList 