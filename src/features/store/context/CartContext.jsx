import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../hooks/useAuth';
import { calculateProductPricing } from '../api';

const CartContext = createContext(null);

const STORAGE_KEY = 'gpr_online_cart_v1';

const getOptionsKey = (options = {}) => JSON.stringify(
  Object.entries(options).sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
);

const SERVER_CART_SELECT = 'cart_item_id, product_id, quantity, selected_options, design_provision, product:products(name, slug, base_price, min_quantity, main_image_url, tiers:product_quantity_tiers(min_quantity, max_quantity, price_per_unit), options:product_options(option_id, name, values:product_option_values(value_id, label, price_adjustment)))';

const mapServerCartItem = (serverItem) => {
  const product = serverItem.product || {};
  const selectedOptions = serverItem.selected_options || {};
  const selectedOptionValues = [];
  const selectedOptionLabels = {};

  (product.options || []).forEach((option) => {
    const selectedValue = (option.values || []).find(
      (value) => value.value_id === selectedOptions[option.option_id]
    );
    if (selectedValue) {
      selectedOptionValues.push(selectedValue);
      selectedOptionLabels[option.name] = selectedValue.label;
    }
  });

  const pricing = calculateProductPricing({
    basePrice: product.base_price,
    minQuantity: product.min_quantity,
    quantity: serverItem.quantity,
    selectedOptionValues,
    quantityTiers: product.tiers || [],
  });

  return {
    id: serverItem.cart_item_id,
    cart_item_id: serverItem.cart_item_id,
    product_id: serverItem.product_id,
    product_name: product.name || 'Product',
    product_slug: product.slug || '',
    product_image_url: product.main_image_url || '',
    base_price: product.base_price || 0,
    quantity: serverItem.quantity,
    selected_options: selectedOptions,
    selected_option_labels: selectedOptionLabels,
    design_provision: serverItem.design_provision || 'self_supplied',
    unit_price: pricing.unitPrice,
    subtotal: pricing.subtotal,
  };
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const syncedUserIdRef = useRef(null);
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [syncing, setSyncing] = useState(false);

  // Persist only anonymous cart items. Authenticated server rows must never
  // become input to the guest-to-user merge.
  useEffect(() => {
    if (user) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.filter((item) => !item.cart_item_id)));
    } catch (err) {
      console.warn('Failed to save guest cart to localStorage', err);
    }
  }, [items, user]);

  // Hydrate the authenticated cart once per user. Only items without a
  // server cart_item_id are genuine guest items eligible for a one-time merge.
  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      if (syncedUserIdRef.current) {
        setItems((currentItems) => currentItems.filter((item) => !item.cart_item_id));
      }
      syncedUserIdRef.current = null;
      return;
    }
    if (syncedUserIdRef.current === userId) return;

    syncedUserIdRef.current = userId;

    const syncServerCart = async () => {
      try {
        setSyncing(true);

        const { data: existingCart, error: cartFetchError } = await supabase
          .from('carts')
          .select('cart_id')
          .eq('user_id', userId)
          .maybeSingle();

        if (cartFetchError) throw cartFetchError;

        let cart = existingCart;
        if (!cart) {
          const { data: newCart, error: createCartError } = await supabase
            .from('carts')
            .insert([{ user_id: userId }])
            .select('cart_id')
            .single();

          if (createCartError) throw createCartError;
          cart = newCart;
        }

        const cartId = cart.cart_id;
        const { data: serverItems = [], error: fetchError } = await supabase
          .from('cart_items')
          .select(SERVER_CART_SELECT)
          .eq('cart_id', cartId);

        if (fetchError) throw fetchError;

        const guestItems = items.filter((item) => !item.cart_item_id);
        for (const guestItem of guestItems) {
          const existingServer = serverItems.find(
            (serverItem) =>
              serverItem.product_id === guestItem.product_id &&
              getOptionsKey(serverItem.selected_options) === getOptionsKey(guestItem.selected_options) &&
              serverItem.design_provision === (guestItem.design_provision || 'self_supplied')
          );

          if (existingServer) {
            const mergedQuantity = existingServer.quantity + guestItem.quantity;
            const { error: updateError } = await supabase
              .from('cart_items')
              .update({ quantity: mergedQuantity })
              .eq('cart_item_id', existingServer.cart_item_id);

            if (updateError) throw updateError;
            existingServer.quantity = mergedQuantity;
          } else {
            const { error: insertError } = await supabase.from('cart_items').insert([{
              cart_id: cartId,
              product_id: guestItem.product_id,
              quantity: guestItem.quantity,
              selected_options: guestItem.selected_options || {},
              design_provision: guestItem.design_provision || 'self_supplied',
            }]);

            if (insertError) throw insertError;
          }
        }

        const { data: finalServerItems, error: finalFetchError } = await supabase
          .from('cart_items')
          .select(SERVER_CART_SELECT)
          .eq('cart_id', cartId);

        if (finalFetchError) throw finalFetchError;
        setItems((finalServerItems || []).map(mapServerCartItem));
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Storage cleanup is best-effort; server state remains authoritative.
        }
      } catch (err) {
        syncedUserIdRef.current = null;
        console.error('Cart sync error:', err);
      } finally {
        setSyncing(false);
      }
    };

    syncServerCart();
  }, [user?.id]);

  // Add Item to Cart
  const addItem = useCallback(async (itemPayload) => {
    // Generate unique key
    const optionsKey = getOptionsKey(itemPayload.selected_options);
    const itemKey = `${itemPayload.product_id}_${optionsKey}_${itemPayload.design_provision || 'self_supplied'}`;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (i) =>
          i.product_id === itemPayload.product_id &&
          getOptionsKey(i.selected_options) === getOptionsKey(itemPayload.selected_options) &&
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
          const designProvision = itemPayload.design_provision || 'self_supplied';
          const { data: candidates, error: candidateError } = await supabase
            .from('cart_items')
            .select('cart_item_id, quantity, selected_options')
            .eq('cart_id', cart.cart_id)
            .eq('product_id', itemPayload.product_id)
            .eq('design_provision', designProvision);

          if (candidateError) throw candidateError;

          const existing = (candidates || []).find(
            (candidate) => getOptionsKey(candidate.selected_options) === getOptionsKey(itemPayload.selected_options)
          );

          if (existing) {
            const { error: updateError } = await supabase
              .from('cart_items')
              .update({ quantity: existing.quantity + itemPayload.quantity })
              .eq('cart_item_id', existing.cart_item_id);

            if (updateError) throw updateError;
          } else {
            const { error: insertError } = await supabase.from('cart_items').insert([{
              cart_id: cart.cart_id,
              product_id: itemPayload.product_id,
              quantity: itemPayload.quantity,
              selected_options: itemPayload.selected_options || {},
              design_provision: designProvision,
            }]);

            if (insertError) throw insertError;
          }

          const { data: refreshedItems, error: refreshError } = await supabase
            .from('cart_items')
            .select(SERVER_CART_SELECT)
            .eq('cart_id', cart.cart_id);

          if (refreshError) throw refreshError;
          setItems((refreshedItems || []).map(mapServerCartItem));
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
