'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'

const CreateReturnRequest = () => {
  const router = useRouter()
  
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [selectedOrderItems, setSelectedOrderItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [imageLoading, setImageLoading] = useState(false)

  const [formData, setFormData] = useState({
    orderId: '',
    requestType: 'exchange',
    reason: '',
    items: [],
    refundInfo: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    }
  })

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const customerId = localStorage.getItem('customerId')
      if (!customerId) {
        toast.error('Bạn cần đăng nhập để tạo yêu cầu đổi/trả hàng')
        router.push('/login')
        return
      }

      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/orders/filter/filter?customerId=${customerId}&page=1&limit=100&status=Đã%20giao%20hàng`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Error fetching orders: ${response.statusText}`)
      }

      const data = await response.json()

      console.log(data)
      
      if (data) {
        setOrders(data.data.orders || [])
      } else {
        setOrders([])
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetails = async (orderId) => {
    try {
      const token = localStorage.getItem('token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`${process.env.domainApi}/api/customer/orders/${orderId}`, {
        headers
      })

      if (!response.ok) {
        throw new Error(`Error fetching order details: ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log("data", data)
      
      if (data) {
        // Set order data from the nested structure
        setSelectedOrder(data.order)
        
        // Check if orderItems exists and has items
        if (data.orderItems && data.orderItems.length > 0) {
          // Map items to include return details
          const mappedItems = data.orderItems.map(item => ({
            ...item,
            selected: false,
            returnQuantity: 0,
            returnReason: ''
          }))
          setSelectedOrderItems(mappedItems)
        } else {
          setSelectedOrderItems([])
        }
      }
    } catch (err) {
      console.error('Failed to fetch order details:', err)
      toast.error('Không thể tải chi tiết đơn hàng. Vui lòng thử lại sau.')
    }
  }

  const handleOrderChange = (e) => {
    const orderId = e.target.value
    setFormData({
      ...formData,
      orderId: orderId,
      items: []
    })
    
    if (orderId) {
      fetchOrderDetails(orderId)
    } else {
      setSelectedOrder(null)
      setSelectedOrderItems([])
    }
  }

  const handleRequestTypeChange = (e) => {
    setFormData({
      ...formData,
      requestType: e.target.value
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleRefundInfoChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      refundInfo: {
        ...formData.refundInfo,
        [name]: value
      }
    })
  }

  const handleItemSelection = (index, isSelected) => {
    const updatedItems = [...selectedOrderItems]
    updatedItems[index].selected = isSelected
    if (isSelected) {
      updatedItems[index].returnQuantity = updatedItems[index].quantity
    } else {
      updatedItems[index].returnQuantity = 0
      updatedItems[index].returnReason = ''
    }
    setSelectedOrderItems(updatedItems)
  }

  const handleItemQuantityChange = (index, quantity) => {
    const updatedItems = [...selectedOrderItems]
    updatedItems[index].returnQuantity = parseInt(quantity, 10)
    setSelectedOrderItems(updatedItems)
  }

  const handleItemReasonChange = (index, reason) => {
    const updatedItems = [...selectedOrderItems]
    updatedItems[index].returnReason = reason
    setSelectedOrderItems(updatedItems)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles(prev => [...prev, ...files])

    // Create preview URLs
    const newImageUrls = files.map(file => URL.createObjectURL(file))
    setImageUrls(prev => [...prev, ...newImageUrls])
  }

  const removeImage = (index) => {
    // Release object URL to avoid memory leaks
    URL.revokeObjectURL(imageUrls[index])
    
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setImageUrls(prev => prev.filter((_, i) => i !== index))
  }

  const uploadImages = async () => {
    if (imageFiles.length === 0) return []
    
    setImageLoading(true)
    try {
      const uploaders = imageFiles.map(file => {
        const formData = new FormData()
        formData.append('image', file)
        
        return fetch(`${process.env.domainApi}/api/upload`, {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          if (data.success && data.file && data.file.url) {
            return data.file.url;
          } else {
            throw new Error(data.message || 'Upload failed');
          }
        })
      })
      
      const uploadedImageUrls = await Promise.all(uploaders)
      setImageLoading(false)
      return uploadedImageUrls
    } catch (error) {
      console.error('Failed to upload images:', error)
      setImageLoading(false)
      throw new Error('Không thể tải lên hình ảnh. Vui lòng thử lại sau.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.orderId) {
      toast.error('Vui lòng chọn đơn hàng')
      return
    }
    
    if (!formData.reason) {
      toast.error('Vui lòng nhập lý do đổi/trả')
      return
    }
    
    // Check if any items are selected
    const selectedItems = selectedOrderItems.filter(item => item.selected && item.returnQuantity > 0)
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để đổi/trả')
      return
    }
    
    // Check if at least one image is attached
    if (imageFiles.length === 0) {
      toast.error('Vui lòng đính kèm ít nhất một hình ảnh')
      return
    }
    
    // Check if refund info is provided for refund request
    if (formData.requestType === 'refund') {
      const { bankName, accountNumber, accountHolder } = formData.refundInfo
      if (!bankName || !accountNumber || !accountHolder) {
        toast.error('Vui lòng nhập đầy đủ thông tin hoàn tiền')
        return
      }
    }

    setSubmitting(true)
    try {
      // Upload images
      let uploadedImageUrls = []
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages()
      }
      
      // Prepare items data
      const returnItems = selectedItems.map(item => {
        // Handle different possible shapes of productId
        let productIdValue = null;
        if (typeof item.productId === 'object' && item.productId !== null) {
          productIdValue = item.productId._id;
        } else {
          productIdValue = item.productId;
        }
        
        return {
          productId: productIdValue,
          quantity: item.returnQuantity,
          returnReason: item.returnReason,
          price: item.price
        };
      });
      
      // Prepare request data
      const requestData = {
        orderId: formData.orderId,
        requestType: formData.requestType,
        reason: formData.reason,
        items: returnItems,
        images: uploadedImageUrls
      }
      
      // Add refund info for refund requests
      if (formData.requestType === 'refund') {
        requestData.refundInfo = formData.refundInfo
      }
      
      // Submit request
      const token = localStorage.getItem('token')
      const headers = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(`${process.env.domainApi}/api/customer/return-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Yêu cầu đổi/trả hàng đã được tạo thành công')
        router.push('/my-returns')
      } else {
        toast.error(data.message || 'Không thể tạo yêu cầu đổi/trả hàng')
      }
    } catch (err) {
      console.error('Failed to create return request:', err)
      toast.error('Đã xảy ra lỗi khi tạo yêu cầu đổi/trả hàng. Vui lòng thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && orders.length === 0) {
    return (
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Tạo yêu cầu đổi/trả hàng">
        <div className="create-return-area pt-80 pb-80">
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

  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Tạo yêu cầu đổi/trả hàng">
      <div className="create-return-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <h3>Tạo yêu cầu đổi/trả hàng</h3>
                <div>
                  <Link href="/my-returns" className="btn btn-outline-primary btn-sm">
                    <i className="fa fa-arrow-left me-1"></i> Quay lại
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="alert alert-info" role="alert">
              <p className="mb-3">Bạn không có đơn hàng nào đã giao có thể yêu cầu đổi/trả.</p>
              <Link href="/my-order" className="btn btn-primary btn-sm">
                <i className="fa fa-shopping-bag me-1"></i> Xem đơn hàng của tôi
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-lg-8">
                  {/* Thông tin cơ bản */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Thông tin cơ bản</h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <label htmlFor="orderId" className="form-label">Đơn hàng <span className="text-danger">*</span></label>
                        <select 
                          id="orderId" 
                          name="orderId" 
                          className="form-select" 
                          value={formData.orderId} 
                          onChange={handleOrderChange}
                          required
                        >
                          <option value="">Chọn đơn hàng</option>
                          {orders.map(order => (
                            <option key={order._id} value={order._id}>
                              #{order.orderId} - {new Date(order.orderDate || order.createdAt).toLocaleDateString()} - ${order.totalAmount.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Loại yêu cầu <span className="text-danger">*</span></label>
                        <div className="d-flex">
                          <div className="form-check me-4">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="requestType" 
                              id="requestTypeExchange" 
                              value="exchange" 
                              checked={formData.requestType === 'exchange'} 
                              onChange={handleRequestTypeChange}
                            />
                            <label className="form-check-label" htmlFor="requestTypeExchange">
                              Đổi hàng
                            </label>
                          </div>
                          <div className="form-check">
                            <input 
                              className="form-check-input" 
                              type="radio" 
                              name="requestType" 
                              id="requestTypeRefund" 
                              value="refund" 
                              checked={formData.requestType === 'refund'} 
                              onChange={handleRequestTypeChange}
                            />
                            <label className="form-check-label" htmlFor="requestTypeRefund">
                              Hoàn tiền
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label htmlFor="reason" className="form-label">Lý do đổi/trả hàng <span className="text-danger">*</span></label>
                        <textarea 
                          id="reason" 
                          name="reason" 
                          className="form-control" 
                          rows="3" 
                          placeholder="Vui lòng mô tả lý do đổi/trả hàng" 
                          value={formData.reason} 
                          onChange={handleInputChange}
                          required
                        ></textarea>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Hình ảnh đính kèm <span className="text-danger">*</span></label>
                        <div className="input-group mb-3">
                          <input 
                            type="file" 
                            className="form-control" 
                            id="images" 
                            accept="image/*" 
                            multiple 
                            onChange={handleImageChange}
                          />
                          <label className="input-group-text" htmlFor="images">Tải lên</label>
                        </div>
                        <small className="text-muted d-block mb-2">
                          Tải lên hình ảnh cho sản phẩm cần đổi/trả (tối đa 5 hình, mỗi hình không quá 5MB). Cần ít nhất một hình ảnh.
                        </small>

                        {imageUrls.length > 0 && (
                          <div className="image-preview-container d-flex flex-wrap">
                            {imageUrls.map((url, index) => (
                              <div key={index} className="image-preview-item position-relative me-2 mb-2">
                                <img 
                                  src={url} 
                                  alt={`Preview ${index}`} 
                                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                  className="border rounded"
                                />
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger position-absolute"
                                  style={{ top: '5px', right: '5px', padding: '0.1rem 0.4rem' }}
                                  onClick={() => removeImage(index)}
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Danh sách sản phẩm */}
                  {selectedOrder && (
                    <div className="card mb-4">
                      <div className="card-header bg-light">
                        <h5 className="mb-0">Sản phẩm đổi/trả</h5>
                      </div>
                      <div className="card-body">
                        {selectedOrderItems.length === 0 ? (
                          <div className="text-center py-4">
                            <p className="text-muted">Không có sản phẩm nào trong đơn hàng</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table">
                              <thead>
                                <tr>
                                  <th style={{ width: '50px' }}></th>
                                  <th>Sản phẩm</th>
                                  <th>Giá</th>
                                  <th>Số lượng</th>
                                  <th>Số lượng đổi/trả</th>
                                  <th>Lý do</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedOrderItems.map((item, index) => (
                                  <tr key={index}>
                                    <td>
                                      <div className="form-check">
                                        <input 
                                          className="form-check-input" 
                                          type="checkbox" 
                                          id={`item-${index}`} 
                                          checked={item.selected} 
                                          onChange={(e) => handleItemSelection(index, e.target.checked)}
                                        />
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="me-3">
                                          <img 
                                            src={item.productId?.thumbnail || "/assets/img/product/placeholder.jpg"} 
                                            alt={item.productId?.title || "Product"} 
                                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                          />
                                        </div>
                                        <div>
                                          <p className="mb-0">{item.productId?.title || "Unknown Product"}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td>${item.price?.toFixed(2) || '0.00'}</td>
                                    <td>{item.quantity}</td>
                                    <td>
                                      <input 
                                        type="number" 
                                        className="form-control form-control-sm" 
                                        min="1" 
                                        max={item.quantity}
                                        value={item.returnQuantity} 
                                        onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                                        disabled={!item.selected}
                                      />
                                    </td>
                                    <td>
                                      <input 
                                        type="text" 
                                        className="form-control form-control-sm" 
                                        placeholder="Lý do đổi/trả" 
                                        value={item.returnReason} 
                                        onChange={(e) => handleItemReasonChange(index, e.target.value)}
                                        disabled={!item.selected}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-lg-4">
                  {/* Thông tin hoàn tiền (nếu là yêu cầu hoàn tiền) */}
                  {formData.requestType === 'refund' && (
                    <div className="card mb-4">
                      <div className="card-header bg-light">
                        <h5 className="mb-0">Thông tin hoàn tiền</h5>
                      </div>
                      <div className="card-body">
                        <div className="mb-3">
                          <label htmlFor="bankName" className="form-label">Tên ngân hàng <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="bankName" 
                            name="bankName" 
                            placeholder="Nhập tên ngân hàng" 
                            value={formData.refundInfo.bankName} 
                            onChange={handleRefundInfoChange}
                            required={formData.requestType === 'refund'}
                          />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="accountNumber" className="form-label">Số tài khoản <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="accountNumber" 
                            name="accountNumber" 
                            placeholder="Nhập số tài khoản" 
                            value={formData.refundInfo.accountNumber} 
                            onChange={handleRefundInfoChange}
                            required={formData.requestType === 'refund'}
                          />
                        </div>

                        <div className="mb-3">
                          <label htmlFor="accountHolder" className="form-label">Chủ tài khoản <span className="text-danger">*</span></label>
                          <input 
                            type="text" 
                            className="form-control" 
                            id="accountHolder" 
                            name="accountHolder" 
                            placeholder="Nhập tên chủ tài khoản" 
                            value={formData.refundInfo.accountHolder} 
                            onChange={handleRefundInfoChange}
                            required={formData.requestType === 'refund'}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tổng quan */}
                  <div className="card mb-4">
                    <div className="card-header bg-light">
                      <h5 className="mb-0">Tổng quan</h5>
                    </div>
                    <div className="card-body">
                      <div className="d-grid">
                        <button 
                          type="submit" 
                          className="btn btn-primary"
                          disabled={submitting || imageLoading}
                        >
                          {submitting || imageLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Đang xử lý...
                            </>
                          ) : (
                            'Gửi yêu cầu'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CreateReturnRequest 