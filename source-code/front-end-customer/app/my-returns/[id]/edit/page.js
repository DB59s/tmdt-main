'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import { toast } from 'react-toastify'

const EditReturnRequest = () => {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  
  const [returnRequest, setReturnRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [imageLoading, setImageLoading] = useState(false)

  const [formData, setFormData] = useState({
    reason: '',
    items: [],
    refundInfo: {
      bankName: '',
      accountNumber: '',
      accountHolder: ''
    }
  })

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
        const request = data.data
        
        // Check if request is not in pending status
        if (request.status !== 'pending') {
          toast.error('Chỉ có thể chỉnh sửa yêu cầu đang chờ xử lý')
          router.push(`/my-returns/${id}`)
          return
        }
        
        setReturnRequest(request)
        setExistingImages(request.images || [])
        
        // Set form data
        setFormData({
          reason: request.reason || '',
          items: request.items.map(item => ({
            productId: item.productId._id || item.productId,
            quantity: item.quantity,
            returnReason: item.returnReason || ''
          })),
          refundInfo: request.refundInfo || {
            bankName: '',
            accountNumber: '',
            accountHolder: ''
          }
        })
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

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items]
    updatedItems[index][field] = field === 'quantity' ? parseInt(value, 10) : value
    setFormData({
      ...formData,
      items: updatedItems
    })
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

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
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
    if (!formData.reason) {
      toast.error('Vui lòng nhập lý do đổi/trả')
      return
    }
    
    // Check if any items have quantity less than 1
    const invalidItems = formData.items.filter(item => item.quantity < 1)
    if (invalidItems.length > 0) {
      toast.error('Số lượng đổi/trả phải lớn hơn 0')
      return
    }
    
    // Check if at least one image will remain
    if (existingImages.length === 0 && imageFiles.length === 0) {
      toast.error('Vui lòng đính kèm ít nhất một hình ảnh')
      return
    }
    
    // Check if refund info is provided for refund request
    if (returnRequest.requestType === 'refund') {
      const { bankName, accountNumber, accountHolder } = formData.refundInfo
      if (!bankName || !accountNumber || !accountHolder) {
        toast.error('Vui lòng nhập đầy đủ thông tin hoàn tiền')
        return
      }
    }

    setSubmitting(true)
    try {
      // Upload new images
      let uploadedImageUrls = []
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadImages()
      }
      
      // Combine existing and new images
      const allImages = [...existingImages, ...uploadedImageUrls]
      
      // Prepare request data
      const requestData = {
        reason: formData.reason,
        items: formData.items,
        images: allImages
      }
      
      // Add refund info for refund requests
      if (returnRequest.requestType === 'refund') {
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
      
      const response = await fetch(`${process.env.domainApi}/api/customer/return-requests/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(requestData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Yêu cầu đổi/trả hàng đã được cập nhật thành công')
        router.push(`/my-returns/${id}`)
      } else {
        toast.error(data.message || 'Không thể cập nhật yêu cầu đổi/trả hàng')
      }
    } catch (err) {
      console.error('Failed to update return request:', err)
      toast.error('Đã xảy ra lỗi khi cập nhật yêu cầu đổi/trả hàng. Vui lòng thử lại sau.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Chỉnh sửa yêu cầu đổi/trả hàng">
        <div className="edit-return-area pt-80 pb-80">
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
      <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Chỉnh sửa yêu cầu đổi/trả hàng">
        <div className="edit-return-area pt-80 pb-80">
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
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Chỉnh sửa yêu cầu đổi/trả hàng">
      <div className="edit-return-area pt-80 pb-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 mb-4">
              <div className="d-flex justify-content-between align-items-center">
                <h3>
                  Chỉnh sửa yêu cầu đổi/trả hàng{' '}
                  <span className="text-muted">#{id.substring(id.length - 8)}</span>
                </h3>
                <div>
                  <Link href={`/my-returns/${id}`} className="btn btn-outline-primary btn-sm">
                    <i className="fa fa-arrow-left me-1"></i> Quay lại
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-8">
                {/* Thông tin cơ bản */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Thông tin cơ bản</h5>
                  </div>
                  <div className="card-body">
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
                      <div className="col-md-4 text-muted">Loại yêu cầu:</div>
                      <div className="col-md-8">
                        {returnRequest.requestType === 'exchange' ? 'Đổi hàng' : 'Hoàn tiền'}
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
                      
                      {/* Existing images */}
                      {existingImages.length > 0 && (
                        <div className="mb-3">
                          <p className="mb-2">Hình ảnh hiện tại:</p>
                          <div className="d-flex flex-wrap">
                            {existingImages.map((image, index) => (
                              <div key={index} className="image-preview-item position-relative me-2 mb-2">
                                <img 
                                  src={image} 
                                  alt={`Existing ${index}`} 
                                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                  className="border rounded"
                                />
                                <button 
                                  type="button" 
                                  className="btn btn-sm btn-danger position-absolute"
                                  style={{ top: '5px', right: '5px', padding: '0.1rem 0.4rem' }}
                                  onClick={() => removeExistingImage(index)}
                                >
                                  <i className="fa fa-times"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Upload new images */}
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

                      {/* New image previews */}
                      {imageUrls.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2">Hình ảnh mới:</p>
                          <div className="d-flex flex-wrap">
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
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Sản phẩm đổi/trả</h5>
                  </div>
                  <div className="card-body">
                    {formData.items.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-muted">Không có sản phẩm nào trong yêu cầu đổi/trả</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Sản phẩm</th>
                              <th>Số lượng đổi/trả</th>
                              <th>Lý do</th>
                            </tr>
                          </thead>
                          <tbody>
                            {returnRequest.items.map((item, index) => (
                              <tr key={index}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="me-3">
                                      <img 
                                        src={item.productId.thumbnail || "/assets/img/product/placeholder.jpg"} 
                                        alt={item.productId.title} 
                                        style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                                      />
                                    </div>
                                    <div>
                                      <p className="mb-0">{item.productId.title}</p>
                                      <small className="text-muted">Giá: ${item.price?.toFixed(2) || '0.00'}</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <input 
                                    type="number" 
                                    className="form-control" 
                                    min="1" 
                                    max={item.quantity}
                                    value={formData.items[index]?.quantity || ''}
                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    required
                                  />
                                </td>
                                <td>
                                  <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Lý do đổi/trả sản phẩm" 
                                    value={formData.items[index]?.returnReason || ''}
                                    onChange={(e) => handleItemChange(index, 'returnReason', e.target.value)}
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
              </div>

              <div className="col-lg-4">
                {/* Thông tin hoàn tiền (nếu là yêu cầu hoàn tiền) */}
                {returnRequest.requestType === 'refund' && (
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
                          value={formData.refundInfo?.bankName || ''} 
                          onChange={handleRefundInfoChange}
                          required
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
                          value={formData.refundInfo?.accountNumber || ''} 
                          onChange={handleRefundInfoChange}
                          required
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
                          value={formData.refundInfo?.accountHolder || ''} 
                          onChange={handleRefundInfoChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tổng quan */}
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">Cập nhật yêu cầu</h5>
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
                          'Cập nhật yêu cầu'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default EditReturnRequest 