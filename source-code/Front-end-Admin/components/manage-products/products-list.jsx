'use client';
import { DataTable } from 'mantine-datatable';
import { useEffect, useState, useCallback } from 'react';
import sortBy from 'lodash/sortBy';
import axios from 'axios';
import IconTrashLines from '@/components/icon/icon-trash-lines';
import IconPencilPaper from '@/components/icon/icon-pencil-paper';
import IconCalculator from '@/components/icon/icon-calculator';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/utils/format';

const ProductsList = () => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [initialRecords, setInitialRecords] = useState([]);
    const [recordsData, setRecordsData] = useState(initialRecords);
    const [selectedRecords, setSelectedRecords] = useState([]);
    const [search, setSearch] = useState('');
    const [sortStatus, setSortStatus] = useState({
        columnAccessor: '_id',
        direction: 'asc',
    });
    const [totalRecords, setTotalRecords] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortOrder, setSortOrder] = useState('newest');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [onSaleFilter, setOnSaleFilter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch products with updated API path and parameters
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/customer/products`, {
                params: {
                    page: page,
                    limit: pageSize,
                    search: search || undefined,
                    category: selectedCategory || undefined,
                    minPrice: minPrice || undefined,
                    maxPrice: maxPrice || undefined,
                    onSale: onSaleFilter || undefined,
                    sort: sortOrder || undefined
                },
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            setInitialRecords(response.data.products);
            setRecordsData(response.data.products);
            setTotalRecords(response.data.totalProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    }, [search, page, pageSize, selectedCategory, sortOrder, minPrice, maxPrice, onSaleFilter]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/customer/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, selectedCategory, search, sortOrder, minPrice, maxPrice, onSaleFilter]);

    useEffect(() => {
        const data = sortBy(initialRecords, sortStatus.columnAccessor);
        setRecordsData(sortStatus.direction === 'desc' ? data.reverse() : data);
    }, [sortStatus, initialRecords]);

    const handleEdit = (id) => {
        router.push(`/manage-products/edit/${id}`);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            await axios.delete(`${apiUrl}/api/admin/products/${id}`, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            alert('Product deleted successfully!');
            await fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleAddProduct = () => {
        router.push('/manage-products/create');
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    };

    const handleSortOrderChange = (e) => {
        setSortOrder(e.target.value);
    };

    const handleCalculateAllPrices = async () => {
        if (!confirm('This will recalculate original prices for all products based on discount percentage. Continue?')) {
            return;
        }

        try {
            const response = await axios.post(`${apiUrl}/api/admin/products/calculate-all-prices`, {}, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });

            alert(`Success: ${response.data.message}`);
            fetchProducts();
        } catch (error) {
            console.error('Error calculating prices:', error);
            alert('Error: ' + (error.response?.data?.message || error.message));
        }
    };

    const clearFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSortOrder('newest');
        setMinPrice('');
        setMaxPrice('');
        setOnSaleFilter('');
    };

    return (
        <div className="panel mt-6">
            <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-center">
                <h5 className="text-lg font-semibold dark:text-white-light">Products</h5>
                <div className="flex flex-wrap gap-2">
                    <button className="btn btn-primary" onClick={handleAddProduct}>Add Product</button>
                    <button className="btn btn-info" onClick={handleCalculateAllPrices}>
                        <IconCalculator className="w-5 h-5 mr-2" />
                        Recalculate Prices
                    </button>
                    <Link href="/manage-products/sale-by-category" className="btn btn-warning">
                        Set Sale by Category
                    </Link>
                    <Link href="/manage-products/calculator" className="btn btn-secondary">
                        <IconCalculator className="w-5 h-5 mr-2" />
                        Price Calculator
                    </Link>
                </div>
                <div className="ltr:ml-auto rtl:mr-auto">
                    <button
                        className="btn btn-outline-primary mb-2 md:mb-0"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
            </div>

            {showFilters && (
                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                        <label className="block mb-2 text-sm">Search</label>
                        <input
                            type="text"
                            className="form-input w-full"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm">Category</label>
                        <select
                            className="form-select w-full"
                            value={selectedCategory}
                            onChange={handleCategoryChange}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block mb-2 text-sm">Min Price</label>
                            <input
                                type="number"
                                className="form-input w-full"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block mb-2 text-sm">Max Price</label>
                            <input
                                type="number"
                                className="form-input w-full"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block mb-2 text-sm">On Sale</label>
                            <select
                                className="form-select w-full"
                                value={onSaleFilter}
                                onChange={(e) => setOnSaleFilter(e.target.value)}
                            >
                                <option value="">All</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-sm">Sort By</label>
                            <select
                                className="form-select w-full"
                                value={sortOrder}
                                onChange={handleSortOrderChange}
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                        </div>
                    </div>
                    <div className="md:col-span-4 flex justify-end">
                        <button className="btn btn-outline-danger" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="datatables">
                <DataTable
                    className="table-hover whitespace-nowrap"
                    records={recordsData}
                    idAccessor="_id"
                    columns={[
                        {
                            accessor: 'title',
                            title: 'Title',
                            sortable: true,
                            width: '20%'
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
                            title: 'Current Price',
                            sortable: true,
                            render: ({ price }) => formatCurrency(price)
                        },
                        {
                            accessor: 'priceBeforeSale',
                            title: 'Original Price',
                            sortable: true,
                            render: ({ priceBeforeSale, price, onSale }) =>
                                onSale ? formatCurrency(priceBeforeSale || price) : '-'
                        },
                        {
                            accessor: 'discountPercentage',
                            title: 'Discount',
                            sortable: true,
                            render: ({ discountPercentage, onSale }) =>
                                onSale ? `${discountPercentage?.toFixed(2) || 0}%` : '-'
                        },
                        {
                            accessor: 'stock',
                            title: 'Stock',
                            sortable: true
                        },
                        {
                            accessor: 'onSale',
                            title: 'On Sale',
                            sortable: true,
                            render: ({ onSale }) => (
                                <span className={`badge ${onSale ? 'bg-success' : 'bg-danger'}`}>
                                    {onSale ? 'Yes' : 'No'}
                                </span>
                            )
                        },
                        {
                            accessor: 'actions',
                            title: 'Actions',
                            width: '10%',
                            render: (record) => (
                                <div className="flex items-center gap-2">
                                    <button title="Edit" onClick={() => handleEdit(record._id)}>
                                        <IconPencilPaper className="h-5 w-5 text-primary" />
                                    </button>
                                    <button title="Delete" onClick={() => handleDelete(record._id)}>
                                        <IconTrashLines className="h-5 w-5 text-danger" />
                                    </button>
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
                    onSelectedRecordsChange={(records) => {
                        setSelectedRecords(records);
                    }}
                    minHeight={200}
                    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    loading={isLoading}
                    noRecordsText="No products found"
                />
            </div>
        </div>
    );
};

export default ProductsList;