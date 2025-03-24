'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'
import './styles.css'

const MyOrders = () => {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({})
  const [activeTab, setActiveTab] = useState('all')
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  })

  // Trạng thái đơn hàng hợp lệ
  const validStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy']
  
  // Lấy customerId từ localStorage khi component mount
  useEffect(() => {
    const customerId = localStorage.getItem('customerId')
    if (!customerId) {
      toast.error('Bạn cần đăng nhập để xem đơn hàng')
      router.push('/login')
    } else {
      fetchOrders(customerId)
    }
  }, [router])

  // Hàm fetch danh sách đơn hàng với filter
  const fetchOrders = async (customerId, status = '', page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      let url = `${process.env.domainApi}/api/customer/orders/filter/filter?customerId=${customerId}&page=${page}&limit=10`
      if (status && status !== 'all') {
        url += `&status=${status}`
      }
      
      console.log('Fetching orders from URL:', url)
      const response = await fetch(url)
      const data = await response.json()
      console.log('API response:', data)
      
      if (response.ok) {
        setOrders(data.data.orders)
        setPagination(data.data.pagination)
        
        // Xử lý dữ liệu summary
        const statusSummary = {...data.data.summary}
        console.log('Original summary data:', statusSummary)
        
        // Tính tổng số đơn hàng từ summary
        let total = 0
        Object.values(statusSummary).forEach(count => {
          total += count
        })
        
        // Thêm tổng số vào summary
        const updatedSummary = {...statusSummary, total: total}
        console.log('Updated summary with total:', updatedSummary)
        setSummary(updatedSummary)
      } else {
        setError(data.message || 'Không thể lấy danh sách đơn hàng')
        toast.error(data.message || 'Không thể lấy danh sách đơn hàng')
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error)
      setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.')
      toast.error('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  // Xử lý khi click vào tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    const customerId = localStorage.getItem('customerId')
    const status = tab === 'all' ? '' : tab
    fetchOrders(customerId, status)
  }

  // Xử lý phân trang
  const handlePageChange = (page) => {
    const customerId = localStorage.getItem('customerId')
    const status = activeTab === 'all' ? '' : activeTab
    fetchOrders(customerId, status, page)
  }
  
  // Format ngày giờ
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

  // Xác định màu cho badge trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã giao hàng':
        return 'success'
      case 'Đã hủy':
        return 'danger'
      case 'Đang giao hàng':
        return 'info'
      default:
        return 'warning'
    }
  }

  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Đơn hàng của tôi">
      <section className="my-orders-area pt-80 pb-80">
        <div className="container">
          {/* Thông báo lỗi */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Tab trạng thái */}
          <div className="order-tabs mb-4">
            <ul className="nav nav-tabs" id="orderTab" role="tablist">
              <li className="nav-item" role="presentation">
                <button 
                  className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => handleTabChange('all')}
                >
                  Tất cả ({summary.total || 0})
                </button>
              </li>
              {validStatuses.map((status) => (
                <li key={status} className="nav-item" role="presentation">
                  <button 
                    className={`nav-link ${activeTab === status ? 'active' : ''}`}
                    onClick={() => handleTabChange(status)}
                  >
                    {status} ({summary[status] || 0})
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Danh sách đơn hàng */}
          <div className="order-list">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Đang tải...</span>
                </div>
                <p className="mt-2">Đang tải danh sách đơn hàng...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-5">
                <div className="empty-orders">
                  <i className="fas fa-shopping-bag fa-3x mb-3 text-muted"></i>
                  <h4>Không có đơn hàng nào</h4>
                  <p>Bạn chưa có đơn hàng nào trong mục này</p>
                  <Link href="/shop" className="tp-btn mt-3">
                    Tiếp tục mua sắm
                  </Link>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Mã đơn hàng</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái đơn hàng</th>
                      <th>Trạng thái thanh toán</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderId}</td>
                        <td>{formatDate(order.createdAt)}</td>
                        <td>${order.totalAmount.toFixed(2)}</td>
                        <td>
                          <span className={`badge bg-${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${order.paymentStatus === 'Đã thanh toán' ? 'success' : 'secondary'}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <Link 
                            href={`/order-tracking?id=${order._id}`}
                            className="tp-btn tp-btn-small"
                          >
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Phân trang */}
          {!loading && orders.length > 0 && (
            <div className="pagination-wrapper mt-4">
              <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Trước
                    </button>
                  </li>
                  
                  {[...Array(pagination.totalPages).keys()].map(num => (
                    <li key={num + 1} className={`page-item ${pagination.page === num + 1 ? 'active' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(num + 1)}
                      >
                        {num + 1}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Sau
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}

export default MyOrders
