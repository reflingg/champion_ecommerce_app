import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getCart, addToCart as addToCartAPI, updateCartItem, removeFromCart as removeFromCartAPI, clearCart as clearCartAPI } from '../services/api';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState({ items: [] });
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchCart = useCallback(async () => {
        if (!user) {
            setCart({ items: [] });
            return;
        }
        try {
            setLoading(true);
            const { data } = await getCart();
            setCart(data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const addItem = async (productId, quantity = 1) => {
        try {
            const { data } = await addToCartAPI({ productId, quantity });
            setCart(data);
        } catch (error) {
            throw error;
        }
    };

    const updateQuantity = async (productId, quantity) => {
        try {
            const { data } = await updateCartItem(productId, { quantity });
            setCart(data);
        } catch (error) {
            throw error;
        }
    };

    const removeItem = async (productId) => {
        try {
            const { data } = await removeFromCartAPI(productId);
            setCart(data);
        } catch (error) {
            throw error;
        }
    };

    const emptyCart = async () => {
        try {
            await clearCartAPI();
            setCart({ items: [] });
        } catch (error) {
            throw error;
        }
    };

    const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const cartTotal = cart.items.reduce(
        (sum, item) => sum + (item.product?.price || 0) * item.quantity, 0
    );

    return (
        <CartContext.Provider value={{
            cart, loading, addItem, updateQuantity, removeItem, emptyCart, fetchCart, cartCount, cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};
