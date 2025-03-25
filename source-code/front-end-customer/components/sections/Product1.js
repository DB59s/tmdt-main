'use client'
import { useState, useEffect } from "react"
import ProductCard from "../shop/ProductCard"
import Link from "next/link"

export default function Product1() {
    const [activeIndex, setActiveIndex] = useState(1)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState('all')

    useEffect(() => {
        const statusLabels = {
            1: 'all',
            2: 'popular',
            3: 'on sale',
            4: 'best rated'
        }
        
        const currentStatus = statusLabels[activeIndex]
        setStatus(currentStatus)
        fetchProducts(currentStatus)
    }, [activeIndex])

    const fetchProducts = async (productStatus) => {
        setLoading(true)
        try {
            const response = await fetch(`${process.env.domainApi}/api/customer/products/by-status?status=${productStatus}`)
            const data = await response.json()
            
            if (data && data.products) {
                setProducts(data.products)
            }
        } catch (error) {
            console.error(`Failed to fetch ${productStatus} products:`, error)
        } finally {
            setLoading(false)
        }
    }

    const handleOnClick = (index) => {
        setActiveIndex(index)
    }

    const handleAddToCart = async (productId) => {
        try {
            const customerId = localStorage.getItem('customerId')
            const token = localStorage.getItem('token')
            
            let url = `${process.env.domainApi}/api/customer/cart/items`
            if (customerId) url += `/${customerId}`
            
            const headers = {
                'Content-Type': 'application/json'
            }
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
            
            // Find the product to get its onSale status and prices
            const productToAdd = products.find(p => (p._id || p.id) === productId)
            
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    productId,
                    quantity: 1,
                    onSale: productToAdd?.onSale || false,
                    price: productToAdd?.price || 0,
                    priceBeforeSale: productToAdd?.priceBeforeSale || productToAdd?.price || 0
                })
            })
            
            const data = await response.json()
            
            if (data.success) {
                // Show success notification
                alert('Product added to cart!')
            } else {
                // Show error notification
                alert(data.message || 'Failed to add product to cart')
            }
        } catch (err) {
            alert('An error occurred. Please try again.')
        }
    }

    return (
        <>
            <section className="product-area pt-95 pb-70">
                <div className="container">
                    <div className="row">
                        <div className="col-md-6 col-12">
                            <div className="tpsection mb-40">
                                <h4 className="tpsection__title">Popular <span> Products <img src="/assets/img/icon/title-shape-01.jpg" alt="" /></span></h4>
                            </div>
                        </div>
                        <div className="col-md-6 col-12">
                            <div className="tpnavbar">
                                <nav>
                                    <div className="nav nav-tabs" id="nav-tab" role="tablist">
                                        <button className={activeIndex == 1 ? "nav-link active" : "nav-link"} onClick={() => handleOnClick(1)}>All</button>
                                        <button className={activeIndex == 2 ? "nav-link active" : "nav-link"} onClick={() => handleOnClick(2)}>Popular</button>
                                        <button className={activeIndex == 3 ? "nav-link active" : "nav-link"} onClick={() => handleOnClick(3)}>On Sale</button>
                                        <button className={activeIndex == 4 ? "nav-link active" : "nav-link"} onClick={() => handleOnClick(4)}>Best Rated</button>
                                    </div>
                                </nav>
                            </div>
                        </div>
                    </div>
                    <div className="tab-content" id="nav-tabContent">
                        <div className="tab-pane fade show active" id="nav-products" role="tabpanel">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            ) : products.length === 0 ? (
                                <div className="alert alert-info">
                                    No products found for this category.
                                </div>
                            ) : (
                                <div className="row row-cols-xxl-5 row-cols-xl-4 row-cols-lg-3 row-cols-md-2 row-cols-sm-2 row-cols-1">
                                    {products.map((product) => (
                                        <div className="col" key={product._id || product.id}>
                                            <ProductCard 
                                                product={product}
                                                onAddToCart={handleAddToCart}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
