'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpIcon, ArrowDownIcon, ShoppingBag, Users, Package, DollarSign } from 'lucide-react';
import { DataTable } from 'mantine-datatable';
import { formatCurrency } from '@/utils/format';
import Link from 'next/link';

const PAGE_SIZES = [5, 10, 15, 20];

const DashboardOverview = () => {
    const apiUrl = process.env.domainApi;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/statistics/overview`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Lỗi khi tải dữ liệu: ' + response.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải tổng quan dashboard:', err);
                setError('Không thể tải dữ liệu tổng quan. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
                {error}
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Tổng doanh thu */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng doanh thu
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(data.totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tổng doanh thu từ các đơn hàng đã giao
                        </p>
                    </CardContent>
                </Card>

                {/* Tổng đơn hàng */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng đơn hàng
                        </CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số đơn hàng đã nhận được
                        </p>
                    </CardContent>
                </Card>

                {/* Tổng sản phẩm */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng sản phẩm
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalProducts}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số sản phẩm trong cửa hàng
                        </p>
                    </CardContent>
                </Card>

                {/* Tổng khách hàng */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tổng khách hàng
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số khách hàng đã đăng ký
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Đơn hàng gần đây */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Đơn hàng gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            className="whitespace-nowrap"
                            records={data.recentOrders || []}
                            columns={[
                                {
                                    accessor: '_id',
                                    title: 'Mã đơn hàng',
                                    render: ({ _id }) => (
                                        <Link href={`/manage-orders/${_id}`} className="text-blue-600 hover:underline">
                                            #{_id.slice(-6)}
                                        </Link>
                                    ),
                                },
                                {
                                    accessor: 'totalAmount',
                                    title: 'Giá trị',
                                    render: ({ totalAmount }) => formatCurrency(totalAmount),
                                },
                                {
                                    accessor: 'status',
                                    title: 'Trạng thái',
                                    render: ({ status }) => {
                                        let statusClass = 'bg-gray-100 text-gray-800';
                                        
                                        if (status === 'Đã giao hàng') {
                                            statusClass = 'bg-green-100 text-green-800';
                                        } else if (status === 'Đang xử lý') {
                                            statusClass = 'bg-blue-100 text-blue-800';
                                        } else if (status === 'Đang giao hàng') {
                                            statusClass = 'bg-yellow-100 text-yellow-800';
                                        } else if (status === 'Đã hủy') {
                                            statusClass = 'bg-red-100 text-red-800';
                                        }
                                        
                                        return (
                                            <span className={`px-2 py-1 rounded text-xs ${statusClass}`}>
                                                {status}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Ngày đặt',
                                    render: ({ createdAt }) => new Date(createdAt).toLocaleDateString('vi-VN'),
                                },
                            ]}
                            totalRecords={data.recentOrders?.length || 0}
                            recordsPerPage={5}
                            page={1}
                            noRecordsText="Không có đơn hàng nào"
                        />
                    </CardContent>
                </Card>

                {/* Sản phẩm bán chạy */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Sản phẩm bán chạy</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable
                            className="whitespace-nowrap"
                            records={data.topSellingProducts || []}
                            columns={[
                                {
                                    accessor: 'product.title',
                                    title: 'Tên sản phẩm',
                                    render: ({ product }) => (
                                        <div className="flex items-center">
                                            {product?.thumbnail && (
                                                <img
                                                    src={product.thumbnail}
                                                    alt={product.title}
                                                    className="h-10 w-10 rounded object-cover mr-2"
                                                />
                                            )}
                                            <div className="max-w-[200px] truncate">
                                                <Link href={`/manage-products/${product?._id}`} className="hover:text-blue-600">
                                                    {product?.title || 'Sản phẩm không tồn tại'}
                                                </Link>
                                            </div>
                                        </div>
                                    ),
                                },
                                {
                                    accessor: 'totalSold',
                                    title: 'Đã bán',
                                    render: ({ totalSold }) => totalSold,
                                },
                                {
                                    accessor: 'totalRevenue',
                                    title: 'Doanh thu',
                                    render: ({ totalRevenue }) => formatCurrency(totalRevenue),
                                },
                            ]}
                            totalRecords={data.topSellingProducts?.length || 0}
                            recordsPerPage={5}
                            page={1}
                            noRecordsText="Không có sản phẩm nào"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardOverview; 