import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout.jsx';
// import CategoryNav from '../components/CategoryNav.jsx';
import ProductGrid from '../components/ProductGrid.jsx';
import FiltersSidebar from '../components/FiltersSidebar.jsx';
import PageHeader from '../components/PageHeader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Pagination from '../components/Pagination.jsx';
import '../assets/CategoryPage.css';
import '../assets/Components.css';

export default function CategoryPage() {
  // support multiple possible param names (slug, categoryName, category)
  const params = useParams();
  const rawCategoryParam = params.slug ?? params.categoryName ?? params.category ?? '';
  const slugFromUrl = rawCategoryParam ? decodeURIComponent(rawCategoryParam) : '';
  const navigate = useNavigate();

  // data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  // ui/filter state
  const [query, setQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filter panel
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cRes, pRes] = await Promise.all([axios.get('/api/categories/'), axios.get('/api/products/')]);
        if (cancelled) return;
        const cats = Array.isArray(cRes.data) ? cRes.data : (cRes.data.results ?? []);
        const prods = Array.isArray(pRes.data) ? pRes.data : (pRes.data.results ?? []);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        if (cancelled) return;
        console.error('CategoryPage load error', err);
        setError(err.response?.data ?? err.message ?? 'Lỗi khi tải dữ liệu');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // determine active category object (prefer slug match)
  const activeCategoryObj = useMemo(() => {
    if (!slugFromUrl) return null;
    return categories.find(c => {
      const slug = String(c?.slug ?? '').toLowerCase();
      const name = String(c?.name ?? '').toLowerCase();
      const id = String(c?.id ?? '').toLowerCase();
      const param = String(rawCategoryParam ?? '').toLowerCase();
      return slug === param || name === param || id === param;
    }) ?? null;
  }, [categories, rawCategoryParam, slugFromUrl]);

  // helper to match product -> category robustly
  function productMatchesCategory(prod, identifier) {
    if (!identifier) return true;
    const idNorm = String(identifier).toLowerCase();
    const pc = prod.category;
    if (pc == null) return false;

    if (typeof pc === 'string' || typeof pc === 'number') {
      const v = String(pc).toLowerCase();
      if (v === idNorm) return true;
      if (v.includes(idNorm) || idNorm.includes(v)) return true;
      return false;
    }

    // object
    const pid = String(pc.id ?? pc.pk ?? '').toLowerCase();
    const pname = String(pc.name ?? pc.title ?? '').toLowerCase();
    const pslug = String(pc.slug ?? '').toLowerCase();

    if (pid && pid === idNorm) return true;
    if (pname && pname === idNorm) return true;
    if (pslug && pslug === idNorm) return true;
    if ((pname && pname.includes(idNorm)) || (pslug && pslug.includes(idNorm))) return true;
    return false;
  }

  // filtered + sorted products
  const filteredProducts = useMemo(() => {
    const activeIdentifier = activeCategoryObj ? (activeCategoryObj.slug ?? activeCategoryObj.name ?? String(activeCategoryObj.id)) : (slugFromUrl || '');
    const q = (query || '').trim().toLowerCase();

    const list = (products || []).filter(product => {
      // category
      if (activeIdentifier) {
        if (!productMatchesCategory(product, activeIdentifier)) return false;
      }
      // query
      if (q) {
        const name = String(product.name ?? '').toLowerCase();
        const desc = String(product.description ?? '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      // price range
      const price = Number(product.price ?? 0);
      if (priceRange.min && price < Number(priceRange.min)) return false;
      if (priceRange.max && price > Number(priceRange.max)) return false;
      return true;
    });

    // sort
    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case 'price-high':
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case 'name':
        list.sort((a, b) => (String(a.name) || '').localeCompare(String(b.name) || ''));
        break;
      case 'newest':
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      default:
        break;
    }

    return list;
  }, [products, activeCategoryObj, slugFromUrl, query, priceRange, sortBy]);

  // pagination
  const ITEMS_PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // handlers passed into FiltersSidebar
  function handleCategoryChange(catSlugOrName) {
    // catSlugOrName may be slug or name; navigate to slug if possible
    if (!catSlugOrName) { navigate('/'); return; }
    const found = categories.find(c => (String(c.slug) === String(catSlugOrName) || String(c.name) === String(catSlugOrName) || String(c.id) === String(catSlugOrName)));
    const toSlug = found ? (found.slug ?? found.name) : catSlugOrName;
    navigate(`/category/${encodeURIComponent(toSlug)}`);
  }

  function handlePriceRangeChange(r) {
    if (typeof r === 'function') setPriceRange(prev => r(prev));
    else setPriceRange(r ?? { min: '', max: '' });
    setCurrentPage(1);
  }
  function handleSortChange(s) { setSortBy(s); setCurrentPage(1); }
  function handleQueryChange(q) { setQuery(q); setCurrentPage(1); }

  function handleToggleFilters() { setShowFilters(v => !v); }
  function handleClearFilters() {
    setQuery(''); setPriceRange({ min: '', max: '' }); setSortBy('relevance'); setCurrentPage(1);
  }

  return (
    <Layout className="category-page">
      <div className="category-container">
        <PageHeader
          title={activeCategoryObj ? activeCategoryObj.name : (slugFromUrl || 'Tất cả')}
          subtitle={`Kết quả cho ${activeCategoryObj ? activeCategoryObj.name : (slugFromUrl || 'Tất cả')}`}
          resultsCount={filteredProducts.length}
          breadcrumb={[{ text: 'Trang chủ', link: '/' }, { text: activeCategoryObj ? activeCategoryObj.name : (slugFromUrl || 'Tất cả') }]}
          className="category-header"
        />

        <div className="category-content" style={{ display: 'flex', gap: 16 }}>
          {/* Inline sidebar for wide screens */}
          <aside className="filters-column" style={{ width: 300, display: showFilters ? 'none' : 'block' }}>
            <FiltersSidebar
              categories={[{ name: 'Tất cả', slug: '' }, ...categories]}
              selectedCategory={(activeCategoryObj && (activeCategoryObj.slug ?? activeCategoryObj.name)) || (slugFromUrl || '')}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceRangeChange={handlePriceRangeChange}
              sortBy={sortBy}
              onSortChange={handleSortChange}
              onClearFilters={handleClearFilters}
              onQueryChange={handleQueryChange}
              showCategoryLinks={true}
            />
          </aside>

          {/* Overlay panel when toggled on small/explicit */}
          {showFilters && (
            <div
              className="filters-overlay"
              style={{
                position: 'fixed',
                top: 80,
                right: 20,
                width: 360,
                maxWidth: '95vw',
                height: '80vh',
                overflowY: 'auto',
                background: '#fff',
                boxShadow: '0 12px 34px rgba(0,0,0,0.2)',
                borderRadius: 8,
                zIndex: 9999,
                padding: 12
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>Bộ lọc</strong>
                <div>
                  <button type="button" onClick={() => setShowFilters(false)} style={{ marginRight: 8 }}>Đóng</button>
                </div>
              </div>

              <FiltersSidebar
                categories={[{ name: 'Tất cả', slug: '' }, ...categories]}
                selectedCategory={(activeCategoryObj && (activeCategoryObj.slug ?? activeCategoryObj.name)) || (slugFromUrl || '')}
                onCategoryChange={(c) => { handleCategoryChange(c); setShowFilters(false); }}
                priceRange={priceRange}
                onPriceRangeChange={(r) => { handlePriceRangeChange(r); }}
                sortBy={sortBy}
                onSortChange={(s) => { handleSortChange(s); }}
                onClearFilters={() => { handleClearFilters(); setShowFilters(false); }}
                onQueryChange={(q) => { handleQueryChange(q); }}
                showCategoryLinks
              />
            </div>
          )}

          <div className="products-section" style={{ flex: 1 }}>
            {loading ? (
              <div>Đang tải sản phẩm...</div>
            ) : error ? (
              <div style={{ color: 'red' }}>{String(error)}</div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                icon="📦"
                title="Không có sản phẩm nào"
                description="Hiện tại chưa có sản phẩm trong danh mục này"
                actionText="Xem tất cả sản phẩm"
                actionLink="/"
                className="no-results"
              />
            ) : (
              <>
                <ProductGrid products={paginatedProducts} />
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p)} />
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
