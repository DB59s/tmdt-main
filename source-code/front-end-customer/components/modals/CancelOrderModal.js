'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

const CancelOrderModal = ({ show, handleClose, orderId, onCancelSuccess }) => {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const cancelReasons = [
    'Tôi không có nhu cầu mua nữa',
    'Tôi không muốn nhận hàng',
    'Tôi muốn thay đổi địa chỉ nhận hàng',
    'Lý do khác'
  ]

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

  const handleReasonChange = (e) => {
    setSelectedReason(e.target.value)
    if (e.target.value !== 'Lý do khác') {
      setCustomReason('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    // Validate reason
    const finalReason = selectedReason === 'Lý do khác' ? customReason : selectedReason
    
    if (!finalReason || finalReason.trim() === '') {
      setError('Vui lòng chọn hoặc nhập lý do hủy đơn hàng')
      return
    }
    
    if (selectedReason === 'Lý do khác' && (!customReason || customReason.trim() === '')) {
      setError('Vui lòng nhập lý do hủy đơn hàng')
      return
    }
    
    try {
      setIsSubmitting(true)
      
      const response = await fetch(`${process.env.domainApi}/api/customer/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization if required
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: finalReason
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Đơn hàng đã hủy thành công')
        handleClose()
        
        // Call the success callback with the response data
        if (onCancelSuccess) {
          onCancelSuccess(data)
        }
      } else {
        setError(data.message || 'Có lỗi xảy ra khi hủy đơn hàng')
        toast.error(data.message || 'Có lỗi xảy ra khi hủy đơn hàng')
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.')
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại sau.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedReason('')
    setCustomReason('')
    setError(null)
  }

  const handleModalClose = () => {
    resetForm()
    handleClose()
  }

  if (!show) return null

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
        maxWidth: '500px',
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
          <h5 className="modal-title">Hủy Đơn Hàng</h5>
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
            
            <div className="mb-4">
              <label className="form-label fw-bold">Lý do hủy đơn hàng</label>
              <div className="mt-2">
                {cancelReasons.map((reason, index) => (
                  <div className="form-check mb-2" key={index}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="cancelReason"
                      id={`reason-${index}`}
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={handleReasonChange}
                    />
                    <label className="form-check-label" htmlFor={`reason-${index}`}>
                      {reason}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedReason === 'Lý do khác' && (
              <div className="mb-3">
                <label htmlFor="customReason" className="form-label">Nhập lý do của bạn</label>
                <textarea
                  className="form-control"
                  id="customReason"
                  rows="3"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do hủy đơn hàng của bạn"
                ></textarea>
              </div>
            )}
            
            <div className="alert alert-warning" role="alert">
              <small>
                <strong>Lưu ý:</strong> Sau khi hủy đơn hàng, bạn không thể hoàn tác hành động này. 
                {selectedReason && selectedReason !== 'Lý do khác' && (
                  <span> Lý do hủy đơn: <strong>{selectedReason}</strong></span>
                )}
                {selectedReason === 'Lý do khác' && customReason && (
                  <span> Lý do hủy đơn: <strong>{customReason}</strong></span>
                )}
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
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CancelOrderModal 