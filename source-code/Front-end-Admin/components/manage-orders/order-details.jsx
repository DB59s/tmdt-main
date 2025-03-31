'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import OrderStatusBadge from './order-status-badge';
import OrderStatusUpdater from './order-status-updater';
import PaymentStatusUpdater from './payment-status-updater';
import { formatDate, formatCurrency } from '@/utils/format';

const OrderDetails = ({ orderId }) => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [order, setOrder] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/orders/${orderId}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
                
                setOrder(response.data.order);
                setOrderItems(response.data.orderItems);
                setTrackingHistory(response.data.trackingHistory);
            } catch (err) {
                console.error('Error fetching order details:', err);
                setError('Failed to load order details. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const handleStatusUpdate = async () => {
        // Refresh the order details after status update
        try {
            const response = await axios.get(`${apiUrl}/api/admin/orders/${orderId}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            
            setOrder(response.data.order);
            setTrackingHistory(response.data.trackingHistory);
        } catch (err) {
            console.error('Error refreshing order details:', err);
        }
    };

    if (isLoading) {
        return (
            <div className="panel p-6 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-l-transparent rounded-full mb-4"></div>
                    <p>Loading order details...</p>
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
                    onClick={() => router.push('/manage-orders')}
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Order Not Found</h5>
                <p>The requested order could not be found.</p>
                <button 
                    className="btn btn-outline-primary mt-4"
                    onClick={() => router.push('/manage-orders')}
                >
                    Back to Orders
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Order #{order.orderId}</h2>
                    <p className="text-gray-500">Placed on {formatDate(order.orderDate)}</p>
                </div>
                <div>
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => router.push('/manage-orders')}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>

            {/* Order Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Order Status</h5>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Current Status:</span>
                            <OrderStatusBadge status={order.status} />
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <OrderStatusUpdater 
                                orderId={order._id} 
                                currentStatus={order.status}
                                onSuccess={handleStatusUpdate}
                            />
                        </div>
                    </div>
                </div>

                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Payment Details</h5>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Payment Status:</span>
                            <span className={`badge ${order.paymentStatus === 'Đã thanh toán' ? 'bg-success' : 'bg-warning'}`}>
                                {order.paymentStatus}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Payment Method:</span>
                            <span>{order.paymentMethod}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-4">
                            <PaymentStatusUpdater 
                                orderId={order._id} 
                                currentStatus={order.paymentStatus}
                                onSuccess={handleStatusUpdate}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Customer and Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Customer Information</h5>
                    <div className="space-y-3">
                        <div>
                            <p className="font-semibold">{order.customerName}</p>
                            <p>{order.customerPhone}</p>
                            <p>{order.customerEmail}</p>
                        </div>
                        {order.customerId && (
                            <div className="pt-2">
                                <Link href={`/customers/${order.customerId}`} className="text-primary hover:text-primary-dark">
                                    View Customer Profile
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Shipping Information</h5>
                    <div className="space-y-3">
                        <p>{order.shippingAddress}</p>
                    </div>
                </div>
            </div>

            {/* Order Items Table */}
            <div className="panel">
                <div className="p-6 border-b border-gray-200">
                    <h5 className="text-lg font-semibold">Order Items</h5>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="p-4 text-left">Product</th>
                                <th className="p-4 text-left">Price</th>
                                <th className="p-4 text-center">Quantity</th>
                                <th className="p-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orderItems.map((item, index) => (
                                <tr key={index} className="border-b border-gray-200">
                                    <td className="p-4">
                                        <div className="flex items-center">
                                            {item.productId?.thumbnail && (
                                                <img 
                                                    src={item.productId.thumbnail}
                                                    alt={item.productId.title}
                                                    className="w-12 h-12 object-cover rounded mr-3"
                                                />
                                            )}
                                            <div>
                                                <p className="font-semibold">{item.productId?.title || item.productName || 'Unknown Product'}</p>
                                                {item.productId?.sku && <p className="text-xs text-gray-500">SKU: {item.productId.sku}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {formatCurrency(item.price)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.quantity}
                                    </td>
                                    <td className="p-4 text-right">
                                        {formatCurrency(item.price * item.quantity)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-50">
                                <td colSpan="3" className="p-4 text-right font-semibold">Subtotal:</td>
                                <td className="p-4 text-right">{formatCurrency(order.totalAmountBeforeDiscount || order.totalAmount)}</td>
                            </tr>
                            {order.totalAmountBeforeDiscount && order.totalAmountBeforeDiscount !== order.totalAmount && (
                                <tr className="bg-gray-50">
                                    <td colSpan="3" className="p-4 text-right font-semibold">Discount:</td>
                                    <td className="p-4 text-right text-danger">
                                        -{formatCurrency(order.totalAmountBeforeDiscount - order.totalAmount)}
                                    </td>
                                </tr>
                            )}
                            <tr className="bg-gray-50 font-bold">
                                <td colSpan="3" className="p-4 text-right">Total:</td>
                                <td className="p-4 text-right">{formatCurrency(order.totalAmount)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Order History Timeline */}
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Order Timeline</h5>
                <div className="space-y-6">
                    {trackingHistory.length > 0 ? (
                        trackingHistory.map((event, index) => (
                            <div key={index} className="flex">
                                <div className="mr-4 relative">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    {index < trackingHistory.length - 1 && (
                                        <div className="absolute w-0.5 bg-gray-200 h-full top-3 left-1.5 -translate-x-1/2"></div>
                                    )}
                                </div>
                                <div className="flex-1 pb-6">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <OrderStatusBadge status={event.status} />
                                        <span className="text-sm text-gray-500">{formatDate(event.createdAt)}</span>
                                    </div>
                                    <p>{event.description}</p>
                                    {event.location && <p className="text-sm text-gray-500 mt-1">Location: {event.location}</p>}
                                    <p className="text-sm text-gray-500 mt-1">Updated by: {event.updatedBy}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No tracking history available for this order.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetails; 