'use client'
import CartShow from "@/components/elements/CartShow"
import WishListShow from "@/components/elements/WishListShow"
import Link from "next/link"
import { useState, useEffect } from "react"
import HeaderMobSticky from "../HeaderMobSticky"
import HeaderSticky from "../HeaderSticky"
import HeaderTabSticky from "../HeaderTabSticky"
import { useSelector } from "react-redux"


export default function Header1({ scroll, isMobileMenu, handleMobileMenu, isCartSidebar, handleCartSidebar }) {
    const [categories, setCategories] = useState([])
    const [isToggled, setToggled] = useState(true)
    const [isOffcanvas, setIsOffcanvas] = useState(false)

    const { cart } = useSelector((state) => state.shop) || {}
    const cartLength = cart?.length || 0

    useEffect(() => {
        fetchCategories()
    }, [])
    
    const fetchCategories = async () => {
        try {
            const response = await fetch(`${process.env.domainApi}/api/customer/categories`)
            const data = await response.json()
            
            if (data) {
                setCategories(data || [])
            }
        } catch (err) {
            console.error('Failed to fetch categories:', err)
        }
    }
    
    const handleToggle = () => setToggled(!isToggled)
    return (
        <>
            <header>
                <div className="header-top space-bg">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <div className="header-welcome-text text-start ">
                                    {/* <span>Welcome to our international shop! Enjoy free shipping on orders $100  up.</span> */}
                                    <Link href="/shop">Shop Now <i className="fal fa-long-arrow-right" /> </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="logo-area mt-30 d-none d-xl-block">
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
                                        <form action="#">
                                            <div className="search-info p-relative">
                                                <button className="header-search-icon"><i className="fal fa-search" /></button>
                                                <input type="text" placeholder="Search products..." />
                                            </div>
                                        </form>
                                    </div>
                                    <div className="header-meta header-brand d-flex align-items-center">
                                        <div className="header-meta__lang">
                                            <ul>
                                                <li>
                                                    <Link href="#">
                                                        <img src="/assets/img/icon/lang-flag.png" alt="flag" />English
                                                        <span><i className="fal fa-angle-down" /></span>
                                                    </Link>
                                                    <ul className="header-meta__lang-submenu">
                                                        <li>
                                                            <Link href="#">Arabic</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="#">Spanish</Link>
                                                        </li>
                                                        <li>
                                                            <Link href="#">Mandarin</Link>
                                                        </li>
                                                    </ul>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="header-meta__value mr-15">
                                            <select>
                                                <option>USD</option>
                                                <option>YEAN</option>
                                                <option>EURO</option>
                                            </select>
                                        </div>
                                        <div className="header-meta__social d-flex align-items-center ml-25">
                                            <button className="header-cart p-relative tp-cart-toggle" onClick={handleCartSidebar}>
                                                <i className="fal fa-shopping-cart" />
                                                <span className="tp-product-count">{cartLength}</span>
                                            </button>
                                            <Link href="/sign-in"><i className="fal fa-user" /></Link>
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
                <div className="main-menu-area mt-20 d-none d-xl-block">
                    <div className="for-megamenu p-relative">
                        <div className="container">
                            <div className="row align-items-center">
                                <div className="col-xl-2 col-lg-3">
                                    <div className="cat-menu__category p-relative">
                                        <a className="tp-cat-toggle" onClick={handleToggle} role="button"><i className="fal fa-bars" />Categories</a>
                                        <div className="category-menu category-menu-off" style={{ display: `${isToggled ? "block" : "none"}` }}>
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
                                            <div className="daily-offer">
                                                <ul>
                                                    <li><Link href="/shop">Value of the Day</Link></li>
                                                    <li><Link href="/shop">Top 100 Offers</Link></li>
                                                    <li><Link href="/shop">New Arrivals</Link></li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-7 col-lg-6">
                                    <div className="main-menu">
                                        <nav id="mobile-menu">
                                            <ul>
                                                <li className="has-dropdown">
                                                    <Link href="/">Home</Link>
                                                    <ul className="submenu">
                                                        <li><Link href="/">Wooden Home</Link></li>
                                                        <li><Link href="/index-2">Fashion Home</Link></li>
                                                        <li><Link href="/index-3">Furniture Home</Link></li>
                                                        <li><Link href="/index-4">Cosmetics Home</Link></li>
                                                        <li><Link href="/index-5">Food Grocery</Link></li>
                                                    </ul>
                                                </li>
                                                <li className="has-dropdown">
                                                    <Link href="/shop">Shop</Link>
                                                    <ul className="submenu">
                                                        <li><Link href="/shop">Shop</Link></li>
                                                        <li><Link href="/shop-2">Shop 2</Link></li>
                                                        <li><Link href="/shop-details">Shop Details </Link></li>
                                                        <li><Link href="/shop-details-2">Shop Details 2</Link></li>
                                                        <li><Link href="/shop-location">Shop Location</Link></li>
                                                        <li><Link href="/cart">Cart</Link></li>
                                                        <li><Link href="/sign-in">Sign In</Link></li>
                                                        <li><Link href="/checkout">Checkout</Link></li>
                                                        <li><Link href="/wishlist">Wishlist</Link></li>
                                                        <li><Link href="/track">Product Track</Link></li>
                                                    </ul>
                                                </li>
                                                <li className="has-dropdown has-megamenu">
                                                    <Link href="/about">Pages</Link>
                                                    <ul className="submenu mega-menu">
                                                        <li>
                                                            <a className="mega-menu-title">Page layout</a>
                                                            <ul>
                                                                <li><Link href="/shop">Shop filters v1</Link></li>
                                                                <li><Link href="/shop-2">Shop filters v2</Link></li>
                                                                <li><Link href="/shop-details">Shop sidebar</Link></li>
                                                                <li><Link href="/shop-details-2">Shop Right sidebar</Link></li>
                                                                <li><Link href="/shop-location">Shop List view</Link></li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <a className="mega-menu-title">Page layout</a>
                                                            <ul>
                                                                <li><Link href="/about">About</Link></li>
                                                                <li><Link href="/cart">Cart</Link></li>
                                                                <li><Link href="/checkout">Checkout</Link></li>
                                                                <li><Link href="/sign-in">Sign In</Link></li>
                                                                <li><Link href="/sign-in">Log In</Link></li>
                                                            </ul>
                                                        </li>
                                                        <li>
                                                            <a className="mega-menu-title">Page type</a>
                                                            <ul>
                                                                <li><Link href="/track">Product Track</Link></li>
                                                                <li><Link href="/wishlist">Wishlist</Link></li>
                                                                <li><Link href="/not-found">404 / Error</Link></li>
                                                                <li><Link href="/coming-soon">Coming Soon</Link></li>
                                                            </ul>
                                                        </li>
                                                    </ul>
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
