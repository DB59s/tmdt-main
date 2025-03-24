'use client';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState, useCallback } from 'react';
import sortBy from 'lodash/sortBy';
import axios from 'axios'; // Import axios để gọi API
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import IconEye from '@/components/icon/icon-eye';
import IconCpuBolt from '@/components/icon/icon-cpu-bolt';
import IconLogout from '@/components/icon/icon-logout';
import { useRouter } from 'next/navigation';

const ComponentsDatatablesCheckbox = () => {
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState([]);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState({
        columnAccessor: 'id',
        direction: 'asc',
    });
    const [totalRecords, setTotalRecords] = useState(0); // Thêm state để lưu tổng số sản phẩm
    const [categories, setCategories] = useState([]); // Thêm state để lưu danh sách category
    const [selectedCategory, setSelectedCategory] = useState(''); // Thêm state để lưu category đã chọn
    const [sortOrder, setSortOrder] = useState('newest'); // Thêm state để lưu trữ cách sắp xếp

    // Đưa hàm fetchProducts ra ngoài useEffect và sử dụng useCallback để tối ưu
    const fetchProducts = useCallback(async () => {
        try {
            const response = await axios.get('https://vuquangduy.io.vn/api/products', {
                params: {
                    title: search,
                    page: page,
                    limit: pageSize,
                    categoryId: selectedCategory,
                    sortOrder: sortOrder // Sử dụng sortOrder từ state
                }
            });
            setInitialRecords(response.data.products);
            setRecordsData(response.data.products); // Cập nhật trực tiếp recordsData
            setTotalRecords(response.data.totalProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }, [search, page, pageSize, selectedCategory, sortOrder]);

    useEffect(() => {
        // Gọi API để lấy tất cả category
        const fetchCategories = async () => {
            try {
                const response = await axios.get('https://vuquangduy.io.vn/api/categories'); // Đảm bảo URL đúng
                setCategories(response.data); // Cập nhật danh sách category
                
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []); // Chỉ gọi một lần khi component mount

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // Gọi lại khi fetchProducts thay đổi

    useEffect(() => {
        setPage(1);
    }, [pageSize]);

    // Thêm useEffect để reset page về 1 khi thay đổi category hoặc search
    useEffect(() => {
        setPage(1);
    }, [selectedCategory, search, sortOrder]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setInitialRecords(sortStatus.direction === 'desc' ? data.reverse() : data);
    }, [sortStatus]);

    const handleEdit = (id) => {
        // Logic để chỉnh sửa sản phẩm
        console.log("Edit product with ID:", id);
    };

    const handleDelete = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
            return; // Nếu người dùng không xác nhận, thoát hàm
        }

        try {
            await axios.delete(`https://vuquangduy.io.vn/api/admin/products/${id}`, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            alert('Xóa sản phẩm thành công!');
            await fetchProducts(); // Fetch lại danh sách sản phẩm
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Đã xảy ra lỗi khi xóa sản phẩm!');
        }
    };

    const handleAddProduct = () => {
        // Logic để thêm sản phẩm
        console.log("Add new product");
        router.push('/manage-products/create');
    };

    // Hàm xử lý thay đổi danh mục
    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        // Không cần setPage(1) ở đây vì đã có useEffect riêng
    };

    return (
        <div className="panel mt-6">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
                <h5 className="text-lg font-semibold dark:text-white-light">Products</h5>
                <button className="btn btn-primary" onClick={handleAddProduct}>Add Product</button>
                <div className="ltr:ml-auto rtl:mr-auto">
                    <input
                        type="text"
                        className="form-input w-auto"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div>
                    <select
                        className="form-select"
                        value={selectedCategory}
                        onChange={handleCategoryChange}>
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div style={{width: '100px'}}>
                    <select
                        className="form-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}>
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                    </select>
                </div>
            </div>
            <div className="datatables">
                <DataTable
                    className="table-hover whitespace-nowrap"
                    records={recordsData}
                    columns={[
                        { 
                            accessor: 'title',
                            title: 'Title',
                            sortable: true 
                        },
                        { 
                            accessor: 'categoryId',
                            title: 'Category',
                            sortable: true,
                            render: ({ categoryId }) => {
                                const category = categories.find(cat => cat._id === categoryId);
                                return category ? category.name : 'Unknown';
                            }
                        },
                        { 
                            accessor: 'price',
                            title: 'Price',
                            sortable: true,
                            render: ({ price }) => `$${price.toFixed(2)}`
                        },
                        { 
                            accessor: 'stock',
                            title: 'Stock',
                            sortable: true 
                        },
                        {
                            accessor: 'actions',
                            title: 'Actions',
                            width: '20%',
                            render: (record) => (
                                <div className="action-buttons" style={{ width: "100%" }}>
                                    <button title="Edit" onClick={() => handleEdit(record._id)}><IconPencilPaper /></button>
                                    <button title="Delete" onClick={() => handleDelete(record._id)}><IconTrashLines /></button>
                                </div>
                            ),
                        },
                    ]}
                    highlightOnHover
                    totalRecords={totalRecords}
                    recordsPerPage={pageSize}
                    page={page}
                    onPageChange={(p) => setPage(p)}
                    recordsPerPageOptions={PAGE_SIZES}
                    onRecordsPerPageChange={setPageSize}
                    sortStatus={sortStatus}
                    onSortStatusChange={setSortStatus}
                    selectedRecords={selectedRecords}
                    onSelectedRecordsChange={setSelectedRecords}
                    minHeight={200}
                    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                />
            </div>
        </div>
    );
};

export default ComponentsDatatablesCheckbox;