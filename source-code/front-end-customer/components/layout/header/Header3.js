'use client'
import CartShow from "@/components/elements/CartShow"
import WishListShow from "@/components/elements/WishListShow"
import SearchBox from "@/components/elements/SearchBox"
import Link from "next/link"
import { useState, useEffect } from "react"
import HeaderMobSticky from "../HeaderMobSticky"
import HeaderSticky from "../HeaderSticky"
import HeaderTabSticky from "../HeaderTabSticky"

export default function Header3({ scroll, isMobileMenu, handleMobileMenu, isCartSidebar, handleCartSidebar }) {
    const [categories, setCategories] = useState([])
    const [isToggled, setToggled] = useState(false)
    const [isOffcanvas, setIsOffcanvas] = useState(false)
    
    useEffect(() => {
        fetchCategories()
    }, [])
    
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${process.env.domainApi}/api/customer/categories`)
            const data = await response.json()
            
            if (data) {
                setCategories(data|| [])
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }
    
    const handleToggle = () => setToggled(!isToggled)
    return (
        <>
            <header>
                <div className="header-top tertiary-header-top space-bg">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-7 col-lg-12 col-md-12 ">
                                <div className="header-welcome-text">
                                    <span>Welcome to Duy Khien shop.</span>
                                    <Link href="#">Shop Now<i className="fal fa-long-arrow-right" /></Link>
                                </div>
                            </div>
                            <div className="col-xl-5 d-none d-xl-block">
                                <div className="headertoplag d-flex align-items-center justify-content-end">
                                    <div className="headertoplag__lang">
                                        <ul>
                                            <li>
                                                {/* <Link href="#"><i className="fal fa-user" /> Account</Link> */}
                                                <Link className="order-tick" href="/order-tracking"><i className="fal fa-plane-departure" />Track Your Order</Link>
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="menu-top-social">
                                        <Link href="#"><i className="fab fa-facebook-f" /></Link>
                                        <Link href="#"><i className="fab fa-twitter" /></Link>
                                        <Link href="#"><i className="fab fa-behance" /></Link>
                                        <Link href="#"><i className="fab fa-youtube" /></Link>
                                        <Link href="#"><i className="fab fa-linkedin" /></Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="logo-area green-logo-area mt-30 d-none d-xl-block">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-xl-2 col-lg-3">
                                <div className="logo">
                                    <Link href="/"><img src="/assets/img/logo/logo.png" alt="logo" style={{width: '200px' , height : "auto"}} /></Link>
                                </div>
                            </div>
                            <div className="col-xl-10 col-lg-9">
                                <div className="header-meta-info d-flex align-items-center justify-content-between">
                                    <div className="header-search-bar">
                                        <SearchBox />
                                    </div>
                                    <div className="header-meta header-brand d-flex align-items-center">
                                    <div className="header-meta__lang">
                                            <ul>
                                                <li>
                                                    <Link href="#">
                                                        <img src="/assets/img/icon/vietnam.png" alt="flag" style={{width: '20px', height: 'auto'}}/>Vietnamese
                                                        <span><i className="fal fa-angle-down" /></span>
                                                    </Link>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="header-meta__value mr-15">
                                            <span>VNĐ</span>
                                        </div>
                                        <div className="header-meta__social d-flex align-items-center ml-25">
                                            <button className="header-cart p-relative tp-cart-toggle" onClick={handleCartSidebar}>
                                                <i className="fal fa-shopping-cart" />
                                                <CartShow />
                                            </button>
                                            <Link href="/wishlist" className="header-cart p-relative tp-cart-toggle">
                                                <i className="fal fa-heart" />
                                                <WishListShow />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="main-menu-area tertiary-main-menu mt-25 d-none d-xl-block">
                    <div className="container">
                        <div className="row align-items-center">
                            <div className="col-xl-2 col-lg-3">
                                <div className="cat-menu__category p-relative">
                                    <a onClick={handleToggle} href="#"><i className="fal fa-bars" />Categories</a>
                                    <div className="category-menu" style={{ display: `${isToggled ? "block" : "none"}` }}>
                                        <ul className="cat-menu__list">
                                            {categories && categories.length > 0 ? (
                                                categories.map((category, index) => (
                                                    <li key={category._id}>
                                                        <Link href={`/shop?category=${category._id}`}>
                                                            <i className={`fal ${getCategoryIcon(category.name)}`} /> {formatCategoryName(category.name)}
                                                        </Link>
                                                    </li>
                                                ))
                                            ) : (
                                                <li><span>Loading categories...</span></li>
                                            )}
                                        </ul>
                                        <div className="coupon-offer d-flex align-items-center justify-content-between">
                                            <span>Coupon: <Link href="/shop">Offers50</Link></span>
                                            <Link href="#"> <i className="fal fa-copy" /></Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-7 col-lg-6">
                                    <div className="main-menu">
                                        <nav id="mobile-menu">
                                            <ul>
                                                <li className="">
                                                    <Link href="/">Home</Link>
                                                </li>
                                                <li className="">
                                                    <Link href="/shop">Shop</Link>
                                                </li>
                                                <li className="">
                                                    <Link href="/my-order">My Order</Link>
                                                </li>
                                                <li className="">
                                                    <Link href="/my-returns">My Returns</Link>
                                                </li>
                                                <li className="has-dropdown">
                                                    <Link href="/blog">Blog</Link>
                                                    <ul className="submenu">
                                                        <li><Link href="/blog">Blog</Link></li>
                                                        <li><Link href="/blog-details">Blog Details</Link></li>
                                                    </ul>
                                                </li>
                                                <li><Link href="/contact">Contact</Link></li>
                                            </ul>
                                        </nav>
                                    </div>
                                </div>
                            <div className="col-xl-3 col-lg-3">
                                <div className="menu-contact">
                                    <ul>
                                        <li>
                                            <div className="menu-contact__item">
                                                <div className="menu-contact__icon">
                                                    <i className="fal fa-phone" />
                                                </div>
                                                <div className="menu-contact__info">
                                                    <Link href="/tel:0123456">0919534982</Link>
                                                </div>
                                            </div>
                                        </li>
                                        <li>
                                            {/* <div className="menu-contact__item">
                                                <div className="menu-contact__icon">
                                                    <i className="fal fa-map-marker-alt" />
                                                </div>
                                                <div className="menu-contact__info">
                                                    <Link href="/shop-location">Find Store</Link>
                                                </div>
                                            </div> */}
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <HeaderSticky scroll={scroll} isCartSidebar={isCartSidebar} handleCartSidebar={handleCartSidebar} />
            <HeaderTabSticky scroll={scroll} isMobileMenu={isMobileMenu} handleMobileMenu={handleMobileMenu} isCartSidebar={isCartSidebar} handleCartSidebar={handleCartSidebar} />
            <HeaderMobSticky scroll={scroll} isMobileMenu={isMobileMenu} handleMobileMenu={handleMobileMenu} isCartSidebar={isCartSidebar} handleCartSidebar={handleCartSidebar} />
        </>
    )
}

// Helper function to format category names - convert kebab-case to Title Case
const formatCategoryName = (name) => {
    if (!name) return '';
    return name
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// Helper function to get an appropriate icon based on category name
const getCategoryIcon = (categoryName) => {
    const iconMap = {
        'beauty': 'fa-smile',
        'fragrances': 'fa-spray-can',
        'furniture': 'fa-chair',
        'groceries': 'fa-shopping-basket',
        'home-decoration': 'fa-home',
        'kitchen-accessories': 'fa-utensils',
        'laptops': 'fa-laptop',
        'mens-shirts': 'fa-tshirt',
        'mens-shoes': 'fa-shoe-prints',
        'mens-watches': 'fa-clock',
        'mobile-accessories': 'fa-mobile-alt',
        'motorcycle': 'fa-motorcycle',
        'skin-care': 'fa-heart',
        'smartphones': 'fa-mobile',
        'sports-accessories': 'fa-futbol'
    };
    
    return iconMap[categoryName] || 'fa-tag';
};
