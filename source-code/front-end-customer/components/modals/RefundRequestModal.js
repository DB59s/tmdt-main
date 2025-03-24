'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const RefundRequestModal = ({ show, handleClose, order, onRefundSuccess }) => {
  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    reason: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  
  // Initialize form data when order changes
  useEffect(() => {
    if (order) {
      setFormData(prev => ({
        ...prev,
        orderId: order._id || '',
        customerName: order.customerName || ''
      }))
    }
  }, [order])
  
  // Handle click outside modal to close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        handleModalClose()
      }
    }

    if (show) {
      document.addEventListener('click', handleOutsideClick)
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick)
      // Restore scrolling when modal is closed
      document.body.style.overflow = 'auto'
    }
  }, [show])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        handleModalClose()
      }
    }

    if (show) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [show])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Validate all required fields
    const requiredFields = [
      { field: 'customerName', label: 'Tên khách hàng' },
      { field: 'bankName', label: 'Tên ngân hàng' },
      { field: 'bankAccountNumber', label: 'Số tài khoản' },
      { field: 'bankAccountName', label: 'Tên chủ tài khoản' },
      { field: 'reason', label: 'Lý do yêu cầu hoàn tiền' }
    ]
    
    for (const { field, label } of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setError(`Vui lòng nhập ${label}`)
        return
      }
    }
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`${process.env.domainApi}/api/customer/orders/refund-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization if required
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Yêu cầu hoàn tiền đã được ghi nhận')
        handleClose()
        
        // Call the success callback with the response data
        if (onRefundSuccess) {
          onRefundSuccess(data)
        }
      } else {
        setError(data.message || 'Có lỗi xảy ra khi gửi yêu cầu hoàn tiền')
        toast.error(data.message || 'Có lỗi xảy ra khi gửi yêu cầu hoàn tiền')
      }
    } catch (err) {
      console.error('Error submitting refund request:', err)
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.')
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const resetForm = () => {
    if (order) {
      setFormData({
        orderId: order._id || '',
        customerName: order.customerName || '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
        reason: ''
      })
    } else {
      setFormData({
        orderId: '',
        customerName: '',
        bankName: '',
        bankAccountNumber: '',
        bankAccountName: '',
        reason: ''
      })
    }
    setError(null)
  }
  
  const handleModalClose = () => {
    resetForm()
    handleClose()
  }
  
  if (!show || !order) return null
  
  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050
    }}>
      <div className="custom-modal" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #e9ecef'
        }}>
          <h5 className="modal-title">Yêu Cầu Hoàn Tiền</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={handleModalClose}
            style={{
              background: 'transparent',
              border: 0,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ padding: '1rem' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="orderCode" className="form-label">Mã đơn hàng</label>
                  <input
                    type="text"
                    className="form-control"
                    id="orderCode"
                    value={order.orderId || ''}
                    readOnly
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="totalAmount" className="form-label">Số tiền hoàn trả</label>
                  <input
                    type="text"
                    className="form-control"
                    id="totalAmount"
                    value={`${order.totalAmount ? order.totalAmount.toLocaleString('vi-VN') : 0} VND`}
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="customerName" className="form-label">Tên khách hàng <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
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
                    value={order.customerEmail || ''}
                    readOnly
                  />
                </div>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <h5 className="mb-3">Thông tin tài khoản ngân hàng</h5>
            
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="bankName" className="form-label">Tên ngân hàng <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="VD: Vietcombank, Techcombank, ..."
                    required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="bankAccountNumber" className="form-label">Số tài khoản <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    id="bankAccountNumber"
                    name="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="bankAccountName" className="form-label">Tên chủ tài khoản <span className="text-danger">*</span></label>
              <input
                type="text"
                className="form-control"
                id="bankAccountName"
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="reason" className="form-label">Lý do yêu cầu hoàn tiền <span className="text-danger">*</span></label>
              <textarea
                className="form-control"
                id="reason"
                name="reason"
                rows="3"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Vui lòng cung cấp lý do yêu cầu hoàn tiền"
                required
              ></textarea>
            </div>
            
            <div className="alert alert-info" role="alert">
              <small>
                <strong>Lưu ý:</strong> Sau khi gửi yêu cầu hoàn tiền, chúng tôi sẽ xem xét và xử lý trong vòng 3-5 ngày làm việc. 
                Số tiền hoàn trả sẽ được chuyển vào tài khoản bạn đã cung cấp.
              </small>
            </div>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleModalClose}
                disabled={isSubmitting}
                style={{ marginRight: '10px' }}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="tp-btn tp-color-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Gửi yêu cầu hoàn tiền'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default RefundRequestModal 