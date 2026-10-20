
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type MarketplaceProduct = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
};

type CartItem = {
  product: MarketplaceProduct;
  quantity: number;
};

type MarketplaceContextValue = {
  favorites: string[];
  cart: CartItem[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  addToCart: (product: MarketplaceProduct) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
};

const MarketplaceContext =
  createContext<MarketplaceContextValue | undefined>(undefined);

export function MarketplaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    );
  };

  const isFavorite = (productId: string) =>
    favorites.includes(productId);

  const addToCart = (product: MarketplaceProduct) => {
    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id,
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((current) =>
      current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const cartSubtotal = cart.reduce(
    (total, item) =>
      total + item.product.price * item.quantity,
    0,
  );

  const value = useMemo(
    () => ({
      favorites,
      cart,
      toggleFavorite,
      isFavorite,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      cartCount,
      cartSubtotal,
    }),
    [favorites, cart, cartCount, cartSubtotal],
  );

  return (
    <MarketplaceContext.Provider value={value}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  const context = useContext(MarketplaceContext);

  if (!context) {
    throw new Error(
      'useMarketplace must be used inside MarketplaceProvider.',
    );
  }

  return context;
}
