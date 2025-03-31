'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const SetSaleByCategory = () => {
    const apiUrl = process.env.domainApi;
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/customer/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                setError('Failed to load categories. Please try again later.');
            }
        };

        fetchCategories();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        if (!selectedCategory) {
            setError('Please select a category');
            setIsLoading(false);
            return;
        }

        if (!discountPercentage || isNaN(parseFloat(discountPercentage))) {
            setError('Please enter a valid discount percentage');
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${apiUrl}/api/admin/products/set-sale-by-category`, {
                categoryId: selectedCategory,
                discountPercentage: parseFloat(discountPercentage)
            }, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });

            setSuccess(`Success: ${response.data.message}`);
            setDiscountPercentage('');
        } catch (error) {
            console.error('Error setting sale by category:', error);
            setError(error.response?.data?.message || 'An error occurred while setting sale status');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="panel p-6 border border-gray-200 rounded-md shadow-sm">
            <h5 className="text-lg font-semibold mb-5">Set Sale Status by Category</h5>
            
            {error && (
                <div className="mb-5 rounded-md bg-danger-light p-3 text-danger">
                    <span className="font-semibold">Error:</span> {error}
                </div>
            )}
            
            {success && (
                <div className="mb-5 rounded-md bg-success-light p-3 text-success">
                    <span className="font-semibold">Success:</span> {success}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-4">
                    <label htmlFor="categoryId" className="block mb-2 text-sm font-medium">Select Category</label>
                    <select
                        id="categoryId"
                        className="form-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className="mb-4">
                    <label htmlFor="discountPercentage" className="block mb-2 text-sm font-medium">Discount Percentage (%)</label>
                    <input
                        id="discountPercentage"
                        type="number"
                        className="form-input"
                        value={discountPercentage}
                        onChange={(e) => setDiscountPercentage(e.target.value)}
                        placeholder="e.g. 20"
                        min="0"
                        max="99.99"
                        step="0.01"
                        required
                    />
                </div>
                
                <div className="mb-4 p-4 bg-info-light rounded-md">
                    <h6 className="font-semibold mb-2">What This Will Do:</h6>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Set <strong>all products</strong> in the selected category to "On Sale" status</li>
                        <li>Apply the specified discount percentage to all products in the category</li>
                        <li>Set all other products to "Not On Sale" status</li>
                        <li>Original prices will be recalculated based on the discount percentage</li>
                    </ul>
                </div>
                
                <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Apply Sale to Category'}
                </button>
            </form>
        </div>
    );
};

export default SetSaleByCategory;