import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useCart } from '../utils/CartContext';
import { formatPrice } from '../utils/formatPrice';
import '../assets/productDetail.css';
import StarRating from '../components/StarRating';
import { getProductReviews, getReviewEligibility, submitReview } from '../utils/reviewsApi';

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
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const [canReview, setCanReview] = useState(false);
    const [myReview, setMyReview] = useState(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:8000/api/products/${id}/`)
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

    useEffect(() => {
        let cancelled = false;
        async function loadReviews() {
            try {
                setReviewsLoading(true);
                const [r1, r2] = await Promise.all([
                    getProductReviews(id),
                    getReviewEligibility(id).catch(() => ({ can_review: false }))
                ]);
                if (cancelled) return;
                setReviews(r1.reviews || []);
                setAvgRating(Number(r1.average || 0));
                setRatingCount(Number(r1.count || 0));
                setCanReview(Boolean(r2.can_review));
                if (r2.my_review) {
                    setMyReview(r2.my_review);
                    setReviewRating(r2.my_review.rating || 0);
                    setReviewComment(r2.my_review.comment || '');
                } else {
                    setMyReview(null);
                    setReviewRating(0);
                    setReviewComment('');
                }
                if (r2.reason === 'unauthenticated') {
                    console.debug('Not logged in -> cannot review');
                }
            } finally {
                if (!cancelled) setReviewsLoading(false);
            }
        }
        loadReviews();
        return () => { cancelled = true; };
    }, [id]);

    async function handleSubmitReview(e) {
        e.preventDefault();
        if (!reviewRating) {
            alert('Vui lòng chọn số sao');
            return;
        }
        try {
            setSubmitting(true);
            const saved = await submitReview(id, { rating: reviewRating, comment: reviewComment });
            // Cập nhật trạng thái của chính review
            setMyReview(saved);
            setCanReview(false);
            // Refresh danh sách + trung bình
            const r = await getProductReviews(id);
            setReviews(r.reviews || []);
            setAvgRating(Number(r.average || 0));
            setRatingCount(Number(r.count || 0));
        } catch (err) {
            console.error(err);
            if (String(err).includes('401') || String(err.message || '').toLowerCase().includes('auth')) {
                if (window.confirm('Bạn cần đăng nhập để đánh giá. Đi đến trang đăng nhập?')) {
                    // điều hướng sang login nếu app bạn có route này
                    window.location.href = '/login';
                }
            } else {
                alert('Gửi đánh giá thất bại. Vui lòng thử lại.');
            }
        } finally {
            setSubmitting(false);
        }
    }

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
                <div className="pd-card" style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center' }}>
                    <h2>Không tìm thấy sản phẩm</h2>
                    <p><Link to="/" style={{ color: 'var(--accent)' }}>Quay về trang chủ</Link></p>
                </div>
            </div>
        );
    }

    const vouchers = product.vouchers || [];
    const colors = product.variants?.colors || [];
    const sizes = product.variants?.sizes || [];
    const specs = product.specs || [];
    const description = product.description || 'Chưa có mô tả cho sản phẩm này.';

    // Shop info
    const shop = {
        id: product.seller_id,
        name: product.seller_name || 'Cửa hàng V-Market',
        avatar: '/default-avatar.png', // nếu có ảnh shop riêng thì thay ở đây
        rating: product.rating || 4.8,
        followers: product.followers || '150k'
    };

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
        alert(`Đã thêm ${qty} sản phẩm vào giỏ hàng`);
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

    function handleChatWithShop() {
        navigate(`/chat/${shop.id}?product=${id}`);
    }

    function handleViewShop() {
        navigate(`/shop/${shop.id}`);
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

                    {/* Rating summary line */}
                    <div style={{ margin: '8px 0 12px 0' }}>
                        <StarRating value={avgRating} count={ratingCount} readOnly showValue size={16} />
                    </div>

                    <div className="pd-card">
                        {/* Voucher */}
                        {vouchers.length > 0 && (
                            <div className="pd-row">
                                <div className="pd-label">Voucher</div>
                                <div>
                                    {vouchers.map(v => (
                                        <span key={v} className="pd-chip">{v}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vận chuyển */}
                        {product.shipping && (
                            <div className="pd-row">
                                <div className="pd-label">Vận chuyển</div>
                                <div>
                                    <div>Giao đến: <strong>{product.shipping.area || 'Toàn quốc'}</strong></div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Phí ship: {product.shipping.feeText || 'Freeship đơn từ 0đ'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Color selection */}
                        {colors.length > 0 && (
                            <div className="pd-row">
                                <div className="pd-label">Màu sắc</div>
                                <div>
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
                        )}

                        {/* Size selection */}
                        {sizes.length > 0 && (
                            <div className="pd-row">
                                <div className="pd-label">Kích thước</div>
                                <div>
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
                        )}

                        {/* Quantity */}
                        <div className="pd-row">
                            <div className="pd-label">Số lượng</div>
                            <div>
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
                    </div>

                    {/* Shop card */}
                    <div className="pd-card shop-card">
                        <div
                            className="shop-avatar"
                            style={{
                                backgroundImage: `url(${shop.avatar})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                        <div className="shop-info">
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700' }}>
                                {shop.name}
                            </h4>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                                Đánh giá: <strong>{shop.rating}</strong> • Người theo dõi: <strong>{shop.followers}</strong>
                            </p>
                        </div>
                        <div className="shop-actions">
                            <button onClick={handleChatWithShop}>Chat ngay</button>
                            <button onClick={handleViewShop}>Xem shop</button>
                        </div>
                    </div>

                    {/* Meta info */}
                    <div className="pd-meta">
                        <div>📦 Danh mục: {product.category?.name || 'Chưa phân loại'}</div>
                        <div>📊 Còn lại: {product.stock || 0} sản phẩm</div>
                    </div>
                </div>
            </div>

            {/* Sections below */}
            <div className="detail-sections">
                {/* Specifications */}
                {specs.length > 0 && (
                    <section className="detail-section">
                        <h3>Chi tiết sản phẩm</h3>
                        <div className="specs">
                            {specs.map((spec, i) => (
                                <React.Fragment key={i}>
                                    <div className="pd-label">{spec.label || spec[0]}:</div>
                                    <div>{spec.value || spec[1]}</div>
                                </React.Fragment>
                            ))}
                        </div>
                    </section>
                )}

                {/* Description */}
                <section className="detail-section">
                    <h3>Mô tả sản phẩm</h3>
                    <div className="pd-description">
                        <pre>{description}</pre>
                    </div>
                </section>

                {/* Reviews */}
                <section className="detail-section">
                    <h3>Đánh giá sản phẩm</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                        <StarRating value={avgRating} count={ratingCount} readOnly showValue size={20} />
                        {reviewsLoading ? <span>Đang tải đánh giá...</span> : null}
                    </div>

                    {(canReview || myReview) && (
                        <form onSubmit={handleSubmitReview} className="pd-card" style={{ marginBottom: 16 }}>
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ marginBottom: 6 }}>{myReview ? 'Cập nhật đánh giá của bạn' : 'Đánh giá của bạn'}</div>
                                <StarRating
                                    value={reviewRating}
                                    readOnly={false}
                                    onChange={setReviewRating}
                                    size={24}
                                />
                            </div>
                            <div style={{ marginBottom: 10 }}>
                                <textarea
                                    placeholder="Chia sẻ cảm nhận về sản phẩm..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    rows={4}
                                    style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #e5e7eb' }}
                                />
                            </div>
                            <button className="add-cart" disabled={submitting}>
                                {submitting ? 'Đang gửi...' : (myReview ? 'Cập nhật đánh giá' : 'Gửi đánh giá')}
                            </button>
                        </form>
                    )}

                    {!canReview && !reviewsLoading && !myReview && (
                        <div className="pd-card" style={{ color: 'var(--text-muted)' }}>
                            Chỉ người đã mua sản phẩm mới có thể đánh giá. <a href="/login" style={{ color: 'var(--accent)' }}>Đăng nhập</a>
                        </div>
                    )}

                    {/* Reviews list */}
                    {reviews.length > 0 ? (
                        <div className="pd-card" style={{ display: 'grid', gap: 12 }}>
                            {reviews.map((rv) => (
                                <div key={rv.id || `${rv.user_id}-${rv.created_at}`} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <strong style={{ fontSize: 14 }}>{rv.user_name || 'Người dùng'}</strong>
                                        <StarRating value={rv.rating} readOnly size={14} />
                                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {rv.created_at ? new Date(rv.created_at).toLocaleDateString('vi-VN') : ''}
                                        </span>
                                    </div>
                                    {rv.comment ? (
                                        <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{rv.comment}</div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    ) : !reviewsLoading ? (
                        <div className="pd-card" style={{ color: 'var(--text-muted)' }}>
                            Chưa có đánh giá nào.
                        </div>
                    ) : null}
                </section>
            </div>
        </div>
    );
}