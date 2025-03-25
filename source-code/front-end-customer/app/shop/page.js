'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import ProductList from '@/components/shop/ProductList'
import FilterShopBox from '@/components/shop/FilterShopBox'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const ShopPage = () => {
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })
  const [sortOption, setSortOption] = useState('newest')
  const [perPage, setPerPage] = useState(12)
  const [viewMode, setViewMode] = useState('grid')
  const [onSaleFilter, setOnSaleFilter] = useState(null) // null = no filter, true = on sale, false = not on sale
  
  // Get parameters from URL if present
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
    
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearchTerm(searchParam)
    }
    
    const onSaleParam = searchParams.get('onSale')
    if (onSaleParam !== null) {
      setOnSaleFilter(onSaleParam === 'true')
    }
    
    // Fetch categories
    fetchCategories()
  }, [searchParams])
  
  const fetchCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.domainApi}/api/customer/categories`)
      const data = await response.json()
      
      if (data) {
        setCategories(data)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    // The search will trigger based on the searchTerm state change
  }
  
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId)
  }
  
  const handlePriceChange = (e) => {
    const { name, value } = e.target
    setPriceRange({
      ...priceRange,
      [name]: parseInt(value, 10)
    })
  }
  
  // Handle different filter changes
  const handleSortChange = (value) => {
    setSortOption(value)
  }
  
  const handlePerPageChange = (value) => {
    setPerPage(value)
  }
  
  const handleViewModeChange = (mode) => {
    setViewMode(mode)
  }
  
  const handleOnSaleChange = (value) => {
    setOnSaleFilter(value)
    
    // Update URL with onSale parameter
    const url = new URL(window.location.href)
    if (value === null) {
      url.searchParams.delete('onSale')
    } else {
      url.searchParams.set('onSale', value.toString())
    }
    window.history.pushState({}, '', url)
  }
  
  console.log(onSaleFilter)

  return (
    <Layout headerStyle={3} footerStyle={1} breadcrumbTitle="Shop">
      <div className="product-filter-area pt-65 pb-40">
        <div className="container">
          <FilterShopBox 
            itemStart={1} 
            itemEnd={categories?.length || 0} 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSortChange={handleSortChange}
            onPerPageChange={handlePerPageChange}
            onViewModeChange={handleViewModeChange}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            categories={categories}
            loading={loading}
            handleCategorySelect={handleCategorySelect}
            handleOnSaleChange={handleOnSaleChange}
            onSale={onSaleFilter}
          />
        </div>
      </div>
      
      <section className="shop-area pt-30 pb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="shop-banner mb-30">

              </div>
              
              <ProductList 
                category={selectedCategory}
                searchTerm={searchTerm}
                limit={perPage}
                sortOption={sortOption}
                viewMode={viewMode}
                priceRange={priceRange}
                onSale={onSaleFilter}
              />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  )
}

export default ShopPage