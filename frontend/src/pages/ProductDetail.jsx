import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../utils/CartContext';
import { formatPrice } from '../utils/formatPrice';
import '../assets/productDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetch(`/api/products/${id}/`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setMainImage(data.image || '/default-product.png');
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading product:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="product-detail">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <p>Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail">
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <h2>Không tìm thấy sản phẩm</h2>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              marginTop: '20px',
              padding: '12px 24px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const colors = product.variants?.colors || [];
  const sizes = product.variants?.sizes || [];
  const specs = product.specs || [];
  const description = product.description || 'Chưa có mô tả cho sản phẩm này.';

  function dec() {
    setQty(prev => Math.max(1, prev - 1));
  }

  function inc() {
    setQty(prev => Math.min(prev + 1, product.stock || 999));
  }

  function handleAddToCart() {
    if (colors.length > 0 && !color) {
      alert('Vui lòng chọn màu sắc');
      return;
    }
    if (sizes.length > 0 && !size) {
      alert('Vui lòng chọn kích thước');
      return;
    }

    addToCart(product, qty, { color, size });
    
    // Show success message
    const message = `Đã thêm ${qty} sản phẩm vào giỏ hàng`;
    alert(message);
  }

  function handleBuyNow() {
    if (colors.length > 0 && !color) {
      alert('Vui lòng chọn màu sắc');
      return;
    }
    if (sizes.length > 0 && !size) {
      alert('Vui lòng chọn kích thước');
      return;
    }

    addToCart(product, qty, { color, size });
    navigate('/cart');
  }

  return (
    <div className="product-detail">
      <div className="product-detail-inner">
        {/* Left: Media */}
        <div className="product-detail-media">
          <div className="pd-main-media">
            <img src={mainImage} alt={product.name} />
          </div>
          
          {product.images && product.images.length > 0 && (
            <div className="pd-thumbs">
              {product.images.map((img, i) => (
                <div
                  key={i}
                  className={`pd-thumb ${mainImage === img ? 'active' : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <div className="product-detail-price">
            {formatPrice(product.price)}
          </div>

          {/* Color selection */}
          {colors.length > 0 && (
            <div className="pd-card">
              <div className="pd-row">
                <span className="pd-label">Màu sắc:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {colors.map(c => (
                    <button
                      key={c}
                      className={`pd-chip ${color === c ? 'active' : ''}`}
                      onClick={() => setColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Size selection */}
          {sizes.length > 0 && (
            <div className="pd-card">
              <div className="pd-row">
                <span className="pd-label">Kích thước:</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {sizes.map(s => (
                    <button
                      key={s}
                      className={`pd-chip ${size === s ? 'active' : ''}`}
                      onClick={() => setSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="pd-card">
            <div className="pd-row">
              <span className="pd-label">Số lượng:</span>
              <div className="pd-qty">
                <button onClick={dec}>−</button>
                <input type="number" value={qty} readOnly />
                <button onClick={inc}>+</button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pd-actions">
            <button className="add-cart" onClick={handleAddToCart}>
              Thêm vào giỏ
            </button>
            <button className="buy-now" onClick={handleBuyNow}>
              Mua ngay
            </button>
          </div>

          {/* Meta info */}
          <div className="pd-meta">
            <div>Danh mục: {product.category?.name || 'Chưa phân loại'}</div>
            <div>Còn lại: {product.stock || 0} sản phẩm</div>
          </div>
        </div>
      </div>

      {/* Sections below */}
      <div className="detail-sections">
        {/* Specifications */}
        {specs.length > 0 && (
          <div className="detail-section">
            <h3>Thông số kỹ thuật</h3>
            <div className="specs">
              {specs.map((spec, i) => (
                <div className="pd-row" key={i}>
                  <span className="pd-label">{spec.label}:</span>
                  <div>{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="detail-section">
          <h3>Mô tả sản phẩm</h3>
          <div className="pd-description">
            <pre>{description}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}