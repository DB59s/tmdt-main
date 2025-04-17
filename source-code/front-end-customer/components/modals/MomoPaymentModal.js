'use client'
import { useState, useEffect } from 'react'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { QRCodeSVG } from 'qrcode.react'

const MomoPaymentModal = ({ show, handleClose, paymentData, checkingPayment }) => {
  const [timeLeft, setTimeLeft] = useState(900) // 15 phút tính bằng giây
  const [timer, setTimer] = useState(null)
  const [paymentState, setPaymentState] = useState('waiting') // waiting, checking, success, failed

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
  
  // Mở ứng dụng Momo
  const openMomoApp = () => {
    if (paymentData.deeplink) {
      window.open(paymentData.deeplink, '_blank')
    } else if (paymentData.payUrl) {
      window.open(paymentData.payUrl, '_blank')
    }
  }

  // Format số tiền
  const formatAmount = (amount) => {
    const numAmount = Number(amount) || 0
    return numAmount.toLocaleString('vi-VN') + ' ₫'
  }

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static" keyboard={false} size="lg">
      <Modal.Header>
        <Modal.Title>
          <div className="d-flex align-items-center">
            <img 
              src="/assets/img/payment/momo-logo.png" 
              alt="Momo" 
              style={{ height: '30px', marginRight: '10px' }} 
            />
            Thanh toán qua Momo
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <div className="row">
          <div className="col-md-6 text-center mb-3">
            <h5>Quét mã QR để thanh toán</h5>
            <p className="text-muted small">Sử dụng ứng dụng Momo để quét mã QR thanh toán</p>
            
            <div className="momo-qr-container mt-3 mb-3 p-3 border rounded" style={{ backgroundColor: '#fff' }}>
              {paymentData.qrCodeUrl ? (
                <div className="qr-image-container" style={{ maxWidth: '200px', margin: '0 auto' }}>
                  <img 
                    src={paymentData.qrCodeUrl} 
                    alt="Momo QR Code" 
                    className="img-fluid" 
                  />
                </div>
              ) : (
                <QRCodeSVG 
                  value={paymentData.payUrl || "https://momo.vn"} 
                  size={200}
                  includeMargin={true}
                  level="H"
                />
              )}
            </div>
            
            {(paymentData.deeplink || paymentData.payUrl) && (
              <Button 
                variant="primary" 
                className="w-100 mb-3" 
                onClick={openMomoApp}
                style={{ backgroundColor: '#ae2070', borderColor: '#ae2070' }}
              >
                <i className="fas fa-mobile-alt me-2"></i> Mở ứng dụng Momo
              </Button>
            )}
          </div>
          
          <div className="col-md-6">
            <div className="payment-status-container p-3 mb-3 rounded" style={{ 
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
                      style={{ width: `${(timeLeft/900)*100}%`, backgroundColor: timeLeft > 60 ? '#28a745' : '#dc3545' }}
                    ></div>
                  </div>
                  <p className="small text-muted">
                    Còn lại <strong className={timeLeft < 60 ? 'text-danger' : 'text-success'}>
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
                <span>{paymentData.orderId}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <strong>Số tiền:</strong>
                <span>{formatAmount(paymentData.amount)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <strong>Phương thức:</strong>
                <span>Ví Momo</span>
              </div>
              <div className="payment-note p-2 mt-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                <p className="small mb-0">
                  <i className="fas fa-info-circle me-1 text-primary"></i>
                  Đơn hàng sẽ được xác nhận tự động sau khi thanh toán thành công.
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
  )
}

export default MomoPaymentModal 