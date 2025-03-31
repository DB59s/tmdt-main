import React from 'react';
import CategoryDetail from '@/components/manage-categories/category-detail';

export const metadata = {
    title: 'Chi tiết danh mục',
};

const CategoryDetailPage = ({ params }) => {
    return <CategoryDetail categoryId={params.id} />;
};

export default CategoryDetailPage; 