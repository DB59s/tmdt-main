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
import { Pie, Bar } from 'react-chartjs-2';
import Link from 'next/link';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement
);

const ReturnRateAnalysis = () => {
    const apiUrl = process.env.domainApi;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
    });

    const colors = [
        'rgba(54, 162, 235, 0.7)',
        'rgba(255, 99, 132, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(199, 199, 199, 0.7)',
        'rgba(83, 102, 255, 0.7)',
        'rgba(78, 205, 196, 0.7)',
        'rgba(232, 65, 24, 0.7)',
    ];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate,
                });

                const response = await axios.get(`${apiUrl}/api/admin/statistics/return-rate?${params.toString()}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Lỗi khi tải dữ liệu: ' + response.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải thống kê tỷ lệ đổi/trả:', err);
                setError('Không thể tải dữ liệu tỷ lệ đổi/trả. Vui lòng thử lại sau.');
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

    const prepareReasonChartData = () => {
        if (!data?.returnsByReason) return null;

        return {
            labels: data.returnsByReason.map(item => item.reason),
            datasets: [
                {
                    data: data.returnsByReason.map(item => item.count),
                    backgroundColor: colors.slice(0, data.returnsByReason.length),
                    borderWidth: 1,
                },
            ],
        };
    };

    const prepareTypeChartData = () => {
        if (!data?.returnsByType) return null;

        return {
            labels: data.returnsByType.map(item => item.type === 'exchange' ? 'Đổi hàng' : 'Trả hàng'),
            datasets: [
                {
                    data: data.returnsByType.map(item => item.count),
                    backgroundColor: ['rgba(54, 162, 235, 0.7)', 'rgba(255, 99, 132, 0.7)'],
                    borderWidth: 1,
                },
            ],
        };
    };

    const prepareProductChartData = () => {
        if (!data?.returnsByProduct || data.returnsByProduct.length === 0) return null;

        return {
            labels: data.returnsByProduct.map(item => 
                item.product?.title 
                ? (item.product.title.length > 20 
                    ? item.product.title.substring(0, 20) + '...' 
                    : item.product.title)
                : 'Sản phẩm không xác định'
            ),
            datasets: [
                {
                    label: 'Số lượng bị đổi/trả',
                    data: data.returnsByProduct.map(item => item.count),
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgb(255, 99, 132)',
                    borderWidth: 1,
                },
            ],
        };
    };

    const pieOptions = {
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
                        const percentage = context.dataset.data[context.dataIndex] / context.dataset.data.reduce((a, b) => a + b, 0) * 100;
                        return `${label}: ${value} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        },
    };

    const barOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Sản phẩm bị đổi/trả nhiều nhất',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Số lượng',
                },
            },
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

    const reasonChartData = prepareReasonChartData();
    const typeChartData = prepareTypeChartData();
    const productChartData = prepareProductChartData();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Thống kê tỷ lệ đơn hàng bị đổi/trả</CardTitle>
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
                {/* Thống kê tổng quan */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-4 rounded-md border">
                        <div className="text-gray-500 text-sm mb-1">Tổng số đơn hàng</div>
                        <div className="text-2xl font-bold">{data?.totalOrders?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-md border">
                        <div className="text-gray-500 text-sm mb-1">Tổng số đơn đổi/trả</div>
                        <div className="text-2xl font-bold">{data?.totalReturns?.toLocaleString() || 0}</div>
                    </div>
                    <div className="bg-white p-4 rounded-md border">
                        <div className="text-gray-500 text-sm mb-1">Tỷ lệ đổi/trả</div>
                        <div className="text-2xl font-bold">
                            {data?.returnRate}%
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({data?.totalReturns}/{data?.totalOrders})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Biểu đồ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Biểu đồ theo loại yêu cầu (đổi/trả) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Phân bố theo loại yêu cầu</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {typeChartData ? (
                                <div className="h-64">
                                    <Pie data={typeChartData} options={pieOptions} />
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-64 text-gray-500">
                                    Không có dữ liệu
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Biểu đồ theo lý do */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Phân bố theo lý do</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reasonChartData ? (
                                <div className="h-64">
                                    <Pie data={reasonChartData} options={pieOptions} />
                                </div>
                            ) : (
                                <div className="flex justify-center items-center h-64 text-gray-500">
                                    Không có dữ liệu
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Biểu đồ sản phẩm */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="text-base">Sản phẩm bị đổi/trả nhiều nhất</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productChartData ? (
                            <div className="h-80">
                                <Bar data={productChartData} options={barOptions} />
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-64 text-gray-500">
                                Không có dữ liệu
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Chi tiết sản phẩm đổi/trả */}
                {data?.returnsByProduct && data.returnsByProduct.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sản phẩm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số lượng đổi/trả
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        % trên tổng đổi/trả
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.returnsByProduct.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">
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
                                                        ID: {item.productId?.slice(-6) || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {item.count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {((item.count / data.totalReturns) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ReturnRateAnalysis; 