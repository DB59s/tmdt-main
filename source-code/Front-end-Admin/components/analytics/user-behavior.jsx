'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Link from 'next/link';
import { DataTable } from 'mantine-datatable';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

const UserBehaviorAnalysis = () => {
    const apiUrl = process.env.domainApi;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate,
                    limit: 10
                });

                const response = await axios.get(`${apiUrl}/api/admin/statistics/user-behavior?${params.toString()}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Lỗi khi tải dữ liệu: ' + response.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải phân tích hành vi người dùng:', err);
                setError('Không thể tải dữ liệu hành vi người dùng. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl, dateRange]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const prepareCartStatusChartData = () => {
        if (!data?.cartAnalysis) return null;

        const { activeCartsCount, abandonedCartsCount, convertedCartsCount } = data.cartAnalysis;

        return {
            labels: ['Giỏ hàng đang hoạt động', 'Giỏ hàng bị bỏ quên', 'Đã chuyển đổi thành đơn hàng'],
            datasets: [
                {
                    data: [activeCartsCount, abandonedCartsCount, convertedCartsCount],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const prepareCustomerChartData = () => {
        if (!data?.orderAnalysis) return null;

        const { totalUniqueCustomers, repeatCustomers } = data.orderAnalysis;
        const oneTimeCustomers = totalUniqueCustomers - repeatCustomers;

        return {
            labels: ['Khách hàng mua một lần', 'Khách hàng mua nhiều lần'],
            datasets: [
                {
                    data: [oneTimeCustomers, repeatCustomers],
                    backgroundColor: [
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(153, 102, 255, 0.7)',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = (value / total) * 100;
                        return `${label}: ${value} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        },
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center py-4 text-red-500">{error}</div>
                </CardContent>
            </Card>
        );
    }

    const cartStatusChartData = prepareCartStatusChartData();
    const customerChartData = prepareCustomerChartData();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Phân tích hành vi người dùng</CardTitle>
                <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={dateRange.fromDate}
                                onChange={handleDateChange}
                                className="border p-2 rounded text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                            <input
                                type="date"
                                name="toDate"
                                value={dateRange.toDate}
                                onChange={handleDateChange}
                                className="border p-2 rounded text-sm"
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Phân tích giỏ hàng */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Phân tích giỏ hàng</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-md border">
                                    <div className="text-gray-500 text-sm mb-1">Tỷ lệ bỏ quên giỏ hàng</div>
                                    <div className="text-2xl font-bold text-red-600">
                                        {data?.cartAnalysis?.abandonedCartRate}%
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-md border">
                                    <div className="text-gray-500 text-sm mb-1">Tỷ lệ chuyển đổi</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {data?.cartAnalysis?.conversionRate}%
                                    </div>
                                </div>
                            </div>
                            {cartStatusChartData && (
                                <div className="h-64">
                                    <Doughnut data={cartStatusChartData} options={chartOptions} />
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <h3 className="text-base font-medium mb-3">Sản phẩm được thêm vào giỏ hàng nhiều nhất</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sản phẩm
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Lượt thêm
                                            </th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Số lượng
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data?.cartAnalysis?.topCartedProducts?.slice(0, 5).map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2">
                                                    <div className="flex items-center">
                                                        {item.product?.thumbnail && (
                                                            <img
                                                                src={item.product.thumbnail}
                                                                alt={item.product.title}
                                                                className="h-8 w-8 rounded object-cover mr-2"
                                                            />
                                                        )}
                                                        <div className="max-w-[150px] truncate">
                                                            <Link href={`/manage-products/${item.productId}`} className="text-blue-600 hover:underline">
                                                                {item.product?.title || 'Sản phẩm không xác định'}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {item.addedToCartCount}
                                                </td>
                                                <td className="px-4 py-2 text-sm">
                                                    {item.totalQuantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phân tích wishlist */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Phân tích danh sách yêu thích</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sản phẩm
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lượt thêm vào yêu thích
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.wishlistAnalysis?.topWishlistedProducts?.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 font-medium">{index + 1}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                {item.product?.thumbnail && (
                                                    <img
                                                        src={item.product.thumbnail}
                                                        alt={item.product.title}
                                                        className="h-10 w-10 rounded object-cover mr-2"
                                                    />
                                                )}
                                                <div>
                                                    <Link href={`/manage-products/${item.productId}`} className="text-blue-600 hover:underline">
                                                        {item.product?.title || 'Sản phẩm không xác định'}
                                                    </Link>
                                                    <div className="text-xs text-gray-500">
                                                        {item.product?.price && formatCurrency(item.product.price)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="font-medium">{item.addedToWishlistCount}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Phân tích đơn hàng */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Phân tích đơn hàng</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-md border">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <div className="text-gray-500 text-sm mb-1">Thời gian hoàn thành đơn hàng</div>
                                    <div className="text-2xl font-bold">
                                        {data?.orderAnalysis?.avgCompletionTimeInDays?.toFixed(1) || 0} ngày
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-sm mb-1">Tỷ lệ khách hàng quay lại</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {data?.orderAnalysis?.repeatCustomerRate}%
                                    </div>
                                </div>
                            </div>
                            {customerChartData && (
                                <div className="h-64">
                                    <Doughnut data={customerChartData} options={chartOptions} />
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-white p-4 rounded-md border">
                            <h3 className="text-base font-medium mb-3">Thông tin về khách hàng</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Tổng số khách hàng</div>
                                    <div className="text-xl font-bold">
                                        {data?.orderAnalysis?.totalUniqueCustomers?.toLocaleString() || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Khách hàng mua nhiều lần</div>
                                    <div className="text-xl font-bold">
                                        {data?.orderAnalysis?.repeatCustomers?.toLocaleString() || 0}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-500 mb-1">Khách hàng mua một lần</div>
                                    <div className="text-xl font-bold">
                                        {(data?.orderAnalysis?.totalUniqueCustomers - data?.orderAnalysis?.repeatCustomers)?.toLocaleString() || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default UserBehaviorAnalysis; 