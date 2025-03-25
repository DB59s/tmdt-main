'use client'
import { useState } from 'react'
import WishlistItems from "@/components/elements/WishlistItems"
import Layout from "@/components/layout/Layout"
import { useDispatch } from 'react-redux'
import { clearWishlist } from '@/features/wishlistSlice'
import { toast } from 'react-toastify'
import Link from 'next/link'

export default function Wishlist() {
    const [clearing, setClearing] = useState(false)
    const dispatch = useDispatch()

    const handleClearWishlist = async () => {
        if (window.confirm('Are you sure you want to clear your wishlist?')) {
            setClearing(true)
            try {
                await dispatch(clearWishlist()).unwrap()
                toast.success('Wishlist cleared successfully')
            } catch (error) {
                toast.error('Failed to clear wishlist')
            } finally {
                setClearing(false)
            }
        }
    }

    return (
        <>
            <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Wishlist">
                <div className="cart-area pt-80 pb-80 wow fadeInUp" data-wow-duration=".8s" data-wow-delay=".2s">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h3>My Wishlist</h3>
                                    <div>
                                        <button 
                                            className="btn btn-outline-danger btn-sm me-2"
                                            onClick={handleClearWishlist}
                                            disabled={clearing}
                                        >
                                            <i className="fa fa-trash me-1"></i> 
                                            {clearing ? 'Clearing...' : 'Clear Wishlist'}
                                        </button>
                                        <Link href="/shop" className="btn btn-primary btn-sm">
                                            <i className="fa fa-shopping-bag me-1"></i> Continue Shopping
                                        </Link>
                                    </div>
                                </div>

                                <form action="#">
                                    <div className="table-content table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th className="product-thumbnail">Images</th>
                                                    <th className="cart-product-name">Products</th>
                                                    <th className="product-price">Unit Price</th>
                                                    <th className="product-quantity">Quantity</th>
                                                    <th className="product-subtotal">Total</th>
                                                    <th className="product-add-to-cart">Add To Cart</th>
                                                    <th className="product-remove">Remove</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <WishlistItems />
                                            </tbody>
                                        </table>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    )
}