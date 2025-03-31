'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '@/utils/format';

const RefundStatistics = () => {
    const apiUrl = process.env.domainApi;
    const [statistics, setStatistics] = useState({
        totalRefunds: 0,
        totalRefundAmount: 0,
        statusCounts: {
            'Đang xử lý': 0,
            'Đã hoàn tiền': 0,
            'Từ chối': 0
        }
    });
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchStatistics = async () => {
        setIsLoading(true);
        setError('');

        try {
            // This is an example call assuming you have this API endpoint
            // You may need to adjust the actual endpoint and response handling
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await axios.get(`${apiUrl}/api/admin/refund-requests/statistics?${params.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            // Adjust based on your actual API response structure
            setStatistics(response.data.data || {
                totalRefunds: 0,
                totalRefundAmount: 0,
                statusCounts: {
                    'Đang xử lý': 0,
                    'Đã hoàn tiền': 0,
                    'Từ chối': 0
                }
            });
        } catch (err) {
            console.error('Error fetching refund statistics:', err);
            
            // If the API endpoint doesn't exist yet, use dummy data for now
            setStatistics({
                totalRefunds: 0,
                totalRefundAmount: 0,
                statusCounts: {
                    'Đang xử lý': 0,
                    'Đã hoàn tiền': 0,
                    'Từ chối': 0
                }
            });
            
            setError('');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatistics();
    }, []);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchStatistics();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-bold">Refund Statistics</h2>
                <form onSubmit={handleFilterSubmit} className="flex flex-wrap gap-3">
                    <div className="flex-1">
                        <label className="block mb-1 text-sm">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            className="form-input w-full"
                            value={dateRange.startDate}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1 text-sm">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            className="form-input w-full"
                            value={dateRange.endDate}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className="flex items-end">
                        <button 
                            type="submit" 
                            className="btn btn-primary h-10"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Loading...' : 'Apply Filter'}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="bg-danger-light text-danger p-4 rounded-md">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="panel p-6 flex items-center justify-center min-h-[200px]">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin h-8 w-8 border-4 border-primary border-l-transparent rounded-full mb-4"></div>
                        <p>Loading statistics...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="panel p-6 rounded-md bg-primary-light">
                        <h3 className="text-lg font-semibold mb-2">Total Refund Requests</h3>
                        <p className="text-3xl font-bold">{statistics.totalRefunds}</p>
                    </div>
                    <div className="panel p-6 rounded-md bg-success-light">
                        <h3 className="text-lg font-semibold mb-2">Total Refund Amount</h3>
                        <p className="text-3xl font-bold">{formatCurrency(statistics.totalRefundAmount)}</p>
                    </div>
                    <div className="panel p-6 rounded-md bg-info-light">
                        <h3 className="text-lg font-semibold mb-2">Refund Status</h3>
                        <div className="space-y-2 mt-2">
                            <div className="flex justify-between">
                                <span>Pending</span>
                                <span className="font-semibold">{statistics.statusCounts['Đang xử lý']}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Completed</span>
                                <span className="font-semibold">{statistics.statusCounts['Đã hoàn tiền']}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Rejected</span>
                                <span className="font-semibold">{statistics.statusCounts['Từ chối']}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefundStatistics; 