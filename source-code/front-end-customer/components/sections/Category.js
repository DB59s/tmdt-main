'use client'
import Link from "next/link"
import { useState, useEffect } from "react"

export default function Category() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTopCategories()
    }, [])

    const fetchTopCategories = async () => {
        try {
            const response = await fetch(`${process.env.domainApi}/api/customer/products/top-categories`)
            const data = await response.json()
            
            if (data && data.categories) {
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Failed to fetch top categories:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <section className="category-area pt-70">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="tpsection mb-40">
                                <h4 className="tpsection__title">Top <span> Categories <img src="/assets/img/icon/title-shape-01.jpg" alt="" /></span></h4>
                            </div>
                        </div>
                    </div>
                    <div className="custom-row category-border pb-45 justify-content-xl-between">
                        {loading ? (
                            <div className="text-center py-5 w-100">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            categories.map((category) => (
                                <div className="tpcategory mb-40" key={category._id}>
                                    <div className="tpcategory__icon p-relative">
                                        <img 
                                            src={category.thumbnail || "/assets/img/svg/cat01.svg"} 
                                            alt={category.name} 
                                            className={category.thumbnail ? "" : "fn__svg"} 
                                            style={{ maxHeight: "50px", objectFit: "contain" }}
                                        />
                                        <span>{category.productCount}</span>
                                    </div>
                                    <div className="tpcategory__content">
                                        <h5 className="tpcategory__title">
                                            <Link href={`/shop?category=${category._id}`}>{category.name}</Link>
                                        </h5>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </>
    )
}
