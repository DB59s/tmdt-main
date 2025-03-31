'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/utils/format';
import ReturnStatusBadge from './return-status-badge';
import ReturnTypeBadge from './return-type-badge';

const ReturnDetails = ({ returnId }) => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [returnRequest, setReturnRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Status update states
    const [status, setStatus] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState('');

    // Exchange items states (for exchange requests)
    const [showExchangeForm, setShowExchangeForm] = useState(false);
    const [exchangeItems, setExchangeItems] = useState([{ productId: '', quantity: 1 }]);
    const [exchangeError, setExchangeError] = useState('');
    const [isExchangeSubmitting, setIsExchangeSubmitting] = useState(false);
    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    const statusOptions = ['pending', 'processing', 'approved', 'completed', 'rejected'];
    const statusLabels = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý',
        'approved': 'Đã chấp nhận',
        'completed': 'Hoàn thành',
        'rejected': 'Từ chối'
    };
    
    const requestTypeLabels = {
        'refund': 'Hoàn tiền',
        'exchange': 'Đổi hàng'
    };

    useEffect(() => {
        const fetchReturnDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/return-requests/${returnId}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
                
                const returnData = response.data.data;
                console.log("data chi tiet cua don hang  ", returnData)
                setReturnRequest(returnData);
                setStatus(returnData.status); // Initialize status with current value
                setAdminNote(returnData.adminNote || '');
            } catch (err) {
                console.error('Error fetching return request details:', err);
                setError('Không thể tải chi tiết yêu cầu đổi/trả. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        };

        if (returnId) {
            fetchReturnDetails();
        }
    }, [returnId, apiUrl]);

    // Fetch products for exchange form
    useEffect(() => {
        const fetchProducts = async () => {
            if (!showExchangeForm) return;
            
            setIsLoadingProducts(true);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/products?limit=100`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
                setProducts(response.data.data.products || []);
            } catch (err) {
                console.error('Error fetching products:', err);
                setExchangeError('Không thể tải danh sách sản phẩm.');
            } finally {
                setIsLoadingProducts(false);
            }
        };

        fetchProducts();
    }, [showExchangeForm, apiUrl]);

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setUpdateError('');
        
        if (status === returnRequest.status && adminNote === returnRequest.adminNote) {
            setUpdateError('Vui lòng thay đổi trạng thái hoặc ghi chú để cập nhật');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.put(`${apiUrl}/api/admin/return-requests/${returnId}/status`, {
                status,
                note: adminNote,
                adminName: sessionStorage.getItem('adminName') || 'Admin'
            }, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            
            setReturnRequest(response.data.data);
            alert('Cập nhật trạng thái thành công');
        } catch (err) {
            console.error('Error updating return request status:', err);
            setUpdateError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExchangeItemChange = (index, field, value) => {
        const newItems = [...exchangeItems];
        newItems[index][field] = value;
        setExchangeItems(newItems);
    };

    const addExchangeItem = () => {
        setExchangeItems([...exchangeItems, { productId: '', quantity: 1 }]);
    };

    const removeExchangeItem = (index) => {
        if (exchangeItems.length > 1) {
            const newItems = [...exchangeItems];
            newItems.splice(index, 1);
            setExchangeItems(newItems);
        }
    };

    const handleExchangeItemsSubmit = async (e) => {
        e.preventDefault();
        setExchangeError('');
        
        // Validate exchange items
        for (const item of exchangeItems) {
            if (!item.productId || item.quantity < 1) {
                setExchangeError('Vui lòng chọn sản phẩm và số lượng hợp lệ');
                return;
            }
        }

        setIsExchangeSubmitting(true);
        try {
            const response = await axios.post(`${apiUrl}/api/admin/return-requests/${returnId}/exchange-items`, {
                exchangeItems
            }, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            
            setReturnRequest(response.data.data);
            setShowExchangeForm(false);
            alert('Đã thêm sản phẩm thay thế thành công');
        } catch (err) {
            console.error('Error adding exchange items:', err);
            setExchangeError(err.response?.data?.message || 'Lỗi khi thêm sản phẩm thay thế');
        } finally {
            setIsExchangeSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="panel p-6 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-l-transparent rounded-full mb-4"></div>
                    <p>Đang tải thông tin yêu cầu đổi/trả hàng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="panel p-6 bg-danger-light text-danger">
                <p className="font-semibold">{error}</p>
                <button 
                    className="btn btn-outline-danger mt-4"
                    onClick={() => router.push('/manage-returns')}
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    if (!returnRequest) {
        return (
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Không tìm thấy yêu cầu</h5>
                <p>Không thể tìm thấy yêu cầu đổi/trả hàng.</p>
                <button 
                    className="btn btn-outline-primary mt-4"
                    onClick={() => router.push('/manage-returns')}
                >
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Chi tiết yêu cầu {returnRequest.requestType === 'refund' ? 'hoàn tiền' : 'đổi hàng'}</h2>
                    <p className="text-gray-500">Yêu cầu gửi ngày {formatDate(returnRequest.createdAt)}</p>
                </div>
                <div>
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => router.push('/manage-returns')}
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Return Request Info */}
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Thông tin yêu cầu</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Loại yêu cầu:</span>
                            <ReturnTypeBadge type={returnRequest.requestType} />
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-500">Trạng thái:</span>
                            <ReturnStatusBadge status={returnRequest.status} />
                        </div>

                        <div>
                            <span className="text-gray-500 block mb-1">Lý do:</span>
                            <p className="bg-gray-50 p-3 rounded">{returnRequest.reason}</p>
                        </div>

                        {returnRequest.adminNote && (
                            <div>
                                <span className="text-gray-500 block mb-1">Ghi chú quản trị:</span>
                                <p className="bg-gray-50 p-3 rounded">{returnRequest.adminNote}</p>
                            </div>
                        )}

                        {returnRequest.statusHistory && returnRequest.statusHistory.length > 0 && (
                            <div>
                                <span className="text-gray-500 block mb-1">Lịch sử trạng thái:</span>
                                <div className="bg-gray-50 p-3 rounded space-y-2">
                                    {returnRequest.statusHistory.map((history, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <div>
                                                <span className="font-medium">{statusLabels[history.status]}</span>
                                                {history.note && <span className="text-gray-500 ml-2">- {history.note}</span>}
                                                <span className="block text-xs text-gray-500">bởi {history.by}</span>
                                            </div>
                                            <span className="text-gray-500">{formatDate(history.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Customer Information */}
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Thông tin khách hàng</h5>
                    {returnRequest.customerId ? (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tên khách hàng:</span>
                                <span>{returnRequest.customerId.name || returnRequest.customerName}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span>
                                <span>{returnRequest.customerId.email || returnRequest.customerEmail}</span>
                            </div>

                            {(returnRequest.customerId.phone || returnRequest.customerPhone) && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số điện thoại:</span>
                                    <span>{returnRequest.customerId.phone || returnRequest.customerPhone}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tên khách hàng:</span>
                                <span>{returnRequest.customerName}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span>
                                <span>{returnRequest.customerEmail}</span>
                            </div>

                            {returnRequest.customerPhone && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Số điện thoại:</span>
                                    <span>{returnRequest.customerPhone}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Refund Information (for refund requests) */}
            {returnRequest.requestType === 'refund' && returnRequest.refundInfo && (
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Thông tin hoàn tiền</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ngân hàng:</span>
                            <span className="font-semibold">{returnRequest.refundInfo.bankName}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-500">Số tài khoản:</span>
                            <span>{returnRequest.refundInfo.accountNumber}</span>
                        </div>
                        
                        <div className="flex justify-between">
                            <span className="text-gray-500">Chủ tài khoản:</span>
                            <span>{returnRequest.refundInfo.accountHolder}</span>
                        </div>
                        
                        {returnRequest.totalRefundAmount && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Tổng tiền hoàn:</span>
                                <span className="font-semibold text-primary">{formatCurrency(returnRequest.totalRefundAmount)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Related Order */}
            {returnRequest.orderId && (
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Mã đơn hàng:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{returnRequest.orderId.orderId}</span>
                                <Link 
                                    href={`/manage-orders/${returnRequest.orderId._id}`}
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    Xem đơn hàng
                                </Link>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Ngày đặt hàng:</span>
                            <span>{formatDate(returnRequest.orderId.orderDate)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Tổng tiền:</span>
                            <span className="font-semibold">{formatCurrency(returnRequest.orderId.totalAmount)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Trạng thái đơn hàng:</span>
                            <span>{returnRequest.orderId.status}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Items to Return/Exchange */}
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Sản phẩm {returnRequest.requestType === 'refund' ? 'hoàn tiền' : 'đổi'}</h5>
                <div className="overflow-x-auto">
                    <table className="min-w-full table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left">Sản phẩm</th>
                                <th className="px-4 py-2 text-center">Số lượng</th>
                                <th className="px-4 py-2 text-right">Đơn giá</th>
                                <th className="px-4 py-2 text-right">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {returnRequest.items && returnRequest.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-2">
                                        <div className="flex items-center">
                                            {item.productId?.thumbnail && (
                                                <img 
                                                    src={item.productId.thumbnail} 
                                                    alt={item.productId.title} 
                                                    className="w-12 h-12 object-cover mr-3 rounded"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{item.productId?.title || 'Sản phẩm không còn tồn tại'}</p>
                                                {item.options && (
                                                    <p className="text-xs text-gray-500">
                                                        {Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(item.productId?.price || 0)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency((item.productId?.price || 0) * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Exchange Items (for exchange requests) */}
            {returnRequest.requestType === 'exchange' && (
                <div className="panel p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h5 className="text-lg font-semibold">Sản phẩm thay thế</h5>
                        {returnRequest.status !== 'completed' && returnRequest.status !== 'rejected' && (
                            <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setShowExchangeForm(!showExchangeForm)}
                            >
                                {returnRequest.exchangeItems && returnRequest.exchangeItems.length > 0 
                                    ? (showExchangeForm ? 'Ẩn form' : 'Cập nhật sản phẩm thay thế') 
                                    : 'Thêm sản phẩm thay thế'}
                            </button>
                        )}
                    </div>

                    {showExchangeForm ? (
                        <div className="mb-6">
                            {exchangeError && (
                                <div className="bg-danger-light text-danger p-3 rounded-md mb-4">
                                    {exchangeError}
                                </div>
                            )}
                            <form onSubmit={handleExchangeItemsSubmit} className="space-y-4">
                                {isLoadingProducts ? (
                                    <div className="p-4 text-center">
                                        <div className="animate-spin h-6 w-6 border-4 border-primary border-l-transparent rounded-full inline-block mb-2"></div>
                                        <p>Đang tải danh sách sản phẩm...</p>
                                    </div>
                                ) : (
                                    <>
                                        {exchangeItems.map((item, index) => (
                                            <div key={index} className="grid grid-cols-12 gap-4 items-end">
                                                <div className="col-span-6">
                                                    <label className="block mb-1 text-sm">Sản phẩm</label>
                                                    <select
                                                        value={item.productId}
                                                        onChange={(e) => handleExchangeItemChange(index, 'productId', e.target.value)}
                                                        className="form-select w-full"
                                                        required
                                                    >
                                                        <option value="">Chọn sản phẩm</option>
                                                        {products.map(product => (
                                                            <option key={product._id} value={product._id} disabled={product.stock < item.quantity}>
                                                                {product.title} {product.stock < item.quantity ? `(Hết hàng - SL: ${product.stock})` : `(${product.stock})`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-3">
                                                    <label className="block mb-1 text-sm">Số lượng</label>
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleExchangeItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                                        min="1"
                                                        className="form-input w-full"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-3 flex">
                                                    {index === 0 ? (
                                                        <button 
                                                            type="button"
                                                            onClick={addExchangeItem}
                                                            className="btn btn-outline-primary w-full"
                                                        >
                                                            Thêm sản phẩm
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            type="button"
                                                            onClick={() => removeExchangeItem(index)}
                                                            className="btn btn-outline-danger w-full"
                                                        >
                                                            Xóa
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-2">
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary"
                                                disabled={isExchangeSubmitting}
                                            >
                                                {isExchangeSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm thay thế'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    ) : returnRequest.exchangeItems && returnRequest.exchangeItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2 text-left">Sản phẩm</th>
                                        <th className="px-4 py-2 text-center">Số lượng</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {returnRequest.exchangeItems.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <div className="flex items-center">
                                                    {item.productId?.thumbnail && (
                                                        <img 
                                                            src={item.productId.thumbnail} 
                                                            alt={item.productId.title} 
                                                            className="w-12 h-12 object-cover mr-3 rounded"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-medium">{item.productId?.title || item.productId || 'Sản phẩm không còn tồn tại'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-4 text-center text-gray-500 rounded">
                            Chưa có sản phẩm thay thế được thêm vào yêu cầu này.
                        </div>
                    )}
                </div>
            )}

            {/* Status Update Form */}
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Cập nhật trạng thái</h5>
                {updateError && (
                    <div className="bg-danger-light text-danger p-3 rounded-md mb-4">
                        {updateError}
                    </div>
                )}
                <form onSubmit={handleStatusUpdate} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Trạng thái yêu cầu</label>
                        <select
                            className="form-select w-full"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                        >
                            {statusOptions.map(statusOption => (
                                <option key={statusOption} value={statusOption}>
                                    {statusLabels[statusOption]}
                                </option>
                            ))}
                        </select>
                        
                        {status === 'completed' && returnRequest.requestType === 'exchange' && (!returnRequest.exchangeItems || returnRequest.exchangeItems.length === 0) && (
                            <p className="text-sm text-warning mt-1">
                                *Vui lòng thêm sản phẩm thay thế trước khi hoàn thành yêu cầu đổi hàng
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium">Ghi chú quản trị</label>
                        <textarea
                            className="form-textarea w-full"
                            value={adminNote}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Thêm ghi chú về việc cập nhật trạng thái này"
                            rows={3}
                        ></textarea>
                        
                        {status === 'rejected' && (
                            <p className="text-sm text-danger mt-1">
                                *Vui lòng cung cấp lý do từ chối
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting || (status === 'completed' && returnRequest.requestType === 'exchange' && (!returnRequest.exchangeItems || returnRequest.exchangeItems.length === 0))}
                    >
                        {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReturnDetails; 