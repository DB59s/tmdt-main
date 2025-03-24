'use client'
import { reloadCart, fetchCartFromAPI } from "@/features/shopSlice"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"

export default function CartShow() {
    const { cart, status } = useSelector((state) => state.shop) || {}
    const dispatch = useDispatch()
    const [cartLength, setCartLength] = useState(0)

    useEffect(() => {
        // Tải dữ liệu từ localStorage
        dispatch(reloadCart())
        
        // Sau đó, tải dữ liệu từ API
        dispatch(fetchCartFromAPI())
            .unwrap()
            .then(data => {
                if (data && data.items) {
                    setCartLength(data.items.length)
                }
            })
            .catch(error => {
                console.error("Failed to fetch cart length:", error)
            })
    }, [dispatch])
    
    // Cập nhật số lượng mỗi khi giỏ hàng thay đổi
    useEffect(() => {
        setCartLength(cart?.length || 0)
    }, [cart])
    
    return (
        <>
            <span className="tp-product-count">{cartLength || 0}</span>
        </>
    )
}
