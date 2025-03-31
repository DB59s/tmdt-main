'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DataTable } from 'mantine-datatable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Pencil, Trash2, RefreshCw } from 'lucide-react';
import CategoryModal from './category-modal';
import DeleteConfirmation from '@/components/common/delete-confirmation';

const PAGE_SIZES = [10, 20, 30, 50, 100];

const CategoryList = () => {
    const apiUrl = process.env.domainApi;
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
    
    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            // Xây dựng query parameters
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('sort', 'name');
            params.append('order', 'asc');

            const response = await axios.get(`${apiUrl}/api/admin/categories?${params.toString()}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            if (response.data.success) {
                setCategories(response.data.data.categories || []);
            } else {
                setError('Lỗi khi tải danh mục: ' + response.data.message);
            }
        } catch (err) {
            console.error('Lỗi khi tải danh sách danh mục:', err);
            setError('Không thể tải danh sách danh mục. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    }, [apiUrl, search]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleAddCategory = () => {
        setModalType('add');
        setCurrentCategory(null);
        setShowModal(true);
    };

    const handleEditCategory = (category) => {
        setModalType('edit');
        setCurrentCategory(category);
        setShowModal(true);
    };

    const handleDeleteCategory = (category) => {
        setCurrentCategory(category);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!currentCategory) return;

        try {
            const response = await axios.delete(`${apiUrl}/api/admin/categories/${currentCategory._id}`, {
                headers: { authorization: sessionStorage.getItem('token') }
            });

            if (response.data.success) {
                // Tải lại danh sách sau khi xóa
                fetchCategories();
            } else {
                setError('Lỗi khi xóa danh mục: ' + response.data.message);
            }
        } catch (err) {
            console.error('Lỗi khi xóa danh mục:', err);
            setError(err.response?.data?.message || 'Không thể xóa danh mục. Vui lòng thử lại sau.');
        } finally {
            setShowDeleteModal(false);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    const handleModalSubmit = async (categoryData) => {
        try {
            if (modalType === 'add') {
                await axios.post(`${apiUrl}/api/admin/categories`, categoryData, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
            } else {
                await axios.patch(`${apiUrl}/api/admin/categories/${currentCategory._id}`, categoryData, {
                    headers: { authorization: sessionStorage.getItem('token') }
                });
            }
            
            // Tải lại danh sách sau khi thêm/sửa
            fetchCategories();
            setShowModal(false);
        } catch (err) {
            console.error('Lỗi khi lưu danh mục:', err);
            setError(err.response?.data?.message || 'Không thể lưu danh mục. Vui lòng thử lại sau.');
        }
    };

    const handleRefresh = () => {
        setSearch('');
        fetchCategories();
    };

    return (
        <div className="panel">
            <div className="flex flex-col gap-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Quản lý danh mục</h5>
                
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded">
                        {error}
                    </div>
                )}

                <div className="flex flex-col md:flex-row md:items-center gap-5">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Search className="w-5 h-5 text-gray-500" />
                        <Input
                            type="text"
                            placeholder="Tìm kiếm danh mục..."
                            value={search}
                            onChange={handleSearch}
                            className="w-full md:w-auto"
                        />
                    </div>
                    
                    <div className="flex gap-2 ml-auto">
                        <Button 
                            variant="outline" 
                            onClick={handleRefresh}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Tải lại</span>
                        </Button>
                        <Button 
                            onClick={handleAddCategory}
                            className="flex items-center gap-2"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Thêm danh mục</span>
                        </Button>
                    </div>
                </div>

                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={categories}
                        columns={[
                            {
                                accessor: 'name',
                                title: 'Tên danh mục',
                                sortable: true,
                                render: ({ name }) => (
                                    <span className="font-medium">{name}</span>
                                ),
                            },
                            {
                                accessor: 'productCount',
                                title: 'Số lượng sản phẩm',
                                sortable: true,
                                render: ({ productCount }) => (
                                    <Badge variant="outline">{productCount}</Badge>
                                ),
                            },
                            {
                                accessor: 'actions',
                                title: 'Thao tác',
                                render: (category) => (
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEditCategory(category)}
                                            className="flex items-center gap-1"
                                        >
                                            <Pencil className="w-4 h-4" />
                                            <span>Sửa</span>
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="text-red-500 border-red-500 hover:bg-red-50 flex items-center gap-1"
                                            onClick={() => handleDeleteCategory(category)}
                                            disabled={category.productCount > 0}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>Xóa</span>
                                        </Button>
                                    </div>
                                ),
                            },
                        ]}
                        totalRecords={categories.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Hiển thị từ ${from} đến ${to} trong tổng số ${totalRecords} danh mục`}
                        noRecordsText="Không có danh mục nào"
                        loading={loading}
                        loadingText="Đang tải dữ liệu..."
                    />
                </div>
            </div>

            {/* Modal thêm/sửa danh mục */}
            <CategoryModal
                isOpen={showModal}
                type={modalType}
                category={currentCategory}
                onClose={handleModalClose}
                onSubmit={handleModalSubmit}
            />

            {/* Modal xác nhận xóa */}
            <DeleteConfirmation
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Xóa danh mục"
                message={
                    currentCategory?.productCount > 0 
                    ? `Không thể xóa danh mục "${currentCategory?.name}" vì có ${currentCategory?.productCount} sản phẩm liên kết.`
                    : `Bạn có chắc chắn muốn xóa danh mục "${currentCategory?.name}" không?`
                }
                confirmDisabled={currentCategory?.productCount > 0}
            />
        </div>
    );
};

export default CategoryList; 