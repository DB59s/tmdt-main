'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'

const MyReturnsPage = () => {
  const [returnRequests, setReturnRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReturnRequests()
  }, [])

  const fetchReturnRequests = async () => {
    setLoading(true)
    try {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) {
        toast.error('You need to be logged in to view your return requests')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/return-requests/customer/${customerId}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Error fetching return requests: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data && data.success) {
        setReturnRequests(data.data)
      } else {
        setReturnRequests([])
      }
    } catch (err) {
      console.error('Failed to fetch return requests:', err)
      setError('Failed to load return requests. Please try again later.')
    } finally {
      setLoading(false)
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRequestTypeLabel = (type) => {
    return type === 'exchange' ? 'Đổi hàng' : 'Hoàn tiền'
  }

  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Quản lý đổi/trả hàng">
      <div className="return-requests-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3>Yêu cầu đổi/trả hàng của bạn</h3>
                <div>
                  <Link href="/my-returns/create" className="btn btn-primary btn-sm">
                    <i className="fa fa-plus me-1"></i> Tạo yêu cầu mới
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              ) : returnRequests.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <i className="fa fa-exchange-alt fa-4x text-muted"></i>
                  </div>
                  <p className="mb-4">Bạn chưa có yêu cầu đổi/trả hàng nào</p>
                  <div>
                    <Link href="/my-order" className="btn btn-outline-primary me-2">
                      <i className="fa fa-shopping-bag me-1"></i> Xem đơn hàng của tôi
                    </Link>
                    <Link href="/my-returns/create" className="btn btn-primary">
                      <i className="fa fa-plus me-1"></i> Tạo yêu cầu mới
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Mã yêu cầu</th>
                        <th>Đơn hàng</th>
                        <th>Loại yêu cầu</th>
                        <th>Ngày tạo</th>
                        <th>Trạng thái</th>
                        <th>Số tiền hoàn trả</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnRequests.map((request) => (
                        <tr key={request._id}>
                          <td>
                            <Link href={`/my-returns/${request._id}`} className="text-primary">
                              #{request._id.substring(request._id.length - 8)}
                            </Link>
                          </td>
                          <td>
                            {request.orderId ? (
                              <Link href={`/my-orders/${request.orderId._id}`} className="text-primary">
                                #{request.orderId.orderId}
                              </Link>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{getRequestTypeLabel(request.requestType)}</td>
                          <td>{formatDate(request.createdAt)}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                              {request.status === 'pending' ? 'Đang chờ xử lý' : 
                               request.status === 'approved' ? 'Đã duyệt' :
                               request.status === 'processing' ? 'Đang xử lý' :
                               request.status === 'completed' ? 'Hoàn thành' :
                               request.status === 'rejected' ? 'Từ chối' : request.status}
                            </span>
                          </td>
                          <td>${request.totalRefundAmount?.toFixed(2) || '0.00'}</td>
                          <td>
                            <Link href={`/my-returns/${request._id}`} className="btn btn-sm btn-info me-2">
                              <i className="fa fa-eye"></i>
                            </Link>
                            {request.status === 'pending' && (
                              <Link href={`/my-returns/${request._id}/edit`} className="btn btn-sm btn-primary me-2">
                                <i className="fa fa-edit"></i>
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default MyReturnsPage 