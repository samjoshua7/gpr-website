import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';

const CartContext = createContext(null);

const STORAGE_KEY = 'gpr_online_cart_v1';

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);

  // Keep localStorage updated with guest cart
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage', err);
    }
  }, [items]);

  // Sync with server cart when user logs in
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const syncServerCart = async () => {
      try {
        setSyncing(true);

        // 1. Get or create user's cart in DB
        let { data: cart } = await supabase
          .from('carts')
          .select('cart_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!cart) {
          const { data: newCart, error: createCartError } = await supabase
            .from('carts')
            .insert([{ user_id: user.id }])
            .select('cart_id')
            .single();

          if (createCartError) {
            console.error('Failed to create server cart', createCartError);
            return;
          }
          cart = newCart;
        }

        const cartId = cart.cart_id;

        // 2. Fetch server cart items
        const { data: serverItems, error: fetchError } = await supabase
          .from('cart_items')
          .select(`
            cart_item_id,
            product_id,
            quantity,
            selected_options,
            design_provision,
            product:products(name, slug, base_price, main_image_url)
          `)
          .eq('cart_id', cartId);

        if (fetchError) {
          console.error('Failed to fetch server cart items', fetchError);
          return;
        }

        // 3. Merge local guest items into server
        const localItems = [...items];
        if (localItems.length > 0) {
          for (const localItem of localItems) {
            const existingServer = serverItems?.find(
              (si) =>
                si.product_id === localItem.product_id &&
                JSON.stringify(si.selected_options) === JSON.stringify(localItem.selected_options) &&
                si.design_provision === localItem.design_provision
            );

            if (existingServer) {
              // Update quantity
              const newQty = existingServer.quantity + localItem.quantity;
              await supabase
                .from('cart_items')
                .update({ quantity: newQty })
                .eq('cart_item_id', existingServer.cart_item_id);
            } else {
              // Insert
              await supabase.from('cart_items').insert([{
                cart_id: cartId,
                product_id: localItem.product_id,
                quantity: localItem.quantity,
                selected_options: localItem.selected_options || {},
                design_provision: localItem.design_provision || 'self_supplied',
              }]);
            }
          }
        }

        // 4. Re-fetch consolidated items from server
        const { data: finalServerItems } = await supabase
          .from('cart_items')
          .select(`
            cart_item_id,
            product_id,
            quantity,
            selected_options,
            design_provision,
            product:products(name, slug, base_price, main_image_url)
          `)
          .eq('cart_id', cartId);

        if (isMounted && finalServerItems) {
          const mapped = finalServerItems.map((si) => ({
            id: si.cart_item_id,
            cart_item_id: si.cart_item_id,
            product_id: si.product_id,
            product_name: si.product?.name || 'Product',
            product_slug: si.product?.slug || '',
            product_image_url: si.product?.main_image_url || '',
            base_price: si.product?.base_price || 0,
            quantity: si.quantity,
            selected_options: si.selected_options || {},
            design_provision: si.design_provision || 'self_supplied',
            unit_price: si.product?.base_price || 0, // Fallback
            subtotal: (si.product?.base_price || 0) * si.quantity,
          }));
          setItems(mapped);
        }
      } catch (err) {
        console.error('Cart sync error:', err);
      } finally {
        if (isMounted) setSyncing(false);
      }
    };

    syncServerCart();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Add Item to Cart
  const addItem = useCallback(async (itemPayload) => {
    // Generate unique key
    const optionsKey = JSON.stringify(itemPayload.selected_options || {});
    const itemKey = `${itemPayload.product_id}_${optionsKey}_${itemPayload.design_provision || 'self_supplied'}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) =>
          i.product_id === itemPayload.product_id &&
          JSON.stringify(i.selected_options) === JSON.stringify(itemPayload.selected_options) &&
          i.design_provision === itemPayload.design_provision
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const newQuantity = existing.quantity + itemPayload.quantity;
        const newSubtotal = Math.round(existing.unit_price * newQuantity * 100) / 100;
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          subtotal: newSubtotal,
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            ...itemPayload,
            id: itemKey,
          },
        ];
      }
    });

    // If logged in, update server
    if (user) {
      try {
        const { data: cart } = await supabase
          .from('carts')
          .select('cart_id')
          .eq('user_id', user.id)
          .single();

        if (cart) {
          const { data: existing } = await supabase
            .from('cart_items')
            .select('cart_item_id, quantity')
            .eq('cart_id', cart.cart_id)
            .eq('product_id', itemPayload.product_id)
            .eq('design_provision', itemPayload.design_provision || 'self_supplied')
            .maybeSingle();

          if (existing) {
            await supabase
              .from('cart_items')
              .update({ quantity: existing.quantity + itemPayload.quantity })
              .eq('cart_item_id', existing.cart_item_id);
          } else {
            await supabase.from('cart_items').insert([{
              cart_id: cart.cart_id,
              product_id: itemPayload.product_id,
              quantity: itemPayload.quantity,
              selected_options: itemPayload.selected_options || {},
              design_provision: itemPayload.design_provision || 'self_supplied',
            }]);
          }
        }
      } catch (err) {
        console.warn('Failed to sync added item to DB', err);
      }
    }
  }, [user]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);
    if (qty <= 0) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: qty,
            subtotal: Math.round(item.unit_price * qty * 100) / 100,
          };
        }
        return item;
      })
    );

    if (user) {
      try {
        // If itemId is uuid from DB
        await supabase
          .from('cart_items')
          .update({ quantity: qty })
          .eq('cart_item_id', itemId);
      } catch (err) {
        console.warn('Failed to sync updated quantity to DB', err);
      }
    }
  }, [user]);

  // Remove Item
  const removeItem = useCallback(async (itemId) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('cart_item_id', itemId);
      } catch (err) {
        console.warn('Failed to remove item from DB', err);
      }
    }
  }, [user]);

  // Clear Cart
  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}

    if (user) {
      try {
        const { data: cart } = await supabase
          .from('carts')
          .select('cart_id')
          .eq('user_id', user.id)
          .single();

        if (cart) {
          await supabase.from('cart_items').delete().eq('cart_id', cart.cart_id);
        }
      } catch (err) {
        console.warn('Failed to clear cart in DB', err);
      }
    }
  }, [user]);

  const cartTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.subtotal || (item.unit_price * item.quantity)), 0);
  }, [items]);

  const cartCount = useMemo(() => {
    return items.length;
  }, [items]);

  const value = {
    items,
    cartCount,
    cartTotal,
    syncing,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
