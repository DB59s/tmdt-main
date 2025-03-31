'use client';
import { useState } from 'react';
import axios from 'axios';

const ProductPriceCalculator = () => {
    const apiUrl = process.env.domainApi;
    const [formData, setFormData] = useState({
        price: '',
        discountPercentage: '',
    });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        setIsLoading(true);

        if (!formData.price || !formData.discountPercentage) {
            setError('Please provide both price and discount percentage');
            setIsLoading(false);
            return;
        }

        try {
                const response = await axios.post(`${apiUrl}/api/admin/products/calculate-price`, {
                price: parseFloat(formData.price),
                discountPercentage: parseFloat(formData.discountPercentage)
            }, {
                headers: {
                    authorization: `${sessionStorage.getItem('token')}`
                }
            });
            
            setResult(response.data);
        } catch (error) {
            console.error('Error calculating price:', error);
            setError(error.response?.data?.message || 'An error occurred while calculating the price');
        } finally {
            setIsLoading(false);
        }
    };

    // Manual calculation for preview
    const calculateManual = () => {
        if (!formData.price || !formData.discountPercentage) return null;
        
        const price = parseFloat(formData.price);
        const discountPercentage = parseFloat(formData.discountPercentage);
        
        if (isNaN(price) || isNaN(discountPercentage)) return null;
        
        const priceBeforeSale = price / (1 - (discountPercentage / 100));
        return {
            price,
            discountPercentage,
            priceBeforeSale: Math.round(priceBeforeSale * 100) / 100
        };
    };

    const previewResult = calculateManual();

    return (
        <div className="panel p-6 border border-gray-200 rounded-md shadow-sm">
            <h5 className="text-lg font-semibold mb-5">Price Calculator</h5>
            
            {error && (
                <div className="mb-5 rounded-md bg-danger-light p-3 text-danger">
                    <span className="font-semibold">Error:</span> {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="price" className="block mb-2 text-sm font-medium">Current Price</label>
                    <input
                        id="price"
                        type="number"
                        name="price"
                        className="form-input"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="e.g. 100"
                        min="0"
                        step="0.01"
                    />
                </div>
                
                <div className="mb-4">
                    <label htmlFor="discountPercentage" className="block mb-2 text-sm font-medium">Discount Percentage (%)</label>
                    <input
                        id="discountPercentage"
                        type="number"
                        name="discountPercentage"
                        className="form-input"
                        value={formData.discountPercentage}
                        onChange={handleChange}
                        placeholder="e.g. 20"
                        min="0"
                        max="99.99"
                        step="0.01"
                    />
                </div>
                
                {previewResult && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <h6 className="text-sm font-medium mb-2">Preview Calculation:</h6>
                        <p className="text-sm">Original Price: <span className="font-semibold">${previewResult.priceBeforeSale.toFixed(2)}</span></p>
                        <p className="text-sm">Discount: <span className="font-semibold">{previewResult.discountPercentage}%</span></p>
                        <p className="text-sm">Current Price: <span className="font-semibold">${previewResult.price.toFixed(2)}</span></p>
                    </div>
                )}
                
                <button 
                    type="submit" 
                    className="btn btn-primary mt-2"
                    disabled={isLoading}
                >
                    {isLoading ? 'Calculating...' : 'Calculate Price'}
                </button>
            </form>
            
            {result && (
                <div className="mt-5 p-4 bg-success-light rounded-md">
                    <h6 className="font-semibold mb-3">Calculation Result:</h6>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-white rounded-md shadow-sm">
                            <p className="text-sm text-gray-500">Original Price</p>
                            <p className="text-lg font-bold">${result.priceBeforeSale.toFixed(2)}</p>
                        </div>
                        <div className="p-3 bg-white rounded-md shadow-sm">
                            <p className="text-sm text-gray-500">Discount</p>
                            <p className="text-lg font-bold">{result.discountPercentage}%</p>
                        </div>
                        <div className="p-3 bg-white rounded-md shadow-sm">
                            <p className="text-sm text-gray-500">Current Price</p>
                            <p className="text-lg font-bold">${result.price.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductPriceCalculator; 