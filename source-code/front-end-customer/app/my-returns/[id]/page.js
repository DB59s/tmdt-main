'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'
import Image from 'next/image'

const ReturnRequestDetail = () => {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  
  const [returnRequest, setReturnRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [canceling, setCanceling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchReturnRequestDetails()
    }
  }, [id])

  const fetchReturnRequestDetails = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/return-requests/${id}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Error fetching return request details: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data && data.success) {
        setReturnRequest(data.data)
      } else {
        setError('Failed to load return request details')
      }
    } catch (err) {
      console.error('Failed to fetch return request details:', err)
      setError('Failed to load return request details. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelRequest = async (e) => {
    e.preventDefault()
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy yêu cầu')
      return
    }

    setCanceling(true)
    try {
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/return-requests/${id}/cancel`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: cancelReason })
      })

      if (!response.ok) {
        throw new Error(`Error canceling return request: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data && data.success) {
        toast.success('Yêu cầu đổi/trả hàng đã được hủy thành công')
        setShowCancelModal(false)
        fetchReturnRequestDetails()
      } else {
        toast.error(data.message || 'Không thể hủy yêu cầu')
      }
    } catch (err) {
      console.error('Failed to cancel return request:', err)
      toast.error('Đã xảy ra lỗi khi hủy yêu cầu. Vui lòng thử lại sau.')
    } finally {
      setCanceling(false)
    }
  }

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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning'
      case 'approved':
        return 'bg-success'
      case 'processing':
        return 'bg-info'
      case 'completed':
        return 'bg-primary'
      case 'rejected':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ xử lý'
      case 'approved':
        return 'Đã duyệt'
      case 'processing':
        return 'Đang xử lý'
      case 'completed':
        return 'Hoàn thành'
      case 'rejected':
        return 'Từ chối'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Chi tiết yêu cầu đổi/trả hàng">
        <div className="return-details-area pt-80 pb-80">
          <div className="container">
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (error || !returnRequest) {
    return (
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Chi tiết yêu cầu đổi/trả hàng">
        <div className="return-details-area pt-80 pb-80">
          <div className="container">
            <div className="alert alert-danger" role="alert">
              {error || 'Không tìm thấy yêu cầu đổi/trả hàng'}
            </div>
            <div className="text-center mt-4">
              <Link href="/my-returns" className="btn btn-primary">
                <i className="fa fa-arrow-left me-2"></i> Quay lại danh sách
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Chi tiết yêu cầu đổi/trả hàng">
      <div className="return-details-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <h3>
                  Chi tiết yêu cầu đổi/trả hàng{' '}
                  <span className="text-muted">#{id.substring(id.length - 8)}</span>
                </h3>
                <div>
                  <Link href="/my-returns" className="btn btn-outline-primary btn-sm me-2">
                    <i className="fa fa-arrow-left me-1"></i> Quay lại
                  </Link>
                  {returnRequest.status === 'pending' && (
                    <>
                      <Link href={`/my-returns/${id}/edit`} className="btn btn-primary btn-sm me-2">
                        <i className="fa fa-edit me-1"></i> Chỉnh sửa
                      </Link>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => setShowCancelModal(true)}
                      >
                        <i className="fa fa-times-circle me-1"></i> Hủy yêu cầu
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-8">
              {/* Thông tin cơ bản */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Thông tin yêu cầu</h5>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-4 text-muted">Loại yêu cầu:</div>
                    <div className="col-md-8">
                      {returnRequest.requestType === 'exchange' ? 'Đổi hàng' : 'Hoàn tiền'}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4 text-muted">Trạng thái:</div>
                    <div className="col-md-8">
                      <span className={`badge ${getStatusBadgeClass(returnRequest.status)}`}>
                        {getStatusLabel(returnRequest.status)}
                      </span>
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4 text-muted">Ngày tạo:</div>
                    <div className="col-md-8">{formatDate(returnRequest.createdAt)}</div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4 text-muted">Đơn hàng:</div>
                    <div className="col-md-8">
                      {returnRequest.orderId ? (
                        <Link href={`/my-orders/${returnRequest.orderId._id}`} className="text-primary">
                          #{returnRequest.orderId.orderId}
                        </Link>
                      ) : (
                        'N/A'
                      )}
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4 text-muted">Lý do đổi/trả:</div>
                    <div className="col-md-8">{returnRequest.reason}</div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-4 text-muted">Tổng tiền hoàn trả:</div>
                    <div className="col-md-8">${returnRequest.totalRefundAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Sản phẩm đổi/trả</h5>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Sản phẩm</th>
                          <th>Số lượng</th>
                          <th>Giá</th>
                          <th>Lý do</th>
                          <th>Tổng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnRequest.items && returnRequest.items.map((item, index) => (
                          <tr key={index}>
                            <td>
                              <div className="d-flex align-items-center">
                                {item.productId && (
                                  <>
                                    <div className="me-3">
                                      <img 
                                        src={item.productId.thumbnail || "/assets/img/product/placeholder.jpg"}
                                        alt={item.productId.title}
                                        width={60}
                                        height={60}
                                        style={{ objectFit: 'contain' }}
                                      />
                                    </div>
                                    <div>
                                      <Link href={`/shop-details/${item.productId._id}`} className="text-primary">
                                        {item.productId.title}
                                      </Link>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>${item.price?.toFixed(2) || '0.00'}</td>
                            <td>{item.returnReason || '-'}</td>
                            <td>${(item.price * item.quantity).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Hình ảnh sản phẩm */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Hình ảnh đính kèm</h5>
                </div>
                <div className="card-body">
                  {returnRequest.images && returnRequest.images.length > 0 ? (
                    <div className="row">
                      {returnRequest.images.map((image, index) => (
                        <div className="col-md-3 mb-3" key={index}>
                          <a href={image} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={image} 
                              alt={`Image ${index + 1}`} 
                              className="img-thumbnail" 
                              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                            />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted py-4">Không có hình ảnh đính kèm</div>
                  )}
                </div>
              </div>

              {/* Lịch sử trạng thái */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Lịch sử trạng thái</h5>
                </div>
                <div className="card-body">
                  <ul className="timeline">
                    {returnRequest.statusHistory && returnRequest.statusHistory.map((history, index) => (
                      <li key={index} className="timeline-item mb-4">
                        <div className="timeline-marker">
                          <span className={`badge ${getStatusBadgeClass(history.status)}`}>
                            {getStatusLabel(history.status)}
                          </span>
                        </div>
                        <div className="timeline-content">
                          <div className="d-flex justify-content-between">
                            <p className="mb-0">{history.note}</p>
                            <p className="text-muted mb-0">{formatDate(history.updatedAt)}</p>
                          </div>
                          <p className="text-muted mb-0">
                            Cập nhật bởi: {history.updatedBy === 'customer' ? 'Khách hàng' : 'Nhân viên'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {/* Thông tin khách hàng */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h5 className="mb-0">Thông tin khách hàng</h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="text-muted">Tên:</div>
                    <div>{returnRequest.customerName}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted">Email:</div>
                    <div>{returnRequest.customerEmail}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-muted">Số điện thoại:</div>
                    <div>{returnRequest.customerPhone}</div>
                  </div>
                </div>
              </div>

              {/* Thông tin hoàn tiền (nếu là yêu cầu hoàn tiền) */}
              {returnRequest.requestType === 'refund' && returnRequest.refundInfo && (
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Thông tin hoàn tiền</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <div className="text-muted">Ngân hàng:</div>
                      <div>{returnRequest.refundInfo.bankName}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted">Số tài khoản:</div>
                      <div>{returnRequest.refundInfo.accountNumber}</div>
                    </div>
                    <div className="mb-3">
                      <div className="text-muted">Chủ tài khoản:</div>
                      <div>{returnRequest.refundInfo.accountHolder}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions section */}
          <div className="card mb-4">
            <div className="card-header bg-light">
              <h5 className="mb-0">Thao tác</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                {returnRequest.status === 'pending' && (
                  <>
                    <Link href={`/my-returns/${id}/edit`} className="btn btn-outline-primary">
                      <i className="fa fa-edit me-2"></i> Chỉnh sửa yêu cầu
                    </Link>
                    <button 
                      className="btn btn-outline-danger" 
                      onClick={() => setShowCancelModal(true)}
                    >
                      <i className="fa fa-times-circle me-2"></i> Hủy yêu cầu
                    </button>
                  </>
                )}
                <Link href="/my-returns" className="btn btn-outline-secondary">
                  <i className="fa fa-arrow-left me-2"></i> Quay lại danh sách
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal hủy yêu cầu */}
      {showCancelModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Hủy yêu cầu đổi/trả hàng</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCancelModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCancelRequest}>
                <div className="modal-body">
                  <div className="form-group mb-3">
                    <label htmlFor="cancelReason" className="form-label">Lý do hủy yêu cầu <span className="text-danger">*</span></label>
                    <textarea 
                      id="cancelReason"
                      className="form-control" 
                      rows="3"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      required
                      placeholder="Vui lòng nhập lý do hủy yêu cầu đổi/trả hàng"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowCancelModal(false)}
                    disabled={canceling}
                  >
                    Đóng
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-danger"
                    disabled={canceling}
                  >
                    {canceling ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận hủy'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default ReturnRequestDetail 