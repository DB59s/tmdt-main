'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'
import './styles.css'

const RefundStatusPage = () => {
  const [formData, setFormData] = useState({
    orderId: '',
    email: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [refundData, setRefundData] = useState(null)
  const [orderData, setOrderData] = useState(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if order ID is provided in URL
  useEffect(() => {
    const id = searchParams.get('id')
    const email = searchParams.get('email')
    
    if (id) {
      setFormData(prev => ({
        ...prev,
        orderId: id,
        email: email || ''
      }))
      
      // If both ID and email are provided, fetch status automatically
      if (id && email) {
        checkRefundStatus(id, email)
      }
    }
  }, [])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!formData.orderId.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng')
      return
    }
    
    checkRefundStatus(formData.orderId, formData.email)
  }
  
  const checkRefundStatus = async (orderId, email) => {
    setLoading(true)
    setError(null)
    setRefundData(null)
    setOrderData(null)
    
    try {
      // Build URL with optional email parameter
      let url = `${process.env.domainApi}/api/customer/orders/refund-status/${orderId}`
      if (email && email.trim() !== '') {
        url += `?email=${encodeURIComponent(email)}`
      }
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        // Successful refund status check
        if (data.refundStatus) {
          setRefundData(data.refundStatus)
        }
      } else if (response.status === 404) {
        // No refund request exists but order found
        if (data.order) {
          setOrderData(data.order)
        }
        setError(data.message)
      } else {
        // Other errors
        setError(data.message)
        toast.error(data.message)
      }
    } catch (err) {
      console.error('Error checking refund status:', err)
      setError('Đã xảy ra lỗi khi kiểm tra trạng thái hoàn tiền. Vui lòng thử lại sau.')
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }
  
  // Function to get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Đang xử lý':
        return 'bg-warning'
      case 'Đã hoàn tiền':
        return 'bg-success'
      case 'Từ chối':
        return 'bg-danger'
      default:
        return 'bg-info'
    }
  }
  
  // Format date
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
  
  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Kiểm Tra Trạng Thái Hoàn Tiền">
      <section className="refund-status-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 offset-lg-2">
              {/* Search Form */}
              <div className="refund-status-form mb-50">
                <h3 className="mb-20">Kiểm Tra Trạng Thái Hoàn Tiền</h3>
                <p className="mb-30">Nhập mã đơn hàng và email (tuỳ chọn) để kiểm tra trạng thái hoàn tiền của bạn.</p>
                
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="orderId" className="form-label">Mã đơn hàng <span className="text-danger">*</span></label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="orderId" 
                          name="orderId"
                          value={formData.orderId}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email (tuỳ chọn)</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          id="email"
                          name="email" 
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="col-12">
                      <button 
                        type="submit" 
                        className="tp-btn tp-color-btn banner-animation"
                        disabled={loading}
                      >
                        {loading ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Đang kiểm tra thông tin hoàn tiền...</p>
                </div>
              )}
              
              {/* Error Message */}
              {error && !loading && !refundData && (
                <div className="alert alert-info" role="alert">
                  <p className="mb-0">{error}</p>
                  
                  {/* Show order data if available */}
                  {orderData && (
                    <div className="mt-3">
                      <h5>Thông tin đơn hàng</h5>
                      <ul className="list-unstyled">
                        <li><strong>Mã đơn hàng:</strong> {orderData.orderId}</li>
                        <li><strong>Trạng thái:</strong> {orderData.status}</li>
                        <li><strong>Số tiền:</strong> {orderData.totalAmount?.toLocaleString('vi-VN')} VND</li>
                        <li><strong>Trạng thái thanh toán:</strong> {orderData.paymentStatus}</li>
                        {orderData.cancellationReason && (
                          <li><strong>Lý do huỷ đơn:</strong> {orderData.cancellationReason}</li>
                        )}
                      </ul>
                      
                      {/* Show Create Refund Request button if eligible */}
                      {orderData.status === 'Đã hủy' && orderData.paymentStatus === 'Đã thanh toán' && (
                        <div className="mt-3">
                          <Link 
                            href={`/order-tracking?id=${orderData._id}`}
                            className="tp-btn tp-color-btn"
                          >
                            Yêu cầu hoàn tiền
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Refund Status Details */}
              {refundData && !loading && (
                <div className="refund-status-details">
                  <div className="card">
                    <div className="card-header bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <h4 className="mb-0">Thông tin yêu cầu hoàn tiền</h4>
                        <span className={`badge ${getStatusBadgeColor(refundData.status)} p-2`}>{refundData.status || 'Đang xử lý'}</span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <p><strong>Mã đơn hàng:</strong> {refundData.orderCode}</p>
                          <p><strong>Tên khách hàng:</strong> {refundData.customerName}</p>
                          <p><strong>Số tiền hoàn trả:</strong> {refundData.amount?.toLocaleString('vi-VN')} VND</p>
                        </div>
                        <div className="col-md-6">
                          <p><strong>Ngày yêu cầu:</strong> {formatDate(refundData.createdAt)}</p>
                          <p><strong>Ngày xử lý:</strong> {refundData.processedAt ? formatDate(refundData.processedAt) : 'Chưa xử lý'}</p>
                        </div>
                      </div>
                      
                      <h5 className="mb-3">Thông tin tài khoản ngân hàng</h5>
                      <div className="bg-light p-3 rounded mb-4">
                        <p><strong>Tên ngân hàng:</strong> {refundData.bankInfo.bankName}</p>
                        <p><strong>Số tài khoản:</strong> {refundData.bankInfo.accountNumber}</p>
                        <p className="mb-0"><strong>Tên chủ tài khoản:</strong> {refundData.bankInfo.accountName}</p>
                      </div>
                      
                      {refundData.notes && (
                        <div className="alert alert-info">
                          <h5 className="alert-heading">Ghi chú</h5>
                          <p className="mb-0">{refundData.notes}</p>
                        </div>
                      )}
                      
                      {/* Refund Status Timeline */}
                      <div className="refund-timeline mt-4">
                        <h5 className="mb-3">Tiến trình hoàn tiền</h5>
                        <div className="timeline">
                          <div className={`timeline-item completed`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <h6>Đã nhận yêu cầu</h6>
                              <p>Yêu cầu hoàn tiền của bạn đã được tiếp nhận.</p>
                              <small>{formatDate(refundData.createdAt)}</small>
                            </div>
                          </div>
                          
                          <div className={`timeline-item ${refundData.status !== 'Đang xử lý' ? 'completed' : ''}`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <h6>Đang xử lý</h6>
                              <p>Yêu cầu của bạn đang được xem xét và xử lý.</p>
                            </div>
                          </div>
                          
                          <div className={`timeline-item ${refundData.status === 'Đã hoàn tiền' ? 'completed' : refundData.status === 'Từ chối' ? 'canceled' : ''}`}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <h6>{refundData.status === 'Từ chối' ? 'Từ chối' : 'Hoàn tất'}</h6>
                              <p>
                                {refundData.status === 'Đã hoàn tiền' 
                                  ? 'Tiền đã được chuyển vào tài khoản của bạn.'
                                  : refundData.status === 'Từ chối'
                                  ? 'Yêu cầu hoàn tiền không được chấp nhận.'
                                  : 'Đang chờ xử lý.'}
                              </p>
                              {refundData.processedAt && <small>{formatDate(refundData.processedAt)}</small>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="d-flex justify-content-between">
                        <Link href="/" className="tp-btn">
                          Về trang chủ
                        </Link>
                        <Link href="/contact" className="tp-btn tp-color-btn">
                          Liên hệ hỗ trợ
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default RefundStatusPage 