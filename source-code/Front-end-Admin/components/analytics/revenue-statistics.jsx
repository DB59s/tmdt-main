'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/format';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const RevenueStatistics = () => {
    const apiUrl = process.env.domainApi;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('month');
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    period,
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate,
                });

                const response = await axios.get(`${apiUrl}/api/admin/statistics/revenue?${params.toString()}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Lỗi khi tải dữ liệu: ' + response.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải thống kê doanh thu:', err);
                setError('Không thể tải dữ liệu thống kê doanh thu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl, period, dateRange]);

    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatLabel = (label) => {
        if (period === 'day') {
            return new Date(label).toLocaleDateString('vi-VN');
        } else if (period === 'week') {
            // Format for week: YYYY-WXX
            const [year, week] = label.split('-W');
            return `Tuần ${week}, ${year}`;
        } else if (period === 'month') {
            // Format for month: YYYY-MM
            const [year, month] = label.split('-');
            return `Tháng ${month}/${year}`;
        } else if (period === 'year') {
            return `Năm ${label}`;
        }
        return label;
    };

    const prepareChartData = () => {
        if (!data?.revenueData) return null;

        const labels = data.revenueData.map(item => 
            period === 'week' ? item.date : item._id
        );
        
        const revenueValues = data.revenueData.map(item => 
            period === 'week' ? item.revenue : item.revenue
        );
        
        const orderValues = data.revenueData.map(item => 
            period === 'week' ? item.orders : item.orders
        );

        return {
            labels: labels.map(formatLabel),
            datasets: [
                {
                    label: 'Doanh thu',
                    data: revenueValues,
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    yAxisID: 'y',
                },
                {
                    label: 'Số đơn hàng',
                    data: orderValues,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    type: 'bar',
                    yAxisID: 'y1',
                },
            ],
        };
    };

    const chartOptions = {
        responsive: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        stacked: false,
        plugins: {
            title: {
                display: true,
                text: 'Thống kê doanh thu và số lượng đơn hàng',
            },
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Doanh thu (VNĐ)',
                },
                ticks: {
                    callback: function(value) {
                        if (value >= 1000000) {
                            return (value / 1000000) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000) + 'K';
                        }
                        return value;
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Số đơn hàng',
                },
                grid: {
                    drawOnChartArea: false,
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

    const chartData = prepareChartData();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Thống kê doanh thu theo thời gian</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="flex space-x-2">
                        <Button
                            variant={period === 'day' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange('day')}
                        >
                            Ngày
                        </Button>
                        <Button
                            variant={period === 'week' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange('week')}
                        >
                            Tuần
                        </Button>
                        <Button
                            variant={period === 'month' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange('month')}
                        >
                            Tháng
                        </Button>
                        <Button
                            variant={period === 'year' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodChange('year')}
                        >
                            Năm
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Từ ngày</label>
                            <input
                                type="date"
                                name="fromDate"
                                value={dateRange.fromDate}
                                onChange={handleDateChange}
                                className="border p-2 rounded text-sm"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700">Đến ngày</label>
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
                {chartData ? (
                    <div className="h-96">
                        <Line options={chartOptions} data={chartData} />
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500">
                        Không có dữ liệu để hiển thị
                    </div>
                )}

                {/* Hiển thị dữ liệu dạng bảng */}
                {data?.revenueData && data.revenueData.length > 0 && (
                    <div className="mt-8 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Doanh thu
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Số đơn hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Giá trị trung bình/đơn
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.revenueData.map((item, index) => {
                                    const periodLabel = period === 'week' ? item.date : item._id;
                                    const revenue = period === 'week' ? item.revenue : item.revenue;
                                    const orders = period === 'week' ? item.orders : item.orders;
                                    const averageValue = orders > 0 ? revenue / orders : 0;

                                    return (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatLabel(periodLabel)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(revenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {orders}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(averageValue)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default RevenueStatistics; 