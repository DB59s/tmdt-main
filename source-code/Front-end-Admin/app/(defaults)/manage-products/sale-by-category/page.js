import SetSaleByCategory from '@/components/manage-products/set-sale-by-category';
import React from 'react';
import Link from 'next/link';

export const metadata = {
    title: 'Set Sale by Category',
};

const SetSaleByCategoryPage = () => {
    return (
        <div>
            <div className="flex items-center justify-between mb-5">
                <h5 className="text-lg font-semibold dark:text-white-light">Set Products On Sale by Category</h5>
                <Link href="/manage-products" className="btn btn-outline-primary">
                    Back to Products
                </Link>
            </div>
            <div className="grid grid-cols-1 gap-6">
                <SetSaleByCategory />
                
                <div className="panel p-6">
                    <h5 className="text-lg font-semibold mb-5">About This Feature</h5>
                    <p className="mb-4">
                        This tool allows you to quickly set all products within a specific category to "On Sale" status
                        while simultaneously setting all other products to "Not On Sale".
                    </p>
                    <p className="mb-4">
                        This is particularly useful for running category-specific promotions or sales events.
                    </p>
                    <div className="bg-warning-light p-4 rounded-md">
                        <h6 className="font-semibold mb-2">Important Notes:</h6>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>This action will affect <strong>ALL</strong> products in your store</li>
                            <li>Products not in the selected category will be set to "Not On Sale"</li>
                            <li>This action cannot be automatically reversed - you'll need to manually update products or run this tool again with a different category</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetSaleByCategoryPage; 