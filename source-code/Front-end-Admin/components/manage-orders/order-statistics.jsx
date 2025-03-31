'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatCurrency } from '@/utils/format';

const OrderStatistics = () => {
    const apiUrl = process.env.domainApi;
    const [statistics, setStatistics] = useState({
        orderStatus: {},
        paymentStatus: {},
        paymentMethod: {},
        revenue: { total: 0 }
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
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const response = await axios.get(`${apiUrl}/api/admin/orders/list/statistics?${params.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            setStatistics(response.data);
        } catch (err) {
            console.error('Error fetching order statistics:', err);
            setError('Failed to load statistics. Please try again.');
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

    const getTotalOrderCount = () => {
        return Object.values(statistics.orderStatus).reduce((acc, count) => acc + count, 0);
    };

    const getPercentage = (value, total) => {
        if (!total) return 0;
        return ((value / total) * 100).toFixed(1);
    };

    const renderStatCard = (title, data, icon, color) => {
        const total = Object.values(data).reduce((acc, count) => acc + count, 0);
        
        return (
            <div className={`panel p-4 rounded-md border-l-4 ${color}`}>
                <h5 className="text-lg font-semibold mb-3">{title}</h5>
                <div className="space-y-3">
                    {Object.entries(data).map(([key, count]) => (
                        <div key={key} className="flex justify-between items-center">
                            <div className="flex items-center">
                                <span>{key}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold">{count}</span>
                                <span className="text-xs text-gray-500">
                                    ({getPercentage(count, total)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between items-center">
                        <span>Total</span>
                        <span className="font-semibold">{total}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-bold">Orders Statistics</h2>
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
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="panel p-6 rounded-md bg-primary-light">
                            <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
                            <p className="text-3xl font-bold">{getTotalOrderCount()}</p>
                        </div>
                        <div className="panel p-6 rounded-md bg-success-light">
                            <h3 className="text-lg font-semibold mb-2">Completed Orders</h3>
                            <p className="text-3xl font-bold">{statistics.orderStatus['Đã giao hàng'] || 0}</p>
                        </div>
                        <div className="panel p-6 rounded-md bg-warning-light">
                            <h3 className="text-lg font-semibold mb-2">Pending Orders</h3>
                            <p className="text-3xl font-bold">
                                {(statistics.orderStatus['Đang xác nhận'] || 0) + 
                                 (statistics.orderStatus['Đang đóng gói'] || 0) + 
                                 (statistics.orderStatus['Đang giao hàng'] || 0)}
                            </p>
                        </div>
                        <div className="panel p-6 rounded-md bg-info-light">
                            <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
                            <p className="text-3xl font-bold">{formatCurrency(statistics.revenue.total)}</p>
                        </div>
                    </div>

                    {/* Detailed Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {renderStatCard('Order Status', statistics.orderStatus, null, 'border-primary')}
                        {renderStatCard('Payment Status', statistics.paymentStatus, null, 'border-success')}
                        {renderStatCard('Payment Method', statistics.paymentMethod, null, 'border-info')}
                    </div>
                </>
            )}
        </div>
    );
};

export default OrderStatistics; 