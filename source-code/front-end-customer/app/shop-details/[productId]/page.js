'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Layout from '@/components/layout/Layout'
import { toast } from 'react-toastify'
import { Autoplay, Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"
import WishlistButton from '@/components/elements/WishlistButton'

const swiperOptions = {
    modules: [Autoplay, Pagination, Navigation],
    slidesPerView: 5,
    spaceBetween: 25,
    autoplay: {
        delay: 3500,
    },
    breakpoints: {
        1400: {
            slidesPerView: 5,
        },
        1200: {
            slidesPerView: 5,
        },
        992: {
            slidesPerView: 4,
        },
        768: {
            slidesPerView: 2,
        },
        576: {
            slidesPerView: 2,
        },
        0: {
            slidesPerView: 1,
        },
    },
    navigation: {
        nextEl: '.tprelated__nxt',
        prevEl: '.tprelated__prv',
    },
}

const ProductDetailsPage = () => {
  const params = useParams()
  const { productId } = params
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartSuccess, setCartSuccess] = useState(false)
  const [activeIndex, setActiveIndex] = useState(1) // For description, additional info, reviews tabs
  const [activeIndex2, setActiveIndex2] = useState(0) // For product images
  
  // Review state
  const [reviews, setReviews] = useState([])
  const [reviewFormData, setReviewFormData] = useState({
    customerName: '',
    rating: 5,
    comment: ''
  })
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  
  useEffect(() => {
    if (productId) {
      fetchProduct()
      fetchReviews()
    }
  }, [productId])
  
  useEffect(() => {
    // If user is logged in, pre-fill the name field
    const customerName = localStorage.getItem('customerName')
    if (customerName) {
      setReviewFormData(prev => ({ ...prev, customerName }))
    }
  }, [])
  
  useEffect(() => {
    // Reset activeIndex2 when product changes
    if (product && product.images && product.images.length > 0) {
      setActiveIndex2(0)
    }
  }, [product])
  
  useEffect(() => {
    // Chỉ chạy một lần sau khi component đã mount và khi activeIndex2 thay đổi
    if (typeof window !== 'undefined' && product && product.images) {
      // Cập nhật trạng thái hiển thị cho tất cả các tab-pane
      const allPanes = document.querySelectorAll('#productImageTab .tab-pane')
      allPanes.forEach(pane => {
        pane.classList.remove('show', 'active')
      })
      
      // Kích hoạt tab-pane được chọn
      const targetPane = document.querySelector(`#image-${activeIndex2}`)
      if (targetPane) {
        targetPane.classList.add('show', 'active')
      }
      
      // Cập nhật trạng thái active cho tất cả các thumbnail
      const allThumbs = document.querySelectorAll('#productThumbNav .nav-link')
      allThumbs.forEach(thumb => {
        thumb.classList.remove('active')
      })
      
      // Kích hoạt thumbnail được chọn
      const targetThumb = document.querySelector(`#productThumbNav a[href="#image-${activeIndex2}"]`)
      if (targetThumb) {
        targetThumb.classList.add('active')
      }
    }
  }, [activeIndex2, product])
  
  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.domainApi}/api/customer/products/${productId}`)
      const data = await response.json()
      console.log("du lieu chi tiet san pham", data)
      if (data) {
        setProduct(data)
      } else {
        setError(data.message || 'Failed to fetch product details')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchReviews = async () => {
    try {
      const response = await fetch(`${process.env.domainApi}/api/customer/reviews/product/${productId}`)
      const data = await response.json()

      console.log("du lieu reviews", data)
      
      if (Array.isArray(data)) {
        setReviews(data)
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    }
  }
  
  const handleQuantityChange = (change) => {
    setQuantity(prev => {
      const newValue = prev + change
      return newValue > 0 ? newValue : 1
    })
  }
  
  const handleAddToCart = async () => {
    setCartLoading(true)
    setCartSuccess(false)
    
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
          productId,
          quantity,
          productPrice: product.price,
          onSale: product.onSale,
          priceBeforeSale: product.priceBeforeSale
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCartSuccess(true)
        toast.success('Product added to cart successfully!')
        // Reset quantity
        setQuantity(1)
      } else {
        setError(data.message || 'Failed to add product to cart')
        toast.error(data.message || 'Failed to add product to cart')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setCartLoading(false)
    }
  }
  
  // Handle review form input changes
  const handleReviewChange = (e) => {
    const { name, value } = e.target
    setReviewFormData(prev => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value
    }))
  }
  
  // Submit review
  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewLoading(true)
    setReviewError('')
    setReviewSuccess(false)
    
    try {
      const response = await fetch(`${process.env.domainApi}/api/customer/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          ...reviewFormData
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setReviewSuccess(true)
        toast.success('Your review has been submitted successfully!')
        
        // Reset form
        setReviewFormData({
          customerName: reviewFormData.customerName, // Keep the name
          rating: 5,
          comment: ''
        })
        
        // Refresh reviews
        fetchReviews()
        // Refresh product to update average rating
        fetchProduct()
      } else {
        setReviewError(data.message || 'Failed to submit review')
        toast.error(data.message || 'Failed to submit review')
      }
    } catch (err) {
      setReviewError('An error occurred. Please try again.')
      toast.error('An error occurred. Please try again.')
    } finally {
      setReviewLoading(false)
    }
  }
  
  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
  }

  // Click handler to open reviews tab
  const openReviewsTab = () => {
    setActiveTab('reviews')
  }
  
  // Cập nhật hàm handleImageClick để xử lý việc chuyển đổi ảnh
  const handleImageClick = (index, e) => {
    // Ngăn chặn hành vi mặc định của thẻ a
    if (e) e.preventDefault()
    
    setActiveIndex2(index)
    
    // Sử dụng JavaScript DOM để thay đổi tab mà không cần bootstrap.Tab
    if (typeof window !== 'undefined') {
      // Cập nhật trạng thái hiển thị cho tất cả các tab-pane
      const allPanes = document.querySelectorAll('#productImageTab .tab-pane')
      allPanes.forEach(pane => {
        pane.classList.remove('show', 'active')
      })
      
      // Kích hoạt tab-pane được chọn
      const targetPane = document.querySelector(`#image-${index}`)
      if (targetPane) {
        targetPane.classList.add('show', 'active')
      }
      
      // Cập nhật trạng thái active cho tất cả các thumbnail
      const allThumbs = document.querySelectorAll('#productThumbNav .nav-link')
      allThumbs.forEach(thumb => {
        thumb.classList.remove('active')
      })
      
      // Kích hoạt thumbnail được chọn
      const targetThumb = document.querySelector(`#productThumbNav a[href="#image-${index}"]`)
      if (targetThumb) {
        targetThumb.classList.add('active')
      }
    }
  }
  
  if (loading) {
    return (
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Product Details">
        <section className="product-details-area pt-100 pb-100">
          <div className="container">
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    )
  }
  
  if (error || !product) {
    return (
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Product Details">
        <section className="product-details-area pt-100 pb-100">
          <div className="container">
            <div className="alert alert-danger" role="alert">
              {error || 'Product not found'}
            </div>
            <div className="text-center mt-30">
              <Link href="/shop" className="tp-btn">
                Return to Shop
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    )
  }

  const reviewCount = reviews.length || (product.reviews ? product.reviews.length : 0)

  return (
    <>
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle={product.name || "Product Details"}>
        <div>
          <section className="product-area pt-80 pb-25">
            <div className="container">
              <div className="row">
                <div className="col-lg-5 col-md-12">
                  <div className="tpproduct-details__nab pr-50 mb-40">
                    <div className="d-flex align-items-start">
                      <div className="nav flex-column nav-pills me-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                        {product.images && product.images.map((image, index) => (
                          <button 
                            key={index}
                            className={activeIndex2 === index ? "nav-link active" : "nav-link"} 
                            onClick={() => handleImageClick(index)}
                          >
                            <img src={image || "/assets/img/product/placeholder.jpg"} alt={`${product.name} thumbnail ${index + 1}`} />
                          </button>
                        ))}
                        {(!product.images || product.images.length === 0) && (
                          <button className="nav-link active" onClick={() => handleImageClick(0)}>
                            <img src="/assets/img/product/placeholder.jpg" alt="Default product thumbnail" />
                          </button>
                        )}
                      </div>
                      <div className="tab-content" id="v-pills-tabContent">
                        {product.images && product.images.map((image, index) => (
                          <div 
                            key={index}
                            className={activeIndex2 === index ? "tab-pane fade show active" : "tab-pane fade"}
                          >
                            <img src={image || "/assets/img/product/placeholder.jpg"} alt={`${product.name} image ${index + 1}`} />
                          </div>
                        ))}
                        {(!product.images || product.images.length === 0) && (
                          <div className="tab-pane fade show active">
                            <img src="/assets/img/product/placeholder.jpg" alt="Default product image" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-5 col-md-7">
                  <div className="tpproduct-details__content">
                    <div className="tpproduct-details__tag-area d-flex align-items-center mb-5">
                      {product.category && (
                        <span className="tpproduct-details__tag">{product.category.name}</span>
                      )}
                      <div className="tpproduct-details__rating">
                        {[1, 2, 3, 4, 5].map((star, index) => (
                          <Link key={index} href="#"><i className={`fas fa-star${star <= (product.averageRating || 0) ? '' : '-o'}`} /></Link>
                        ))}
                      </div>
                      <a className="tpproduct-details__reviewers">{reviewCount} Reviews</a>
                    </div>
                    <div className="tpproduct-details__title-area d-flex align-items-center flex-wrap mb-5">
                      <h3 className="tpproduct-details__title">{product.name}</h3>
                      <span className="tpproduct-details__stock">
                        {product.stock > 0 ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                    <div className="tpproduct-details__price mb-30">
                      {product.onSale ? (
                        <>
                          <del>${(product.priceBeforeSale || 0).toFixed(2)}</del>
                          <span>${(product.price || 0).toFixed(2)}</span>
                        </>
                      ) : (
                        <span>${(product.priceBeforeSale || product.price || 0).toFixed(2)}</span>
                      )}
                    </div>
                    <div className="tpproduct-details__pera">
                      <p>{product.description}</p>
                    </div>
                    <div className="tpproduct-details__count d-flex align-items-center flex-wrap mb-25">
                      <div className="tpproduct-details__quantity">
                        <span className="cart-minus" onClick={() => handleQuantityChange(-1)}>
                          <i className="far fa-minus" />
                        </span>
                        <input className="tp-cart-input" type="text" value={quantity} readOnly />
                        <span className="cart-plus" onClick={() => handleQuantityChange(1)}>
                          <i className="far fa-plus" />
                        </span>
                      </div>
                      <div className="tpproduct-details__cart ml-20">
                        <button 
                          onClick={handleAddToCart}
                          disabled={cartLoading || product.stock <= 0}
                        >
                          <i className="fal fa-shopping-cart" /> {cartLoading ? 'Adding...' : 'Add To Cart'}
                        </button>
                      </div>
                      <div className="tpproduct-details__wishlist ml-20">
                        <WishlistButton 
                          productId={productId} 
                          iconClass="fa-heart" 
                        />
                      </div>
                    </div>
                    
                    {/* Color dots section */}
                    {product.colors && product.colors.length > 0 && (
                      <div className="tpproductdot mb-30">
                        {product.colors.map((color, index) => (
                          <Link key={index} className="tpproductdot__variationitem" href="#">
                            <div className="tpproductdot__termshape">
                              <span 
                                className="tpproductdot__termshape-bg" 
                                style={{ backgroundColor: color.code || color }}
                              />
                              <span 
                                className="tpproductdot__termshape-border"
                                style={{ borderColor: color.code || color }}
                              />
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                    
                    {/* Product SKU */}
                    <div className="tpproduct-details__information tpproduct-details__code">
                      <p>SKU:</p><span>{product.sku || product._id || 'N/A'}</span>
                    </div>
                    
                    {/* Categories */}
                    {product.category && (
                      <div className="tpproduct-details__information tpproduct-details__categories">
                        <p>Categories:</p>
                        <span><Link href={`/shop?category=${product.category._id}`}>{product.category.name}</Link></span>
                      </div>
                    )}
                    
                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="tpproduct-details__information tpproduct-details__tags">
                        <p>Tags:</p>
                        {product.tags.map((tag, index) => (
                          <span key={index}>
                            <Link href={`/shop?tag=${tag}`}>{tag}{index < product.tags.length - 1 ? ',' : ''}</Link>
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Social sharing */}
                    <div className="tpproduct-details__information tpproduct-details__social">
                      <p>Share:</p>
                      <Link href="#"><i className="fab fa-facebook-f" /></Link>
                      <Link href="#"><i className="fab fa-twitter" /></Link>
                      <Link href="#"><i className="fab fa-behance" /></Link>
                      <Link href="#"><i className="fab fa-youtube" /></Link>
                      <Link href="#"><i className="fab fa-linkedin" /></Link>
                    </div>
                  </div>
                </div>
                <div className="col-lg-2 col-md-5">
                  <div className="tpproduct-details__condation">
                    <ul>
                      <li>
                        <div className="tpproduct-details__condation-item d-flex align-items-center">
                          <div className="tpproduct-details__condation-thumb">
                            <img src="/assets/img/icon/product-det-1.png" alt="" className="tpproduct-details__img-hover" />
                          </div>
                          <div className="tpproduct-details__condation-text">
                            <p>Free Shipping apply to all<br />orders over $100</p>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="tpproduct-details__condation-item d-flex align-items-center">
                          <div className="tpproduct-details__condation-thumb">
                            <img src="/assets/img/icon/product-det-2.png" alt="" className="tpproduct-details__img-hover" />
                          </div>
                          <div className="tpproduct-details__condation-text">
                            <p>Guranteed 100% Organic<br />from natural farmas</p>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="tpproduct-details__condation-item d-flex align-items-center">
                          <div className="tpproduct-details__condation-thumb">
                            <img src="/assets/img/icon/product-det-3.png" alt="" className="tpproduct-details__img-hover" />
                          </div>
                          <div className="tpproduct-details__condation-text">
                            <p>1 Day Returns if you change<br />your mind</p>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="tpproduct-details__condation-item d-flex align-items-center">
                          <div className="tpproduct-details__condation-thumb">
                            <img src="/assets/img/icon/product-det-4.png" alt="" className="tpproduct-details__img-hover" />
                          </div>
                          <div className="tpproduct-details__condation-text">
                            <p>Covid-19 Info: We keep<br />delivering.</p>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* product-details-area-start */}
          <div className="product-details-area">
            <div className="container">
              <div className="row">
                <div className="col-lg-12">
                  <div className="tpproduct-details__navtab mb-60">
                    <div className="tpproduct-details__nav mb-30">
                      <ul className="nav nav-tabs pro-details-nav-btn" id="myTabs" role="tablist">
                        <li className="nav-item" onClick={() => handleTabChange('description')}>
                          <button className={activeTab === 'description' ? "nav-links active" : "nav-links"}>Description</button>
                        </li>
                        <li className="nav-item" onClick={() => handleTabChange('reviews')}>
                          <button className={activeTab === 'reviews' ? "nav-links active" : "nav-links"}>Reviews ({reviewCount})</button>
                        </li>
                      </ul>
                    </div>
                    <div className="tab-content tp-content-tab" id="myTabContent-2">
                      <div className={activeTab === 'description' ? "tab-para tab-pane fade show active" : "tab-para tab-pane fade"}>
                        <p className="mb-30">{product.description}</p>
                        {product.longDescription && <p>{product.longDescription}</p>}
                      </div>
                      <div className={activeTab === 'reviews' ? "tab-pane fade show active" : "tab-pane fade"}>
                        <div className="product-details-review">
                          <h3 className="tp-comments-title mb-35">
                            {reviewCount} reviews for "{product.name}"
                          </h3>
                          <div className="latest-comments mb-55">
                            <ul>
                              {reviews.length > 0 ? (
                                reviews.map((review, index) => (
                                  <li key={index}>
                                    <div className="comments-box d-flex">
                                      <div className="comments-avatar mr-25">
                                        <img src="/assets/img/shop/reviewer-01.png" alt="Reviewer" />
                                      </div>
                                      <div className="comments-text">
                                        <div className="comments-top d-sm-flex align-items-start justify-content-between mb-5">
                                          <div className="avatar-name">
                                            <b>{review.customerName || 'Anonymous'}</b>
                                            <div className="comments-date mb-20">
                                              <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              }) : 'Unknown date'}</span>
                                            </div>
                                          </div>
                                          <div className="user-rating">
                                            <ul>
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <li key={star}>
                                                  <Link href="#">
                                                    <i className={`fa${star <= review.rating ? 's' : 'l'} fa-star`} />
                                                  </Link>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        </div>
                                        <p className="m-0">{review.comment}</p>
                                      </div>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <li>
                                  <p>No reviews yet. Be the first to review this product!</p>
                                </li>
                              )}
                            </ul>
                          </div>
                          <div className="product-details-comment">
                            <div className="comment-title mb-20">
                              <h3>Add a review</h3>
                              <p>Your email address will not be published. Required fields are marked*</p>
                            </div>
                            <div className="comment-rating mb-20 d-flex">
                              <span>Overall ratings</span>
                              <ul>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <li key={star}>
                                    <Link 
                                      href="#" 
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setReviewFormData(prev => ({...prev, rating: star}));
                                      }}
                                    >
                                      <i className={`fa${star <= reviewFormData.rating ? 's' : 'l'} fa-star`} />
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="comment-input-box">
                              <form onSubmit={handleReviewSubmit}>
                                <div className="row">
                                  <div className="col-xxl-12">
                                    <div className="comment-input">
                                      <textarea 
                                        placeholder="Your review..." 
                                        name="comment"
                                        value={reviewFormData.comment}
                                        onChange={handleReviewChange}
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="col-xxl-6">
                                    <div className="comment-input">
                                      <input 
                                        type="text" 
                                        placeholder="Your Name*" 
                                        name="customerName"
                                        value={reviewFormData.customerName}
                                        onChange={handleReviewChange}
                                        required
                                      />
                                    </div>
                                  </div>
                                  <div className="col-xxl-6">
                                    <div className="comment-input">
                                      <input type="email" placeholder="Your Email*" />
                                    </div>
                                  </div>
                                  <div className="col-xxl-12">
                                    <div className="comment-submit">
                                      <button 
                                        type="submit" 
                                        className="tp-btn pro-submit"
                                        disabled={reviewLoading}
                                      >
                                        {reviewLoading ? 'Submitting...' : 'Submit'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* product-details-area-end */}
        </div>
      </Layout>
    </>
  )
}

export default ProductDetailsPage 