'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { Navigation, Pagination } from 'swiper/modules'
import { useRouter } from 'next/navigation'

const OnSaleProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()

  useEffect(() => {
    fetchOnSaleProducts()
  }, [])

  const fetchOnSaleProducts = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${process.env.domainApi}/api/customer/products/on-sale`)
      
      if (!response.ok) {
        throw new Error(`Error fetching on-sale products: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data) {
        // Ensure products is always an array by checking the API response structure
        if (Array.isArray(data)) {
          setProducts(data)
        } else if (data.products && Array.isArray(data.products)) {
          // If the API returns {products: [...]} structure
          setProducts(data.products)
        } else {
          // Default to empty array if unexpected response
          console.error('Unexpected API response format:', data)
          setProducts([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch on-sale products:', err)
      setError('Failed to load on-sale products. Please try again later.')
      setProducts([]) // Ensure products is an array even on error
    } finally {
      setLoading(false)
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
          productId: product._id,
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

  const calculateDiscountPercentage = (original, sale) => {
    if (!original || !sale || original <= 0) return 0
    return Math.round(((original - sale) / original) * 100)
  }

  const viewAllOnSaleProducts = () => {
    router.push('/shop?onSale=true')
  }

  if (loading) {
    return (
      <section className="product-area mt-40 mb-40">
        <div className="container">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="product-area mt-40 mb-40">
        <div className="container">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null // Don't render the section if there are no on-sale products
  }

  return (
    <section className="product-area mt-40 mb-40">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-6">
            <div className="section-title">
              <span className="p-sub-title">
                <i className="fas fa-fire text-danger me-1"></i> Special Deals
              </span>
              <h2>Hot Sale Products</h2>
            </div>
          </div>
          <div className="col-lg-6 col-md-6">
            <div className="view-all-btn text-end">
              <button 
                className="btn btn-primary btn-sm" 
                onClick={viewAllOnSaleProducts}
              >
                View All <i className="fas fa-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div className="product-wrapper mt-30">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={30}
            slidesPerView={1}
            pagination={{ clickable: true }}
            navigation={true}
            breakpoints={{
              640: {
                slidesPerView: 2,
              },
              768: {
                slidesPerView: 3,
              },
              1024: {
                slidesPerView: 4,
              },
            }}
            className="product-active"
          >
            {products.map((product) => (
              <SwiperSlide key={product._id || product.id}>
                <div className="single-product" style={{
                  border: "1px solid #e9e9e9",
                  borderRadius: "8px",
                  overflow: "hidden",
                  transition: "box-shadow 0.3s ease",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <div className="product-thumb" style={{ position: "relative", flex: "1 0 auto" }}>
                    <Link href={`/shop-details/${product._id || product.id}`}>
                      <img 
                        src={product.images && product.images.length > 0 
                          ? product.images[0] 
                          : "/assets/img/product/placeholder.jpg"} 
                        alt={product.title || product.name}
                        style={{ 
                          height: "200px", 
                          width: "100%", 
                          objectFit: "contain",
                          padding: "10px",
                          transition: "transform 0.3s ease"
                        }}
                      />
                    </Link>
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
                      <a href="#" onClick={(e) => {
                        e.preventDefault();
                        handleAddToCart(product);
                      }} style={{
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
                      }}><i className="fa fa-shopping-cart"></i></a>
                      <Link href={`/shop-details/${product._id || product.id}`} style={{
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
                      }}>
                        <i className="fa fa-eye"></i>
                      </Link>
                    </div>
                    {product.onSale && (
                      <div 
                        className="sale-badge"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          background: '#ff4a17',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '600',
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          zIndex: "2"
                        }}
                      >
                        {calculateDiscountPercentage(product.priceBeforeSale, product.price)}% OFF
                      </div>
                    )}
                    <style jsx>{`
                      .product-thumb:hover .product-action {
                        opacity: 1;
                        bottom: 0;
                      }
                      .product-thumb:hover img {
                        transform: scale(1.05);
                      }
                      .single-product:hover {
                        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
                      }
                    `}</style>
                  </div>
                  <div className="product-content" style={{ padding: "15px", borderTop: "1px solid #f5f5f5" }}>
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
                      <Link href={`/shop-details/${product._id || product.id}`} style={{ color: "#333", transition: "color 0.3s ease" }}>{product.title || product.name}</Link>
                    </h4>
                    <div className="product-price">
                      {product.onSale ? (
                        <>
                          <del style={{ color: "#999", marginRight: "8px", fontSize: "14px" }}>${(product.priceBeforeSale || 0).toFixed(2)}</del>
                          <span style={{ color: "#ff4a17", fontWeight: "700", fontSize: "16px" }}>${(product.price || 0).toFixed(2)}</span>
                        </>
                      ) : (
                        <span style={{ color: "#333", fontWeight: "700", fontSize: "16px" }}>${(product.price || 0).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

export default OnSaleProducts 