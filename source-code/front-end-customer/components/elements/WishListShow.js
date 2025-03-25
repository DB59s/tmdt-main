'use client'
import { fetchWishlist } from "@/features/wishlistSlice"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"

export default function WishListShow() {
    const { wishlist, loading } = useSelector((state) => state.wishlist) || {}
    const [mounted, setMounted] = useState(false)
    const dispatch = useDispatch()

    useEffect(() => {
        setMounted(true)
        dispatch(fetchWishlist())
    }, [dispatch])

    // Don't show count until client-side hydration is complete
    if (!mounted) return <span className="tp-product-count">0</span>

    return (
        <>
            <span className="tp-product-count">{loading ? '...' : wishlist?.length || 0}</span>
        </>
    )
}
