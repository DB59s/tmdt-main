'use client'
import { useState } from 'react'

const FilterShopBox = ({ 
  itemStart = 0, 
  itemEnd = 0, 
  searchTerm = '', 
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onSortChange,
  onPerPageChange,
  onViewModeChange,
  priceRange = { min: 0, max: 1000 },
  setPriceRange,
  categories = [],
  loading = false,
  handleCategorySelect
}) => {
  const [sort, setSort] = useState('newest')
  const [perPage, setPerPage] = useState(12)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false)

  const handleSort = (e) => {
    const value = e.target.value
    setSort(value)
    if (onSortChange) {
      onSortChange(value)
    }
  }
  
  const handlePerPage = (e) => {
    const value = parseInt(e.target.value)
    setPerPage(value)
    if (onPerPageChange) {
      onPerPageChange(value)
    }
  }
  
  const handleViewMode = (mode) => {
    setViewMode(mode)
    if (onViewModeChange) {
      onViewModeChange(mode)
    }
  }
  
  const handleSearch = (e) => {
    e.preventDefault()
    // Search functionality is handled in parent component
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    setPriceRange({
      ...priceRange,
      [name]: parseInt(value, 10) || 0
    })
  }
  
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }
  
  return (
    <>
      <div className="product-filter-content mb-40">
        <div className="row align-items-center">
          <div className="col-md-6">
            <div className="product-item-count">
              {itemEnd !== 0 ? (
                <span>Showing <b>{itemStart} - {itemEnd}</b> products</span>
              ) : (
                <span>Total <b>{itemStart}</b> products</span>
              )}
              <button 
                className="filter-toggle-btn ms-3" 
                onClick={toggleFilters}
                style={{ border: "none", background: "#f9f9f9", padding: "5px 15px", borderRadius: "4px" }}
              >
                <i className="fa fa-filter me-2"></i>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
          <div className="col-md-6">
            <div className="product-navtabs d-flex justify-content-end align-items-center">
              <div className="tp-shop-selector">
                <select
                  value={sort}
                  className="chosen-single form-select"
                  onChange={handleSort}
                >
                  <option value="newest">Sort by newest</option>
                  <option value="oldest">Sort by oldest</option>
                  <option value="price-low">Price (Low to High)</option>
                  <option value="price-high">Price (High to Low)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
                
                <select
                  onChange={handlePerPage}
                  className="chosen-single form-select ms-3"
                  value={perPage}
                >
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={36}>36 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>
              <div className="product-view-nav ms-3">
                <div className="nav nav-tabs" role="tablist">
                  <button 
                    type="button"
                    className={`nav-link ${viewMode === 'list' ? 'active' : ''}`} 
                    onClick={() => handleViewMode('list')}
                  >
                    <i className="fa fa-list-ul"></i>
                  </button>
                  <button 
                    type="button"
                    className={`nav-link ${viewMode === 'grid' ? 'active' : ''}`} 
                    onClick={() => handleViewMode('grid')}
                  >
                    <i className="fa fa-th"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="advanced-filters mb-40">
          <div className="row">
            <div className="col-lg-4 col-md-6 mb-3">
              <div className="filter-box p-4" style={{ background: "#f9f9f9", borderRadius: "5px" }}>
                <h5 className="mb-3">Search Products</h5>
                <form onSubmit={handleSearch}>
                  <div className="search-form d-flex">
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="form-control me-2"
                    />
                    <button type="submit" className="btn btn-sm btn-primary">
                      <i className="fa fa-search"></i>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="col-lg-4 col-md-6 mb-3">
              <div className="filter-box p-4" style={{ background: "#f9f9f9", borderRadius: "5px" }}>
                <h5 className="mb-3">Filter by Price</h5>
                <div className="price-filter">
                  <div className="price-inputs d-flex align-items-center mb-3">
                    <input 
                      type="number" 
                      name="min" 
                      placeholder="Min price" 
                      value={priceRange.min}
                      onChange={handlePriceChange}
                      className="form-control me-2"
                    />
                    <span className="mx-2">to</span>
                    <input 
                      type="number" 
                      name="max" 
                      placeholder="Max price" 
                      value={priceRange.max}
                      onChange={handlePriceChange}
                      className="form-control ms-2"
                    />
                  </div>
                  <button type="button" className="btn btn-primary">Apply Filter</button>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-12 mb-3">
              <div className="filter-box p-4" style={{ background: "#f9f9f9", borderRadius: "5px" }}>
                <h5 className="mb-3">Categories</h5>
                <div className="categories-filter">
                  <div className="categories-list" style={{ maxHeight: "200px", overflowY: "auto" }}>
                    {loading ? (
                      <div>Loading categories...</div>
                    ) : categories.length === 0 ? (
                      <div>No categories found</div>
                    ) : (
                      <div className="row">
                        {categories.map((category) => (
                          <div className="col-lg-6" key={category._id}>
                            <div className="form-check mb-2">
                              <input 
                                className="form-check-input" 
                                type="checkbox" 
                                id={`category-${category._id}`}
                                checked={selectedCategory === category._id}
                                onChange={() => handleCategorySelect(category._id)}
                              />
                              <label className="form-check-label" htmlFor={`category-${category._id}`}>
                                {category.name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FilterShopBox
