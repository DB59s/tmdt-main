'use client';
import { useState } from 'react';
import axios from 'axios';

const OrderStatusUpdater = ({ orderId, currentStatus, onSuccess }) => {
    const apiUrl = process.env.domainApi;
    const [status, setStatus] = useState(currentStatus);
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const orderStatuses = ['Đang xác nhận', 'Đang đóng gói', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (status === currentStatus) {
            setError('Please select a different status');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${apiUrl}/api/admin/orders/update-status`, {
                orderId,
                status,
                description,
                location: location || undefined
            }, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            // Reset fields
            setDescription('');
            setLocation('');
            
            // Notify parent component
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            console.error('Error updating order status:', err);
            setError(err.response?.data?.message || 'Failed to update order status. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h6 className="font-semibold mb-3">Update Order Status</h6>
            {error && (
                <div className="text-danger text-sm mb-3">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm">New Status</label>
                    <select 
                        className="form-select w-full"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                    >
                        {orderStatuses.map((orderStatus) => (
                            <option key={orderStatus} value={orderStatus}>
                                {orderStatus}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block mb-2 text-sm">Description (Optional)</label>
                    <textarea
                        className="form-textarea w-full"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add notes about this status change"
                        rows={2}
                    ></textarea>
                </div>
                
                <div>
                    <label className="block mb-2 text-sm">Location (Optional)</label>
                    <input
                        type="text"
                        className="form-input w-full"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Enter location (e.g., warehouse, shipping center)"
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={isSubmitting || status === currentStatus}
                >
                    {isSubmitting ? 'Updating...' : 'Update Status'}
                </button>
            </form>
        </div>
    );
};

export default OrderStatusUpdater; 