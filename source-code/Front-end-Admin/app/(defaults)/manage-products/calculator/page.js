import ProductPriceCalculator from '@/components/manage-products/product-price-calculator';
import React from 'react';

export const metadata = {
    title: 'Product Price Calculator',
};

const ProductPriceCalculatorPage = () => {
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Product Price Calculator</h5>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <ProductPriceCalculator />
                
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-5">How Price Calculation Works</h5>
                    <p className="mb-4">
                        This calculator helps you determine the original price of a product before a discount, 
                        based on the current (discounted) price and the discount percentage.
                    </p>
                    <div className="mb-4">
                        <h6 className="font-semibold mb-2">Formula Used:</h6>
                        <p className="font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                            Original Price = Current Price / (1 - (Discount Percentage / 100))
                        </p>
                    </div>
                    <div className="mb-4">
                        <h6 className="font-semibold mb-2">Example:</h6>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Current price: $80</li>
                            <li>Discount: 20%</li>
                            <li>Original price: $80 / (1 - (20 / 100)) = $80 / 0.8 = $100</li>
                        </ul>
                    </div>
                    <p>
                        The result is always rounded to 2 decimal places for accuracy in pricing.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProductPriceCalculatorPage; 