'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from 'mantine-datatable';
import { formatCurrency } from '@/utils/format';
import Link from 'next/link';
import { Star } from 'lucide-react';

const PAGE_SIZES = [10, 20, 30, 50];

const TopProducts = () => {
    const apiUrl = process.env.domainApi;
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
    });
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await axios.get(`${apiUrl}/api/admin/categories`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setCategories(response.data.categories || []);
                }
            } catch (err) {
                console.error('Lỗi khi tải danh mục:', err);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        fetchCategories();
    }, [apiUrl]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    limit: pageSize,
                    fromDate: dateRange.fromDate,
                    toDate: dateRange.toDate,
                });

                if (selectedCategory) {
                    params.append('categoryId', selectedCategory);
                }

                const response = await axios.get(`${apiUrl}/api/admin/statistics/top-products?${params.toString()}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    setError('Lỗi khi tải dữ liệu: ' + response.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải thống kê sản phẩm bán chạy:', err);
                setError('Không thể tải dữ liệu sản phẩm bán chạy. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [apiUrl, pageSize, dateRange, selectedCategory]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    // Helper để hiển thị sao đánh giá
    const renderRatingStars = (rating) => {
        return (
            <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-1 text-sm text-gray-600">{rating ? rating.toFixed(1) : '0.0'}</span>
            </div>
        );
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Sản phẩm bán chạy</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                            className="border rounded p-2 text-sm"
                            disabled={isLoadingCategories}
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map(category => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
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
                <DataTable
                    className="whitespace-nowrap"
                    records={data?.topProducts || []}
                    columns={[
                        {
                            accessor: 'rank',
                            title: '#',
                            width: 60,
                            render: (_, index) => index + 1,
                        },
                        {
                            accessor: 'product.title',
                            title: 'Sản phẩm',
                            render: ({ product }) => (
                                <div className="flex items-center">
                                    {product?.thumbnail && (
                                        <img
                                            src={product.thumbnail}
                                            alt={product.title}
                                            className="h-12 w-12 rounded object-cover mr-2"
                                        />
                                    )}
                                    <div>
                                        <Link href={`/manage-products/${product?._id}`} className="hover:text-blue-600 font-medium">
                                            {product?.title || 'Sản phẩm không tồn tại'}
                                        </Link>
                                        <div className="text-xs text-gray-500">
                                            SKU: {product?.sku || 'N/A'} | ID: {product?._id?.slice(-6) || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            accessor: 'totalSold',
                            title: 'Số lượng đã bán',
                            render: ({ totalSold }) => (
                                <span className="font-medium">{totalSold.toLocaleString()}</span>
                            ),
                        },
                        {
                            accessor: 'totalRevenue',
                            title: 'Doanh thu',
                            render: ({ totalRevenue }) => formatCurrency(totalRevenue),
                        },
                        {
                            accessor: 'avgRating',
                            title: 'Đánh giá',
                            render: ({ avgRating }) => renderRatingStars(avgRating),
                        },
                        {
                            accessor: 'currentStock',
                            title: 'Kho hiện tại',
                            render: ({ product }) => (
                                <span className={`${product?.quantity <= 5 ? 'text-red-600 font-medium' : ''}`}>
                                    {product?.quantity !== undefined ? product.quantity.toLocaleString() : 'N/A'}
                                </span>
                            ),
                        },
                    ]}
                    totalRecords={data?.topProducts?.length || 0}
                    recordsPerPage={pageSize}
                    page={1}
                    onRecordsPerPageChange={setPageSize}
                    recordsPerPageOptions={PAGE_SIZES}
                    noRecordsText="Không có sản phẩm nào"
                />

                {/* Hiển thị tóm tắt */}
                {data?.topProducts && data.topProducts.length > 0 && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-md">
                        <h3 className="text-lg font-medium mb-2">Tóm tắt thống kê</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white p-3 rounded-md border">
                                <div className="text-sm text-gray-500">Sản phẩm bán chạy nhất</div>
                                <div className="font-medium">
                                    {data.topProducts[0]?.product?.title || 'N/A'} 
                                    <span className="text-green-600 ml-2">
                                        ({data.topProducts[0]?.totalSold || 0} sản phẩm)
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-md border">
                                <div className="text-sm text-gray-500">Tổng doanh thu</div>
                                <div className="font-medium">
                                    {formatCurrency(data.topProducts.reduce((sum, item) => sum + item.totalRevenue, 0))}
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-md border">
                                <div className="text-sm text-gray-500">Tổng sản phẩm đã bán</div>
                                <div className="font-medium">
                                    {data.topProducts.reduce((sum, item) => sum + item.totalSold, 0).toLocaleString()} sản phẩm
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default TopProducts; 