'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/utils/format';
import RefundStatusBadge from './refund-status-badge';

const RefundDetails = ({ refundId }) => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [refundRequest, setRefundRequest] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Status update states
    const [status, setStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updateError, setUpdateError] = useState('');

    const refundStatuses = ['Đang xử lý', 'Đã hoàn tiền', 'Từ chối'];

    useEffect(() => {
        const fetchRefundDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/refund-requests/refund-request/${refundId}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
                
                const refundData = response.data.data;
                setRefundRequest(refundData);
                setStatus(refundData.status); // Initialize status with current value
            } catch (err) {
                console.error('Error fetching refund request details:', err);
                setError('Failed to load refund request details. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        if (refundId) {
            fetchRefundDetails();
        }
    }, [refundId, apiUrl]);

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setUpdateError('');
        
        if (status === refundRequest.status) {
            setUpdateError('Please select a different status');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.put(`${apiUrl}/api/admin/refund-requests/${refundId}`, {
                status,
                adminNotes
            }, {
                headers: { authorization: sessionStorage.getItem('token') }
            });
            
            setRefundRequest(response.data.data);
            alert('Refund request status updated successfully');
        } catch (err) {
            console.error('Error updating refund request:', err);
            setUpdateError(err.response?.data?.message || 'Failed to update refund request status');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="panel p-6 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-l-transparent rounded-full mb-4"></div>
                    <p>Loading refund request details...</p>
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
                    onClick={() => router.push('/manage-refunds')}
                >
                    Back to Refund Requests
                </button>
            </div>
        );
    }

    if (!refundRequest) {
        return (
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Refund Request Not Found</h5>
                <p>The requested refund request could not be found.</p>
                <button 
                    className="btn btn-outline-primary mt-4"
                    onClick={() => router.push('/manage-refunds')}
                >
                    Back to Refund Requests
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold">Refund Request Details</h2>
                    <p className="text-gray-500">Request submitted on {formatDate(refundRequest.createdAt)}</p>
                </div>
                <div>
                    <button 
                        className="btn btn-outline-primary"
                        onClick={() => router.push('/manage-refunds')}
                    >
                        Back to Refund Requests
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Refund Request Info */}
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Refund Request Information</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <RefundStatusBadge status={refundRequest.status} />
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Amount:</span>
                            <span className="font-semibold">{formatCurrency(refundRequest.amount)}</span>
                        </div>

                        <div>
                            <span className="text-gray-500 block mb-1">Reason:</span>
                            <p className="bg-gray-50 p-3 rounded">{refundRequest.reason}</p>
                        </div>

                        {refundRequest.processedAt && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Processed At:</span>
                                <span>{formatDate(refundRequest.processedAt)}</span>
                            </div>
                        )}

                        {refundRequest.adminNotes && (
                            <div>
                                <span className="text-gray-500 block mb-1">Admin Notes:</span>
                                <p className="bg-gray-50 p-3 rounded">{refundRequest.adminNotes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bank Information */}
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Bank Information</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Bank Name:</span>
                            <span>{refundRequest.bankName}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Account Number:</span>
                            <span>{refundRequest.bankAccountNumber}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Account Name:</span>
                            <span>{refundRequest.bankAccountName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Order */}
            {refundRequest.orderId && (
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-4">Related Order Information</h5>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500">Order ID:</span>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{refundRequest.orderId.orderId}</span>
                                <Link 
                                    href={`/manage-orders/${refundRequest.orderId._id}`}
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    View Order
                                </Link>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Total Amount:</span>
                            <span className="font-semibold">{formatCurrency(refundRequest.orderId.totalAmount)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Order Status:</span>
                            <span>{refundRequest.orderId.status}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer:</span>
                            <span>{refundRequest.orderId.customerName}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer Email:</span>
                            <span>{refundRequest.orderId.customerEmail}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer Phone:</span>
                            <span>{refundRequest.orderId.customerPhone}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-500">Payment Method:</span>
                            <span>{refundRequest.orderId.paymentMethod}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Form */}
            <div className="panel p-6">
                <h5 className="text-lg font-semibold mb-4">Update Refund Status</h5>
                {updateError && (
                    <div className="bg-danger-light text-danger p-3 rounded-md mb-4">
                        {updateError}
                    </div>
                )}
                <form onSubmit={handleStatusUpdate} className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Refund Status</label>
                        <select
                            className="form-select w-full"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            required
                        >
                            {refundStatuses.map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium">Admin Notes</label>
                        <textarea
                            className="form-textarea w-full"
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes about this status update (will be sent to customer)"
                            rows={3}
                        ></textarea>
                        
                        {status === 'Từ chối' && (
                            <p className="text-sm text-danger mt-1">
                                *Please provide a reason for the rejection
                            </p>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting || status === refundRequest.status}
                    >
                        {isSubmitting ? 'Updating...' : 'Update Status'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RefundDetails; 