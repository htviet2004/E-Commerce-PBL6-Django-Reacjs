import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, options = {}) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(
        item => item.id === product.id && 
                item.color === options.color && 
                item.size === options.size
      );

      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id && 
          item.color === options.color && 
          item.size === options.size
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...prevItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        color: options.color || '',
        size: options.size || '',
        stock: product.stock
      }];
    });
  };

  const removeFromCart = (productId, options = {}) => {
    setCartItems(prevItems =>
      prevItems.filter(
        item => !(item.id === productId && 
                  item.color === options.color && 
                  item.size === options.size)
      )
    );
  };

  const updateQuantity = (productId, quantity, options = {}) => {
    if (quantity <= 0) {
      removeFromCart(productId, options);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId && 
        item.color === options.color && 
        item.size === options.size
          ? { ...item, quantity: Math.min(quantity, item.stock || 999) }
          : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};