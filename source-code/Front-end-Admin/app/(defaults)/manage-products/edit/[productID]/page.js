import EditProduct from '@/components/manage-products/edit-product';

const EditProductPage = ({params}) => {
    const productID = params.productID;
    return (
        <EditProduct productID={params.productID} />
    )
}

export default EditProductPage;
