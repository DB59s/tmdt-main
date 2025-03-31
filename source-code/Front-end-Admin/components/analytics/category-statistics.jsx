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

const CategoryStatistics = () => {
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

                const response = await axios.get(`${apiUrl}/api/admin/statistics/category-sales?${params.toString()}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Lỗi khi tải dữ liệu: ' + response.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải thống kê theo danh mục:', err);
                setError('Không thể tải dữ liệu thống kê theo danh mục. Vui lòng thử lại sau.');
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

    const prepareSalesChartData = () => {
        if (!data?.categories) return null;

        // Lấy 5 danh mục có doanh số cao nhất, còn lại gộp vào "Khác"
        const topCategories = [...data.categories].sort((a, b) => b.totalSales - a.totalSales);
        
        let chartData;
        
        if (topCategories.length > 5) {
            const top5 = topCategories.slice(0, 5);
            const others = topCategories.slice(5);
            
            const otherTotalSales = others.reduce((sum, cat) => sum + cat.totalSales, 0);
            const otherPercentage = (otherTotalSales / data.totalSales) * 100;
            
            const othersCategory = {
                category: { name: 'Khác' },
                totalSales: otherTotalSales,
                percentage: Number(otherPercentage.toFixed(2))
            };
            
            chartData = [...top5, othersCategory];
        } else {
            chartData = topCategories;
        }

        return {
            labels: chartData.map(item => item.category?.name || 'Không xác định'),
            datasets: [
                {
                    data: chartData.map(item => item.totalSales),
                    backgroundColor: colors.slice(0, chartData.length),
                    borderWidth: 1,
                },
            ],
        };
    };

    const prepareQuantityChartData = () => {
        if (!data?.categories) return null;

        return {
            labels: data.categories
                .sort((a, b) => b.totalQuantity - a.totalQuantity)
                .slice(0, 10)
                .map(item => item.category?.name || 'Không xác định'),
            datasets: [
                {
                    label: 'Số lượng sản phẩm bán ra',
                    data: data.categories
                        .sort((a, b) => b.totalQuantity - a.totalQuantity)
                        .slice(0, 10)
                        .map(item => item.totalQuantity),
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1,
                },
            ],
        };
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const percentage = context.dataset.data[context.dataIndex] / context.dataset.data.reduce((a, b) => a + b, 0) * 100;
                        return `${label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
                    }
                }
            }
        },
    };

    const barOptions = {
        responsive: true,
        indexAxis: 'y',
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Số lượng sản phẩm bán ra theo danh mục',
            },
        },
        scales: {
            x: {
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

    const salesChartData = prepareSalesChartData();
    const quantityChartData = prepareQuantityChartData();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Thống kê bán hàng theo danh mục</CardTitle>
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
                {/* Tổng quan */}
                <div className="mb-8">
                    <h2 className="text-lg font-medium mb-4">Tổng quan bán hàng</h2>
                    <div className="bg-white p-4 rounded-md border mb-4">
                        <div className="text-gray-500 text-sm mb-1">Tổng doanh thu</div>
                        <div className="text-2xl font-bold">{formatCurrency(data?.totalSales || 0)}</div>
                    </div>
                </div>

                {/* Biểu đồ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Biểu đồ doanh thu */}
                    <div>
                        <h3 className="text-base font-medium mb-3">Phân bố doanh thu theo danh mục</h3>
                        {salesChartData ? (
                            <div className="h-80">
                                <Pie data={salesChartData} options={pieOptions} />
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-64 text-gray-500">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>

                    {/* Biểu đồ số lượng */}
                    <div>
                        <h3 className="text-base font-medium mb-3">Số lượng sản phẩm bán ra theo danh mục</h3>
                        {quantityChartData ? (
                            <div className="h-80">
                                <Bar data={quantityChartData} options={barOptions} />
                            </div>
                        ) : (
                            <div className="flex justify-center items-center h-64 text-gray-500">
                                Không có dữ liệu
                            </div>
                        )}
                    </div>
                </div>

                {/* Bảng chi tiết */}
                <div>
                    <h3 className="text-base font-medium mb-3">Chi tiết doanh số theo danh mục</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phần trăm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng bán</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn hàng</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data?.categories
                                    .sort((a, b) => b.totalSales - a.totalSales)
                                    .map((category, index) => (
                                    <tr key={index} className={index < 3 ? 'bg-blue-50' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium">
                                                {category.category?.name || 'Danh mục không xác định'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {formatCurrency(category.totalSales)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div 
                                                    className="bg-blue-500 h-2 rounded-full mr-2" 
                                                    style={{ width: `${Math.max(category.percentage, 3)}%` }}
                                                ></div>
                                                <span>{category.percentage}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {category.totalQuantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {category.orderCount}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CategoryStatistics; 