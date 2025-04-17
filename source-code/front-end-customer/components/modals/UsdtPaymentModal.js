'use client'
import { useState, useEffect, useRef } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { QRCodeSVG } from 'qrcode.react'
import { Toast, ToastContainer } from 'react-bootstrap'

const UsdtPaymentModal = ({ show, handleClose, paymentData, checkingPayment }) => {
  const [timeLeft, setTimeLeft] = useState(1800) // 30 phút tính bằng giây
  const [timer, setTimer] = useState(null)
  const [paymentState, setPaymentState] = useState('waiting') // waiting, checking, success, failed
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (show) {
      // Khởi tạo bộ đếm thời gian
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval)
            setPaymentState('failed')
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      setTimer(interval)
      setPaymentState('waiting')
    }
    
    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [show])
  
  // Cập nhật trạng thái khi checkingPayment thay đổi
  useEffect(() => {
    if (checkingPayment) {
      setPaymentState('checking')
    } else if (paymentState === 'checking') {
      // Nếu kết thúc checking mà không tự đóng modal, nghĩa là vẫn chưa thanh toán thành công
      setPaymentState('waiting')
    }
  }, [checkingPayment])
  
  // Format thời gian còn lại dưới dạng mm:ss
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Format số tiền
  const formatAmount = (amount) => {
    const numAmount = Number(amount) || 0
    return numAmount.toLocaleString('vi-VN') + ' ₫'
  }
  
  // Hàm sao chép vào clipboard
  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setToastMessage(`Đã sao chép ${type} vào clipboard`)
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      })
      .catch(err => {
        console.error('Không thể sao chép: ', err)
        setToastMessage('Không thể sao chép vào clipboard')
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      })
  }

  return (
    <>
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1070 }}>
        <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
          <Toast.Header>
            <strong className="me-auto">Thông báo</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    
      <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={false} size="lg">
        <Modal.Header>
          <Modal.Title>
            <div className="d-flex align-items-center">
              <img 
                src="/assets/img/payment/usdt-logo.png" 
                alt="USDT" 
                style={{ height: '30px', marginRight: '10px' }} 
              />
              Thanh toán qua USDT (TRC20)
            </div>
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <div className="row">
            <div className="col-md-6 text-center mb-3">
              <h5>Quét mã QR để thanh toán</h5>
              <p className="text-muted small">Sử dụng ví USDT (TRC20) để quét mã QR thanh toán</p>
              
              <div className="usdt-qr-container mt-3 mb-3 p-3 border rounded" style={{ backgroundColor: '#fff' }}>
                <QRCodeSVG 
                  value={paymentData?.walletAddress || "Không có địa chỉ ví"} 
                  size={200}
                  includeMargin={true}
                  level="H"
                />
              </div>
              
              <div className="wallet-address-container p-3 border rounded mb-3">
                <h6 className="mb-2">Địa chỉ ví TRC20</h6>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control form-control-sm" 
                    value={paymentData?.walletAddress || ""} 
                    readOnly 
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button"
                    onClick={() => handleCopy(paymentData?.walletAddress || "", "địa chỉ ví")}
                  >
                    <i className="far fa-copy"></i>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="payment-status p-3 mb-3 border rounded" style={{ 
                backgroundColor: paymentState === 'checking' ? '#fff3cd' : 
                               paymentState === 'success' ? '#d4edda' : 
                               paymentState === 'failed' ? '#f8d7da' : '#e9ecef'
              }}>
                <h5 className="mb-3">Trạng thái thanh toán</h5>
                
                {paymentState === 'waiting' && (
                  <div className="waiting-status">
                    <p><i className="far fa-clock me-2"></i> Đang chờ bạn thanh toán</p>
                    <div className="progress mb-2" style={{ height: '10px' }}>
                      <div 
                        className="progress-bar progress-bar-striped progress-bar-animated" 
                        role="progressbar"
                        style={{ width: `${(timeLeft/1800)*100}%`, backgroundColor: timeLeft > 300 ? '#28a745' : '#dc3545' }}
                      ></div>
                    </div>
                    <p className="small text-muted">
                      Còn lại <strong className={timeLeft < 300 ? 'text-danger' : 'text-success'}>
                        {formatTimeLeft()}
                      </strong> để hoàn tất thanh toán
                    </p>
                  </div>
                )}
                
                {paymentState === 'checking' && (
                  <div className="checking-status">
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-2" />
                      <span>Đang kiểm tra trạng thái thanh toán...</span>
                    </div>
                    <p className="small text-muted mt-2">
                      Vui lòng đợi trong khi chúng tôi xác nhận thanh toán của bạn
                    </p>
                  </div>
                )}
                
                {paymentState === 'failed' && (
                  <div className="failed-status">
                    <p className="text-danger"><i className="fas fa-times-circle me-2"></i> Hết thời gian thanh toán</p>
                    <p className="small">
                      Bạn có thể đóng cửa sổ này và thử lại sau
                    </p>
                  </div>
                )}
              </div>
              
              <div className="payment-details p-3 border rounded">
                <h5 className="mb-3">Chi tiết thanh toán</h5>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Mã đơn hàng:</strong>
                  <span>{paymentData?.orderId || ""}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Số tiền (VND):</strong>
                  <span>{formatAmount(paymentData?.amountInVnd || 0)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Số tiền (USDT):</strong>
                  <div>
                    <span className="me-2">{paymentData?.amount || 0} USDT</span>
                    <button 
                      className="btn btn-sm btn-outline-secondary py-0 px-1"
                      onClick={() => handleCopy(paymentData?.amount?.toString() || "0", "số tiền")}
                    >
                      <i className="far fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Mạng lưới:</strong>
                  <span>{paymentData?.network || "TRC20"}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <strong>Mã tham chiếu:</strong>
                  <div>
                    <span className="me-2" style={{ fontSize: '0.8rem' }}>
                      {paymentData?.reference?.substring(0, 8)}...{paymentData?.reference?.substring(paymentData?.reference?.length - 8) || ""}
                    </span>
                    <button 
                      className="btn btn-sm btn-outline-secondary py-0 px-1"
                      onClick={() => handleCopy(paymentData?.reference || "", "mã tham chiếu")}
                    >
                      <i className="far fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div className="payment-note p-2 mt-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <p className="small mb-0">
                    <i className="fas fa-info-circle me-1 text-primary"></i>
                    Lưu ý: Vui lòng chuyển đúng số USDT và sử dụng mạng TRC20 để giao dịch.
                  </p>
                </div>
                <div className="payment-note p-2 mt-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <p className="small mb-0">
                    <i className="fas fa-exclamation-triangle me-1 text-warning"></i>
                    Sau khi chuyển tiền, có thể mất vài phút để xác nhận giao dịch.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <div className="w-100">
            <p className="text-muted mb-3 small">
              <i className="fas fa-info-circle me-1"></i>
              Nếu bạn đã thanh toán thành công nhưng cửa sổ này không tự đóng, vui lòng bấm nút bên dưới để tiếp tục.
            </p>
            <Button 
              variant="secondary" 
              onClick={handleClose} 
              className="w-100"
            >
              Đã thanh toán / Huỷ thanh toán
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default UsdtPaymentModal
