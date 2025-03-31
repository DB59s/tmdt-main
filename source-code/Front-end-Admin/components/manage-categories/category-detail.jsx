'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { DataTable } from 'mantine-datatable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import Link from 'next/link';

const PAGE_SIZES = [10, 20, 30, 50, 100];

const CategoryDetail = ({ categoryId }) => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchCategoryDetails = async () => {
            setLoading(true);
            try {
                // Lấy thông tin danh mục
                const categoryResponse = await axios.get(`${apiUrl}/api/admin/categories/${categoryId}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (categoryResponse.data.success) {
                    setCategory(categoryResponse.data.data.category);
                } else {
                    setError('Lỗi khi tải thông tin danh mục: ' + categoryResponse.data.message);
                }

                // Lấy danh sách sản phẩm thuộc danh mục
                const params = new URLSearchParams({
                    page,
                    limit: pageSize
                });

                const productsResponse = await axios.get(`${apiUrl}/api/admin/categories/${categoryId}/products?${params.toString()}`, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });

                if (productsResponse.data.success) {
                    setProducts(productsResponse.data.data.products);
                    setTotalProducts(productsResponse.data.data.pagination.total);
                    setTotalPages(productsResponse.data.data.pagination.totalPages);
                } else {
                    setError('Lỗi khi tải danh sách sản phẩm: ' + productsResponse.data.message);
                }
            } catch (err) {
                console.error('Lỗi khi tải dữ liệu:', err);
                setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryDetails();
    }, [apiUrl, categoryId, page, pageSize]);

    const handleBackToList = () => {
        router.push('/manage-categories');
    };

    const handleEditCategory = () => {
        // Đưa về trang danh sách danh mục và mở modal sửa
        // Có thể truyền một query param để đánh dấu cần mở modal
        router.push(`/manage-categories?edit=${categoryId}`);
    };

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

    if (!category) {
        return (
            <div className="text-center">
                <p>Không tìm thấy danh mục</p>
                <Button variant="outline" onClick={handleBackToList} className="mt-4">
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleBackToList}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <h1 className="text-2xl font-bold">Chi tiết danh mục</h1>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditCategory}>
                    <Edit className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        {category.name}
                    </CardTitle>
                    <CardDescription>
                        ID: {category._id}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-md">
                            <h3 className="text-sm font-medium text-gray-500">Số lượng sản phẩm</h3>
                            <p className="text-3xl font-bold">{category.productCount}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sản phẩm trong danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        className="whitespace-nowrap"
                        records={products}
                        columns={[
                            {
                                accessor: 'thumbnail',
                                title: 'Ảnh',
                                render: ({ thumbnail, title }) => (
                                    thumbnail ? (
                                        <img 
                                            src={thumbnail} 
                                            alt={title} 
                                            className="w-12 h-12 object-cover rounded-sm"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-200 rounded-sm flex items-center justify-center text-gray-500">
                                            No image
                                        </div>
                                    )
                                ),
                            },
                            {
                                accessor: 'title',
                                title: 'Tên sản phẩm',
                                render: ({ _id, title, sku }) => (
                                    <div>
                                        <Link href={`/manage-products/${_id}`} className="font-medium hover:text-blue-600">
                                            {title}
                                        </Link>
                                        <div className="text-xs text-gray-500">SKU: {sku}</div>
                                    </div>
                                ),
                            },
                            {
                                accessor: 'price',
                                title: 'Giá',
                                render: ({ price, discountPercentage }) => (
                                    <div>
                                        <span className="font-medium">{formatCurrency(price)}</span>
                                        {discountPercentage > 0 && (
                                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                -{discountPercentage}%
                                            </span>
                                        )}
                                    </div>
                                ),
                            },
                            {
                                accessor: 'quantity',
                                title: 'Kho',
                                render: ({ quantity }) => (
                                    <span className={quantity <= 10 ? 'text-red-600 font-medium' : ''}>
                                        {quantity}
                                    </span>
                                ),
                            },
                            {
                                accessor: 'actions',
                                title: 'Thao tác',
                                render: (product) => (
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-1"
                                            onClick={() => router.push(`/manage-products/${product._id}`)}
                                        >
                                            <span>Chi tiết</span>
                                        </Button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={totalProducts}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        paginationText={({ from, to, totalRecords }) => `Hiển thị từ ${from} đến ${to} trong tổng số ${totalRecords} sản phẩm`}
                        noRecordsText="Không có sản phẩm nào trong danh mục này"
                    />
                </CardContent>
            </Card>
        </div>
    );
};

export default CategoryDetail; 