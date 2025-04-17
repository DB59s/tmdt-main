'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'
import CancelOrderModal from '@/components/modals/CancelOrderModal'
import RefundRequestModal from '@/components/modals/RefundRequestModal'
import './styles.css'

const OrderTracking = () => {
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // State for modals
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [needsRefund, setNeedsRefund] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  
  useEffect(() => {
    // If ID is provided in URL, fetch that order
    if (id) {
      setOrderId(id)
      fetchOrder(id)
    } else {
      setLoading(false)
    }
    
    // Pre-fill email if available
    const customerEmail = localStorage.getItem('customerEmail')
    if (customerEmail) {
      setEmail(customerEmail)
    }
  }, [id])
  
  const fetchOrder = async (orderId) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${process.env.domainApi}/api/customer/orders/${orderId}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrderData(data)
      } else {
        setError(data.message || 'Failed to fetch order details')
        toast.error(data.message || 'Failed to fetch order details')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('An error occurred while fetching the order. Please try again.')
      toast.error('An error occurred while fetching the order. Please try again.')
    } finally {
      setLoading(false)
      setIsSearching(false)
    }
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!orderId.trim()) {
      toast.error('Please enter an order ID')
      return
    }
    
    // Could also validate email if needed
    
    setIsSearching(true)
    fetchOrder(orderId)
  }
  
  // Function to get status class for the timeline
  const getStatusClass = (status, orderStatus) => {
    const statusOrder = {
      'Đã đặt hàng': 1,
      'Đang xác nhận': 2,
      'Đã xác nhận': 3,
      'Đang giao hàng': 4,
      'Đã giao hàng': 5,
      'Đã hủy': 6
    }
    
    if (status === orderStatus) return 'active'
    if (statusOrder[status] < statusOrder[orderStatus]) return 'completed'
    return ''
  }
  
  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // Function to handle cancel order success
  const handleCancelSuccess = (data) => {
    // Update order data with the new canceled status
    if (orderData && orderData.order) {
      setOrderData({
        ...orderData,
        order: {
          ...orderData.order,
          status: 'Đã hủy',
          cancellationReason: data.order.cancellationReason,
          cancelledAt: data.order.cancelledAt
        }
      })
      
      // Check if refund is required (for paid orders)
      if (data.requiresRefund) {
        setNeedsRefund(true)
        setShowRefundModal(true)
      }
    }
  }
  
  // Function to handle refund request success
  const handleRefundSuccess = (data) => {
    toast.success('Yêu cầu hoàn tiền của bạn đã được ghi nhận')
    setNeedsRefund(false)
    
    // Optionally refresh order data to show refund status
    fetchOrder(orderId)
  }
  
  // Check if order is cancelable
  const isOrderCancelable = (order) => {
    if (!order) return false
    
    const nonCancelableStatuses = ['Đã giao hàng', 'Đã hủy', 'Đang giao hàng']
    return !nonCancelableStatuses.includes(order.status)
  }
  
  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Track Your Order">
      <section className="order-tracking-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              {!orderData && !loading && (
                <div className="order-tracking-form mb-50">
                  <h3 className="mb-20">Track Your Order</h3>
                  <p className="mb-30">Enter your order ID and email to track your order status.</p>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="orderId" className="form-label">Order ID <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="orderId" 
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label">Email</label>
                          <input 
                            type="email" 
                            className="form-control" 
                            id="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-12">
                        <button 
                          type="submit" 
                          className="tp-btn tp-color-btn banner-animation"
                          disabled={isSearching}
                        >
                          {isSearching ? 'Tracking...' : 'Track Order'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Fetching order details...</p>
                </div>
              )}
              
              {error && !loading && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              
              {orderData && !loading && (
                <div className="order-details">
                  <div className="order-summary bg-light p-4 rounded mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h3 className="mb-0">Order Information</h3>
                      <span className={`badge bg-${
                        orderData.order.status === 'Đã giao hàng' ? 'success' : 
                        orderData.order.status === 'Đã hủy' ? 'danger' : 'warning'
                      } p-2`}>
                        {orderData.order.status}
                      </span>
                    </div>
                    
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Order ID:</strong> {orderData.order.orderId}</p>
                        <p><strong>Date:</strong> {formatDate(orderData.order.createdAt)}</p>
                        <p><strong>Customer:</strong> {orderData.order.customerName}</p>
                        <p><strong>Email:</strong> {orderData.order.customerEmail}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Payment Method:</strong> {orderData.order.paymentMethod}</p>
                        <p><strong>Payment Status:</strong> {orderData.order.paymentStatus}</p>
                        <p><strong>Shipping Address:</strong> {orderData.order.shippingAddress}</p>
                        <p><strong>Total Amount:</strong> {orderData.order.totalAmount.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                    
                    {/* Cancellation information */}
                    {orderData.order.status === 'Đã hủy' && (
                      <div className="mt-3 p-3 border rounded bg-light">
                        <p><strong>Canceled Date:</strong> {formatDate(orderData.order.cancelDate)}</p>
                        <p><strong>Cancellation Reason:</strong> {orderData.order.cancellationReason || 'No reason provided'}</p>
                        
                        {/* Show refund request button for paid orders */}
                        {orderData.order.paymentStatus === 'Đã thanh toán' && needsRefund && (
                          <div className="mt-2">
                            <button 
                              className="tp-btn tp-color-btn btn-sm"
                              onClick={() => setShowRefundModal(true)}
                            >
                              Yêu cầu hoàn tiền
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Order Timeline */}
                  <div className="order-timeline mb-4">
                    <h4 className="mb-3">Order Status</h4>
                    <div className="timeline">
                      <div className={`timeline-item ${getStatusClass('Đã đặt hàng', orderData.order.status)}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h5>Order Placed</h5>
                          <p>Your order has been placed successfully.</p>
                        </div>
                      </div>
                      <div className={`timeline-item ${getStatusClass('Đang xác nhận', orderData.order.status)}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h5>Processing</h5>
                          <p>Your order is being processed and verified.</p>
                        </div>
                      </div>
                      <div className={`timeline-item ${getStatusClass('Đã xác nhận', orderData.order.status)}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h5>Confirmed</h5>
                          <p>Your order has been confirmed and is being prepared.</p>
                        </div>
                      </div>
                      <div className={`timeline-item ${getStatusClass('Đang giao hàng', orderData.order.status)}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h5>Shipping</h5>
                          <p>Your order is on the way to you.</p>
                        </div>
                      </div>
                      <div className={`timeline-item ${getStatusClass('Đã giao hàng', orderData.order.status)}`}>
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h5>Delivered</h5>
                          <p>Your order has been delivered.</p>
                        </div>
                      </div>
                      {orderData.order.status === 'Đã hủy' && (
                        <div className="timeline-item canceled active">
                          <div className="timeline-dot"></div>
                          <div className="timeline-content">
                            <h5>Canceled</h5>
                            <p>Your order has been canceled.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div className="order-items mb-4">
                    <h4 className="mb-3">Order Items</h4>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderData.orderItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  {item.productId?.images?.[0] && (
                                    <img 
                                      src={item.productId.images[0]} 
                                      alt={item.productId.name} 
                                      className="img-thumbnail me-2" 
                                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                  )}
                                  <div>{item.productId?.name || 'Product'}</div>
                                </div>
                              </td>
                              <td>{item.quantity}</td>
                              <td>{item.price.toLocaleString('vi-VN')}đ</td>
                              <td>{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th colSpan="3" className="text-end">Subtotal:</th>
                            <td>{orderData.order.totalAmount.toLocaleString('vi-VN')}đ</td>
                          </tr>
                          <tr>
                            <th colSpan="3" className="text-end">Total:</th>
                            <td><strong>{orderData.order.totalAmount.toLocaleString('vi-VN')}đ</strong></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  
                  <div className="buttons mt-4">
                    <Link href="/shop" className="tp-btn mr-3">
                      Continue Shopping
                    </Link>
                    
                    {isOrderCancelable(orderData.order) && (
                      <button 
                        className="tp-btn tp-color-btn"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Cancel Order
                      </button>
                    )}
                    
                    {/* Show refund request button for canceled paid orders */}
                    {orderData.order.status === 'Đã hủy' && 
                     orderData.order.paymentStatus === 'Đã thanh toán' && (
                      <div className="mt-3">
                        <button 
                          className="tp-btn tp-color-btn mb-2 me-2"
                          onClick={() => setShowRefundModal(true)}
                        >
                          Yêu cầu hoàn tiền
                        </button>
                        <Link 
                          href={`/refund-status?id=${orderData.order._id}&email=${orderData.order.customerEmail}`} 
                          className="tp-btn tp-color-btn"
                        >
                          Kiểm tra trạng thái hoàn tiền
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Modals */}
      {orderData && (
        <>
          <CancelOrderModal 
            show={showCancelModal}
            handleClose={() => setShowCancelModal(false)}
            orderId={orderData.order._id}
            onCancelSuccess={handleCancelSuccess}
          />
          
          <RefundRequestModal
            show={showRefundModal}
            handleClose={() => setShowRefundModal(false)}
            order={orderData.order}
            onRefundSuccess={handleRefundSuccess}
          />
        </>
      )}
    </Layout>
  )
}

export default OrderTracking 