import ProductsList from '@/components/manage-products/products-list';
import React from 'react';

export const metadata = {
    title: 'Products Management',
};

const ProductsPage = () => {
    return (
        <div>
            <ProductsList />
        </div>
    );
};

export default ProductsPage;
