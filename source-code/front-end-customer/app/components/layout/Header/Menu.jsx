import Link from 'next/link'

const MobileNavItem = ({ show, showItems }) => {
  return (
    <ul>
      <li><Link href="/">Home</Link></li>
      <li><Link href="/about">About</Link></li>
      <li><Link href="/shop">Shop</Link></li>
      <li className={`has-dropdown ${show === 2 ? "active" : ""}`}>
        <a onClick={() => showItems(2)}>Shop Functions<i className="fal fa-plus"></i></a>
        <ul className={`submenu ${show === 2 ? "active" : ""}`}>
          <li><Link href="/cart">Shopping Cart</Link></li>
          <li><Link href="/wishlist">Wishlist</Link></li>
          <li><Link href="/checkout">Checkout</Link></li>
          <li><Link href="/order-tracking">Order Tracking</Link></li>
          <li><Link href="/refund-status">Refund Status</Link></li>
          <li><Link href="/my-order">My Orders</Link></li>
        </ul>
      </li>
      <li><Link href="/blog">Blog</Link></li>
      <li><Link href="/contact">Contact</Link></li>
    </ul>
  )
}

// Desktop menu
const NavMenu = () => {
  return (
    <ul>
      <li><Link href="/">Home</Link></li>
      <li><Link href="/about">About</Link></li>
      <li><Link href="/shop">Shop</Link></li>
      <li className="menu-item-has-children has-mega-menu">
        <Link href="#">Shop Functions</Link>
        <div className="mega-menu tp-submenu">
          <div className="mega-menu-inner">
            <div className="row">
              <div className="col-xl-6">
                <div className="mega-menu-item-wrapper">
                  <span className="mega-menu-item-title">Shopping Features</span>
                  <ul>
                    <li><Link href="/cart">Shopping Cart</Link></li>
                    <li><Link href="/wishlist">Wishlist</Link></li>
                    <li><Link href="/checkout">Checkout</Link></li>
                    <li><Link href="/order-tracking">Order Tracking</Link></li>
                    <li><Link href="/refund-status">Refund Status</Link></li>
                    <li><Link href="/my-order">My Orders</Link></li>
                  </ul>
                </div>
              </div>
              <div className="col-xl-6">
                <div className="mega-menu-item-wrapper">
                  <span className="mega-menu-item-title">Account</span>
                  <ul>
                    <li><Link href="/login">Login</Link></li>
                    <li><Link href="/register">Register</Link></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </li>
      <li><Link href="/blog">Blog</Link></li>
      <li><Link href="/contact">Contact</Link></li>
    </ul>
  )
} 