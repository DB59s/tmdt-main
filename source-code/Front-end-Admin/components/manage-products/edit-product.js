'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import IconX from '@/components/icon/icon-x';

const EditProduct = ({ productID }) => {
    const apiUrl = process.env.domainApi;
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const [imagesPreviews, setImagesPreviews] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        price: 0,
        discountPercentage: 0,
        rating: 0,
        stock: 0,
        tags: '',
        brand: '',
        sku: '',
        weight: '',
        dimensions: '',
        warrantyInformation: '',
        shippingInformation: '',
        availabilityStatus: 'Còn hàng',
        returnPolicy: '',
        images: [],
        thumbnail: null
    });

    useEffect(() => {
        // Lấy danh sách danh mục
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/customer/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error('Lỗi khi lấy danh mục:', error);
                setError('Không thể lấy danh sách danh mục. Vui lòng thử lại sau.');
            }
        };

        // Lấy thông tin sản phẩm cần chỉnh sửa
        const fetchProductDetails = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/customer/products/${productID}`, {
                    headers: {
                        authorization: `${sessionStorage.getItem('token')}`
                    }
                });
                
                const product = response.data;
                
                // Chuẩn bị dữ liệu cho form
                setFormData({
                    title: product.title || '',
                    description: product.description || '',
                    categoryId: product.categoryId || '',
                    price: product.price || 0,
                    discountPercentage: product.discountPercentage || 0,
                    rating: product.rating || 0,
                    stock: product.stock || 0,
                    tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
                    brand: product.brand || '',
                    sku: product.sku || '',
                    weight: product.weight || '',
                    dimensions: product.dimensions || '',
                    warrantyInformation: product.warrantyInformation || '',
                    shippingInformation: product.shippingInformation || '',
                    availabilityStatus: product.availabilityStatus || 'Còn hàng',
                    returnPolicy: product.returnPolicy || '',
                    images: product.images || [],
                    thumbnail: product.thumbnail || null
                });

                // Hiển thị ảnh đại diện
                if (product.thumbnail) {
                    setThumbnailPreview(product.thumbnail);
                }

                // Hiển thị các ảnh khác
                if (Array.isArray(product.images) && product.images.length > 0) {
                    setImagesPreviews(product.images);
                }

                setIsLoadingData(false);
            } catch (error) {
                console.error('Lỗi khi lấy thông tin sản phẩm:', error);
                setError('Không thể lấy thông tin sản phẩm. Vui lòng thử lại sau.');
                setIsLoadingData(false);
            }
        };

        fetchCategories();
        if (productID) {
            fetchProductDetails();
        } else {
            setIsLoadingData(false);
            setError('Không tìm thấy ID sản phẩm');
        }
    }, [productID]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: parseFloat(value) || 0
        });
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Tạo URL để xem trước ảnh
            const previewUrl = URL.createObjectURL(file);
            setThumbnailPreview(previewUrl);
            
            // Chuyển đổi file thành base64 để gửi lên server
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    thumbnail: reader.result
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImagesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Tạo URLs để xem trước ảnh
            const previewUrls = files.map(file => URL.createObjectURL(file));
            setImagesPreviews([...imagesPreviews, ...previewUrls]);
            
            // Chuyển đổi files thành base64 để gửi lên server
            const promises = files.map(file => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve(reader.result);
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(promises).then(base64Images => {
                setFormData({
                    ...formData,
                    images: [...formData.images, ...base64Images]
                });
            });
        }
    };

    const removeImage = (index) => {
        const newImagesPreviews = [...imagesPreviews];
        newImagesPreviews.splice(index, 1);
        setImagesPreviews(newImagesPreviews);

        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData({
            ...formData,
            images: newImages
        });
    };

    const removeThumbnail = () => {
        setThumbnailPreview('');
        setFormData({
            ...formData,
            thumbnail: null
        });
    };

    const handleTagsChange = (e) => {
        setFormData({
            ...formData,
            tags: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');

        // Kiểm tra các trường bắt buộc
        if (!formData.title || !formData.price || !formData.stock || !formData.categoryId || !formData.sku) {
            setError('Vui lòng điền đầy đủ các trường bắt buộc (Tên sản phẩm, Giá, Số lượng, Danh mục, SKU)');
            setIsLoading(false);
            return;
        }

        // Kiểm tra thumbnail
        if (!formData.thumbnail) {
            setError('Vui lòng tải lên ảnh đại diện cho sản phẩm');
            setIsLoading(false);
            return;
        }

        try {
            // Chuẩn bị dữ liệu để gửi
            const productData = {
                ...formData,
                tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
            };

            // Gửi request cập nhật sản phẩm
            const response = await axios.patch(`${apiUrl}/api/admin/products/${productID}`, productData, {
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': `${sessionStorage.getItem('token')}`
                }
            });

            setSuccess('Cập nhật sản phẩm thành công!');
            
            // Chuyển hướng về trang danh sách sản phẩm sau 1.5 giây
            setTimeout(() => {
                router.push('/manage-products');
            }, 1500);
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            setError(error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật sản phẩm. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
    return (
            <div className="panel mt-6 flex items-center justify-center h-[400px]">
                <div className="animate-spin border-4 border-primary border-l-transparent rounded-full w-12 h-12"></div>
                <span className="ml-3">Đang tải dữ liệu...</span>
        </div>
        );
    }

    return (
        <div className="panel mt-6">
            <div className="mb-5 flex items-center justify-between">
                <h5 className="text-lg font-semibold dark:text-white-light">Chỉnh sửa sản phẩm</h5>
                <button 
                    type="button" 
                    className="btn btn-outline-primary"
                    onClick={() => router.push('/manage-products')}
                >
                    Quay lại
                </button>
            </div>

            {error && (
                <div className="mb-5 rounded-md bg-danger-light p-3 text-danger">
                    <span className="font-semibold">Lỗi:</span> {error}
                </div>
            )}

            {success && (
                <div className="mb-5 rounded-md bg-success-light p-3 text-success">
                    <span className="font-semibold">Thành công:</span> {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Thông tin cơ bản */}
                    <div className="panel p-4 border border-gray-200 rounded-md">
                        <h6 className="mb-4 text-base font-medium">Thông tin cơ bản</h6>
                        
                        <div className="mb-4">
                            <label htmlFor="title" className="block mb-2 font-semibold">Tên sản phẩm <span className="text-danger">*</span></label>
                            <input
                                id="title"
                                type="text"
                                name="title"
                                className="form-input"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="description" className="block mb-2 font-semibold">Mô tả</label>
                            <textarea
                                id="description"
                                name="description"
                                className="form-textarea min-h-[100px]"
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="categoryId" className="block mb-2 font-semibold">Danh mục <span className="text-danger">*</span></label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                className="form-select"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="mb-4">
                                <label htmlFor="price" className="block mb-2 font-semibold">Giá <span className="text-danger">*</span></label>
                                <input
                                    id="price"
                                    type="number"
                                    name="price"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={handleNumberChange}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="discountPercentage" className="block mb-2 font-semibold">Giảm giá (%)</label>
                                <input
                                    id="discountPercentage"
                                    type="number"
                                    name="discountPercentage"
                                    className="form-input"
                                    value={formData.discountPercentage}
                                    onChange={handleNumberChange}
                                    min="0"
                                    max="100"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="mb-4">
                                <label htmlFor="stock" className="block mb-2 font-semibold">Số lượng <span className="text-danger">*</span></label>
                                <input
                                    id="stock"
                                    type="number"
                                    name="stock"
                                    className="form-input"
                                    value={formData.stock}
                                    onChange={handleNumberChange}
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="brand" className="block mb-2 font-semibold">Thương hiệu</label>
                                <input
                                    id="brand"
                                    type="text"
                                    name="brand"
                                    className="form-input"
                                    value={formData.brand}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="sku" className="block mb-2 font-semibold">SKU <span className="text-danger">*</span></label>
                            <input
                                id="sku"
                                type="text"
                                name="sku"
                                className="form-input"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="tags" className="block mb-2 font-semibold">Tags (phân cách bằng dấu phẩy)</label>
                            <input
                                id="tags"
                                type="text"
                                name="tags"
                                className="form-input"
                                value={formData.tags}
                                onChange={handleTagsChange}
                                placeholder="tag1, tag2, tag3"
                            />
                        </div>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div className="panel p-4 border border-gray-200 rounded-md">
                        <h6 className="mb-4 text-base font-medium">Thông tin bổ sung</h6>
                        
                        <div className="mb-4">
                            <label htmlFor="weight" className="block mb-2 font-semibold">Trọng lượng</label>
                            <input
                                id="weight"
                                type="text"
                                name="weight"
                                className="form-input"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="Ví dụ: 500g"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="dimensions" className="block mb-2 font-semibold">Kích thước</label>
                            <input
                                id="dimensions"
                                type="text"
                                name="dimensions"
                                className="form-input"
                                value={formData.dimensions}
                                onChange={handleChange}
                                placeholder="Ví dụ: 10 x 20 x 5 cm"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="warrantyInformation" className="block mb-2 font-semibold">Thông tin bảo hành</label>
                            <textarea
                                id="warrantyInformation"
                                name="warrantyInformation"
                                className="form-textarea"
                                value={formData.warrantyInformation}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="shippingInformation" className="block mb-2 font-semibold">Thông tin vận chuyển</label>
                            <textarea
                                id="shippingInformation"
                                name="shippingInformation"
                                className="form-textarea"
                                value={formData.shippingInformation}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="availabilityStatus" className="block mb-2 font-semibold">Trạng thái</label>
                            <select
                                id="availabilityStatus"
                                name="availabilityStatus"
                                className="form-select"
                                value={formData.availabilityStatus}
                                onChange={handleChange}
                            >
                                <option value="Còn hàng">Còn hàng</option>
                                <option value="Hết hàng">Hết hàng</option>
                                <option value="Đặt trước">Đặt trước</option>
                                <option value="Ngừng kinh doanh">Ngừng kinh doanh</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="returnPolicy" className="block mb-2 font-semibold">Chính sách đổi trả</label>
                            <textarea
                                id="returnPolicy"
                                name="returnPolicy"
                                className="form-textarea"
                                value={formData.returnPolicy}
                                onChange={handleChange}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Hình ảnh */}
                <div className="panel p-4 border border-gray-200 rounded-md">
                    <h6 className="mb-4 text-base font-medium">Hình ảnh sản phẩm</h6>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Thumbnail */}
                        <div>
                            <label className="block mb-2 font-semibold">Ảnh đại diện <span className="text-danger">*</span></label>
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                        {thumbnailPreview ? (
                                            <div className="relative w-full h-full">
                                                <img 
                                                    src={thumbnailPreview} 
                                                    alt="Thumbnail preview" 
                                                    className="object-contain w-full h-full p-2"
                                                />
                                                <button 
                                                    type="button"
                                                    className="absolute top-2 right-2 p-1 bg-danger text-white rounded-full"
                                                    onClick={removeThumbnail}
                                                >
                                                    <IconX className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                                </svg>
                                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Nhấp để tải lên</span> hoặc kéo thả</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG hoặc GIF</p>
                                            </div>
                                        )}
                                        <input 
                                            id="thumbnail" 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleThumbnailChange}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block mb-2 font-semibold">Hình ảnh khác</label>
                            <div className="mb-4">
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                                            </svg>
                                            <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Nhấp để tải lên</span> hoặc kéo thả</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG hoặc GIF (Có thể chọn nhiều)</p>
                                        </div>
                                        <input 
                                            id="images" 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*"
                                            multiple
                                            onChange={handleImagesChange}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Hiển thị ảnh đã chọn */}
                            {imagesPreviews.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    {imagesPreviews.map((preview, index) => (
                                        <div key={index} className="relative">
                                            <img 
                                                src={preview} 
                                                alt={`Preview ${index}`} 
                                                className="object-cover w-full h-24 rounded-md"
                                            />
                                            <button 
                                                type="button"
                                                className="absolute top-1 right-1 p-1 bg-danger text-white rounded-full"
                                                onClick={() => removeImage(index)}
                                            >
                                                <IconX className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end mt-8">
                    <button 
                        type="button" 
                        className="btn btn-outline-danger ltr:mr-2 rtl:ml-2"
                        onClick={() => router.push('/datatables/checkbox')}
                        disabled={isLoading}
                    >
                        Hủy
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang xử lý...' : 'Cập nhật sản phẩm'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProduct;
