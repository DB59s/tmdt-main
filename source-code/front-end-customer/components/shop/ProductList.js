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
  priceRange = { min: 0, max: 1000 }
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
  }, [category, searchTerm, sortOption, limit, page, priceRange])
  
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
      
      // Tạo URL với query parameters
      const url = `http://localhost:8080/api/customer/products?${params.toString()}`
      
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
      const customerId = localStorage.getItem('customerId')
      const token = localStorage.getItem('token')
      
      let url = `http://localhost:8080/api/customer/cart/items`
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
          quantity: 1
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
              <div key={product._id || product.id} className="product-list-item mb-30">
                <div className="row align-items-center">
                  <div className="col-lg-4">
                    <div className="product-list-img">
                      <Link href={`/shop-details/${product._id || product.id}`}>
                        <img 
                          src={product.images && product.images.length > 0 
                            ? product.images[0] 
                            : "/assets/img/product/placeholder.jpg"} 
                          alt={product.name} 
                          className="img-fluid"
                          style={{ maxHeight: "200px", width: "100%", objectFit: "contain" }}
                        />
                      </Link>
                    </div>
                  </div>
                  <div className="col-lg-8">
                    <div className="product-list-content">
                      <h4>
                        <Link href={`/shop-details/${product._id || product.id}`}>{product.name}</Link>
                      </h4>
                      <div className="product-price mb-10">
                        <span>${(product.price || 0).toFixed(2)}</span>
                      </div>
                      {product.reviews && product.reviews.length > 0 && (
                        <div className="product-rating mb-10">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i 
                              key={star} 
                              className={`fa fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`}
                            ></i>
                          ))}
                          <span>({product.reviews.length})</span>
                        </div>
                      )}
                      <p className="mb-15">{product.description?.substring(0, 150)}...</p>
                      <div className="product-list-action">
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleAddToCart(product._id || product.id)}
                        >
                          <i className="fa fa-shopping-cart me-1"></i> Add to Cart
                        </button>
                        <Link href={`/shop-details/${product._id || product.id}`} className="btn btn-sm btn-outline-primary">
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