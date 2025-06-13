'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SearchBox = ({ className = '', placeholder = "Search products...", showResults = true }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  // Debounce search để không gọi API quá nhiều
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim() && showResults) {
        searchProducts()
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const searchProducts = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('search', searchTerm.trim())
      params.append('limit', 8) // Limit để dropdown không quá dài
      
      const url = `${process.env.domainApi}/api/customer/products?${params.toString()}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      
      const data = await response.json()
      setSearchResults(data.products || [])
      setShowDropdown(data.products?.length > 0)
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
      setShowDropdown(false)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      // Redirect to shop page với search term
      router.push(`/shop?search=${encodeURIComponent(searchTerm.trim())}`)
      setShowDropdown(false)
    }
  }

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleResultClick = (productId) => {
    setShowDropdown(false)
    setSearchTerm('')
    router.push(`/shop-details/${productId}`)
  }

  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0
    return numAmount.toLocaleString('vi-VN') + ' ₫'
  }

  return (
    <div className={`search-box-wrapper ${className}`} style={{ position: 'relative' }}>
      <form onSubmit={handleSearch}>
        <div className="search-info p-relative">
          <button type="submit" className="header-search-icon">
            <i className="fal fa-search" />
          </button>
          <input 
            type="text" 
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true)
            }}
            onBlur={() => {
              // Delay để click vào kết quả search hoạt động
              setTimeout(() => setShowDropdown(false), 200)
            }}
          />
        </div>
      </form>

      {/* Search Results Dropdown */}
      {showResults && showDropdown && (
        <div 
          className="search-results-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: '#fff',
            border: '1px solid #e9e9e9',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 9999,
            maxHeight: '400px',
            overflowY: 'auto'
          }}
        >
          {loading ? (
            <div className="search-loading" style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fa fa-spinner fa-spin"></i> Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <>
              {searchResults.map((product) => (
                <div 
                  key={product._id || product.id}
                  className="search-result-item"
                  onClick={() => handleResultClick(product._id || product.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'background-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <div style={{ width: '50px', height: '50px', marginRight: '12px' }}>
                    <img 
                      src={product.images && product.images.length > 0 
                        ? product.images[0] 
                        : "/assets/img/product/placeholder.jpg"} 
                      alt={product.title || product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h6 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '14px',
                      fontWeight: '600',
                      lineHeight: '1.4',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {product.title || product.name}
                    </h6>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {product.onSale ? (
                        <>
                          <span style={{ 
                            color: '#ff4a17', 
                            fontWeight: '700',
                            fontSize: '14px'
                          }}>
                            {formatCurrency(product.price)}
                          </span>
                          <del style={{ 
                            color: '#999', 
                            fontSize: '12px'
                          }}>
                            {formatCurrency(product.priceBeforeSale)}
                          </del>
                        </>
                      ) : (
                        <span style={{ 
                          color: '#333', 
                          fontWeight: '700',
                          fontSize: '14px'
                        }}>
                          {formatCurrency(product.priceBeforeSale || product.price)}
                        </span>
                      )}
                      {product.onSale && (
                        <span style={{
                          backgroundColor: '#ff4a17',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '700'
                        }}>
                          SALE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div 
                className="search-view-all"
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  borderTop: '1px solid #e9e9e9',
                  backgroundColor: '#f8f9fa'
                }}
              >
                <Link 
                  href={`/shop?search=${encodeURIComponent(searchTerm)}`}
                  style={{
                    color: '#ff4a17',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                  onClick={() => setShowDropdown(false)}
                >
                  View all results for "{searchTerm}"
                </Link>
              </div>
            </>
          ) : (
            <div className="search-no-results" style={{ 
              padding: '20px', 
              textAlign: 'center',
              color: '#666'
            }}>
              No products found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBox 