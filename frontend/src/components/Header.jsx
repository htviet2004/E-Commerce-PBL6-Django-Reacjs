import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import AuthModal from './AuthModal.jsx';

export default function Header({
  query = '',
  onQueryChange,
  onOpenLogin,
  onOpenRegister,
  onLogout: onLogoutProp,
  currentUser: currentUserProp
}) {
  const navigate = useNavigate();
  const auth = useAuth();
  const currentUser = currentUserProp ?? auth?.user;
  const logoutFn = onLogoutProp ?? auth?.logout ?? (() => {});
  const [localQuery, setLocalQuery] = useState(query || '');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const firstRender = useRef(true);
  const debounceRef = useRef(null);

  function onSearch(e) {
    e?.preventDefault();
    const q = (localQuery || '').trim();
    if (onQueryChange) onQueryChange(q);
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    // nếu rỗng thì không tự động navigate về '/' — giữ người dùng ở trang hiện tại
  }

  // trigger search onChange with debounce (no redirect to '/' when empty)
  useEffect(() => {
    // skip first render
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = (localQuery || '').trim();
      if (onQueryChange) onQueryChange(q);
      // chỉ navigate khi có query
      if (q) {
        navigate(`/search?q=${encodeURIComponent(q)}`);
      }
      // nếu q rỗng thì không điều hướng, để người dùng ở trang hiện tại (ví dụ category)
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [localQuery, navigate, onQueryChange]);

  function openLogin() {
    setAuthMode('login');
    setIsAuthOpen(true);
    if (onOpenLogin) onOpenLogin();
  }
  function openRegister() {
    setAuthMode('register');
    setIsAuthOpen(true);
    if (onOpenRegister) onOpenRegister();
  }

  function handleLogout() {
    try { logoutFn(); } catch {}
    if (auth?.refresh) auth.refresh();
    else window.location.href = '/';
  }

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand" aria-label="Về trang chủ">
          <span className="brand-name">V-Market</span>
        </Link>

        <form className="search-area" onSubmit={onSearch}>
          <input
            type="text"
            placeholder="Tìm sản phẩm, thương hiệu..."
            value={localQuery}
            onChange={(e) => {
              setLocalQuery(e.target.value);
              // onQueryChange handled by debounce effect, but keep immediate callback if provided
              if (!onQueryChange) return;
              // do not call onQueryChange twice in case effect also calls it;
              // call immediate for components that expect instant update
              try { onQueryChange(e.target.value); } catch {}
            }}
            className="search-input"
          />
          <button type="submit" className="search-btn">Tìm</button>
        </form>

        <div className="actions">
          {currentUser ? (
            <>
              {currentUser.user_type === 'buyer' && (
                <Link to="/dashboard" className="navbar-link">Trang mua hàng</Link>
              )}
              {currentUser.user_type === 'seller' && (
                <Link to="/seller/dashboard" className="navbar-link">Trang bán hàng</Link>
              )}
              <Link to="/profile" className="navbar-link">Trang cá nhân</Link>

              <button
                type="button"
                className="logout-btn"
                onClick={() => {
                  handleLogout();
                }}
              >
                Đăng xuất
              </button>

              <img
                src={currentUser.avatar || '/default-avatar.png'}
                alt={currentUser.full_name || currentUser.username}
                style={{ width: 36, height: 36, borderRadius: '50%', marginLeft: 8 }}
              />
            </>
          ) : (
            <>
              <button type="button" className="action-btn" onClick={openLogin}>Đăng nhập</button>
              <button type="button" className="action-btn" onClick={openRegister}>Đăng ký</button>
            </>
          )}

          <Link to="/cart" className="cart-btn" aria-label="Giỏ hàng">🛒</Link>
        </div>
      </header>

      <AuthModal
        open={isAuthOpen}
        initialMode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          try { if (auth?.setUser) auth.setUser(user); } catch {}
        }}
        onRegisterSuccess={(user) => {
          try { if (auth?.setUser) auth.setUser(user); } catch {}
        }}
      />
    </>
  );
}
