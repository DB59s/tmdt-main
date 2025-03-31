'use client';
import { useState } from 'react';
import axios from 'axios';

const PaymentStatusUpdater = ({ orderId, currentStatus, onSuccess }) => {
    const apiUrl = process.env.domainApi;
    const [paymentStatus, setPaymentStatus] = useState(currentStatus);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const paymentStatuses = ['Chưa thanh toán', 'Đã thanh toán'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (paymentStatus === currentStatus) {
            setError('Please select a different payment status');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${apiUrl}/api/admin/orders/update-payment-status`, {
                orderId,
                paymentStatus,
                note: note || undefined
            }, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            // Reset fields
            setNote('');
            
            // Notify parent component
            if (onSuccess) {
                onSuccess(response.data);
            }
        } catch (err) {
            console.error('Error updating payment status:', err);
            setError(err.response?.data?.message || 'Failed to update payment status. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h6 className="font-semibold mb-3">Update Payment Status</h6>
            {error && (
                <div className="text-danger text-sm mb-3">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-2 text-sm">Payment Status</label>
                    <select 
                        className="form-select w-full"
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        required
                    >
                        {paymentStatuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div>
                    <label className="block mb-2 text-sm">Note (Optional)</label>
                    <textarea
                        className="form-textarea w-full"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add notes about this payment status change"
                        rows={2}
                    ></textarea>
                </div>
                
                <button 
                    type="submit" 
                    className="btn btn-primary w-full"
                    disabled={isSubmitting || paymentStatus === currentStatus}
                >
                    {isSubmitting ? 'Updating...' : 'Update Payment Status'}
                </button>
            </form>
        </div>
    );
};

export default PaymentStatusUpdater; 