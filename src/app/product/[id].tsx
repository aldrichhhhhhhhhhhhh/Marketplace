import { useMarketplace } from '@/context/MarketplaceContext';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#FFFFFF',
  surface: '#F6F7F5',
  text: '#171717',
  muted: '#737873',
  border: '#E5E7E5',
  accent: '#047857',
  cream: '#F5F3EB',
  creamText: '#064E3B',
  danger: '#C34F4F',
};

const PRODUCTS = [
  {
    id: '1',
    name: 'Everyday Tote Bag',
    price: 649,
    category: 'Fashion',
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1000',
    description:
      'A versatile everyday tote with a clean, minimalist look. A simple companion for errands, everyday essentials, and casual outings.',
    highlights: [
      'Everyday-inspired design',
      'Versatile styling',
      'Minimalist look',
    ],
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    price: 1299,
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000',
    description:
      'A modern-looking pair of headphones for your daily listening setup, whether you are relaxing, studying, or working.',
    highlights: [
      'Wireless-style design',
      'For everyday listening',
      'Modern aesthetic',
    ],
  },
  {
    id: '3',
    name: 'Minimal Desk Lamp',
    price: 899,
    category: 'Home',
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1000',
    description:
      'A minimalist desk-lamp design that fits naturally into a workspace, bedside table, or reading corner.',
    highlights: [
      'Minimalist design',
      'Workspace-friendly style',
      'Suitable for modern interiors',
    ],
  },
  {
    id: '4',
    name: 'Daily Essentials',
    price: 499,
    category: 'Beauty',
    image:
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1000',
    description:
      'A beauty-category everyday essentials pick for shoppers who appreciate a clean, simple presentation.',
    highlights: [
      'Beauty essentials category',
      'Simple everyday concept',
      'Easy-to-browse listing',
    ],
  },
];

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;

  const product = useMemo(
    () => PRODUCTS.find((item) => item.id === productId),
    [productId],
  );

  const [quantity, setQuantity] = useState(1);
  const [miniCartVisible, setMiniCartVisible] = useState(false);
  const [addedQuantity, setAddedQuantity] = useState(1);

  const popupOpacity = useRef(new Animated.Value(0)).current;
  const popupTranslateY = useRef(new Animated.Value(24)).current;
  const miniCartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    toggleFavorite,
    isFavorite,
    addToCart,
    cart,
    cartSubtotal,
  } = useMarketplace();

  const closeMiniCart = useCallback(() => {
    if (miniCartTimer.current) {
      clearTimeout(miniCartTimer.current);
      miniCartTimer.current = null;
    }

    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(popupTranslateY, {
        toValue: 16,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMiniCartVisible(false);
      }
    });
  }, [popupOpacity, popupTranslateY]);

  useEffect(() => {
    if (!miniCartVisible) {
      return;
    }

    popupOpacity.setValue(0);
    popupTranslateY.setValue(24);

    Animated.parallel([
      Animated.timing(popupOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(popupTranslateY, {
        toValue: 0,
        speed: 20,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();

    miniCartTimer.current = setTimeout(() => {
      closeMiniCart();
    }, 6000);

    return () => {
      if (miniCartTimer.current) {
        clearTimeout(miniCartTimer.current);
        miniCartTimer.current = null;
      }
    };
  }, [
    miniCartVisible,
    popupOpacity,
    popupTranslateY,
    closeMiniCart,
  ]);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Stack.Screen options={{ headerShown: false }} />

        <View style={styles.notFound}>
          <Text style={styles.notFoundIcon}>⌕</Text>
          <Text style={styles.notFoundTitle}>Product not found</Text>
          <Text style={styles.mutedText}>
            This product may no longer be available.
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(product.id);
  const formattedPrice = `₱${product.price.toLocaleString('en-PH')}`;
  const totalPrice = product.price * quantity;

  const cartItemCount = cart.reduce(
    (total, item) => total + item.quantity,
    0,
  );



function handleAddToCart() {
  if (!product) {
    return;
  }

  const selectedProduct = {
    id: product.id,
    name: product.name,
    price: product.price,
    category: product.category,
    image: product.image,
  };

  for (let i = 0; i < quantity; i += 1) {
    addToCart(selectedProduct);
  }

  setAddedQuantity(quantity);
  setMiniCartVisible(true);
}


  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.roundButton}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <Text style={styles.topBarTitle}>Product details</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open shopping cart"
              onPress={() => router.push('/cart')}
              style={styles.roundButton}
            >
              <Text style={styles.topCartIcon}>🛒</Text>
            </Pressable>
          </View>

          <View style={styles.imageContainer}>
            <Image
              source={{ uri: product.image }}
              style={styles.productImage}
              resizeMode="cover"
            />

            <View style={styles.imageBadge}>
              <Text style={styles.imageBadgeText}>
                {product.category}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favorite ? 'Remove from favorites' : 'Add to favorites'
              }
              accessibilityState={{ selected: favorite }}
              onPress={() => toggleFavorite(product.id)}
              style={styles.largeFavoriteButton}
            >
              <Text
                style={[
                  styles.largeFavoriteIcon,
                  favorite && styles.favoriteActive,
                ]}
              >
                {favorite ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.productContent}>
            <Text style={styles.eyebrow}>
              CURATED FOR EVERYDAY LIVING
            </Text>

            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.price}>{formattedPrice}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>About this product</Text>
            <Text style={styles.description}>{product.description}</Text>

            <Text style={styles.sectionTitle}>Product highlights</Text>

            {product.highlights.map((highlight) => (
              <View key={highlight} style={styles.highlightRow}>
                <Text style={styles.highlightCheck}>✓</Text>
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>♧</Text>
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>Marketplace listing</Text>
                <Text style={styles.infoDescription}>
                  Seller details and product-specific policies can be added
                  when seller profiles are implemented.
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoIconText}>⌖</Text>
              </View>

              <View style={styles.infoCopy}>
                <Text style={styles.infoTitle}>Delivery information</Text>
                <Text style={styles.infoDescription}>
                  Delivery fees, coverage, and estimated arrival are not
                  configured yet. These can be shown once checkout and
                  delivery services are connected.
                </Text>
              </View>
            </View>

            <View style={styles.quantitySection}>
              <View style={styles.quantityCopy}>
                <Text style={styles.sectionTitle}>Quantity</Text>
                <Text style={styles.quantityHint}>
                  Choose how many you need
                </Text>
              </View>

              <View style={styles.quantityControl}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Decrease quantity"
                  accessibilityState={{ disabled: quantity <= 1 }}
                  disabled={quantity <= 1}
                  onPress={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                  style={[
                    styles.quantityButton,
                    quantity <= 1 && styles.quantityButtonDisabled,
                  ]}
                >
                  <Text style={styles.quantityButtonText}>−</Text>
                </Pressable>

                <Text style={styles.quantityValue}>{quantity}</Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Increase quantity"
                  accessibilityState={{ disabled: quantity >= 99 }}
                  disabled={quantity >= 99}
                  onPress={() =>
                    setQuantity((current) => Math.min(99, current + 1))
                  }
                  style={[
                    styles.quantityButton,
                    quantity >= 99 && styles.quantityButtonDisabled,
                  ]}
                >
                  <Text style={styles.quantityButtonText}>＋</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total for {quantity}</Text>
              <Text style={styles.totalPrice}>
                ₱{totalPrice.toLocaleString('en-PH')}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle favorite"
            accessibilityState={{ selected: favorite }}
            onPress={() => toggleFavorite(product.id)}
            style={styles.bottomFavoriteButton}
          >
            <Text
              style={[
                styles.bottomFavoriteIcon,
                favorite && styles.favoriteActive,
              ]}
            >
              {favorite ? '♥' : '♡'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${quantity} ${product.name} to cart`}
            onPress={handleAddToCart}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.bottomAddButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>+ Add to Cart</Text>
          </Pressable>
        </View>

        <Modal
          visible={miniCartVisible}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={closeMiniCart}
        >
          <View style={styles.popupOverlay}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close mini cart"
              style={StyleSheet.absoluteFill}
              onPress={closeMiniCart}
            />

            <Animated.View
              accessibilityRole="alert"
              style={[
                styles.miniCartCard,
                {
                  opacity: popupOpacity,
                  transform: [{ translateY: popupTranslateY }],
                },
              ]}
            >
              <View style={styles.popupHeader}>
                <View style={styles.popupSuccessIcon}>
                  <Text style={styles.popupSuccessCheck}>✓</Text>
                </View>

                <View style={styles.popupHeaderCopy}>
                  <Text style={styles.popupEyebrow}>
                    SUCCESSFULLY ADDED
                  </Text>
                  <Text style={styles.popupTitle}>
                    Added to your cart
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close popup"
                  onPress={closeMiniCart}
                  style={styles.popupCloseButton}
                >
                  <Text style={styles.popupCloseText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.popupProductRow}>
                <Image
                  source={{ uri: product.image }}
                  style={styles.popupProductImage}
                  resizeMode="cover"
                />

                <View style={styles.popupProductDetails}>
                  <Text style={styles.popupProductName} numberOfLines={2}>
                    {product.name}
                  </Text>

                  <Text style={styles.popupProductMeta}>
                    Quantity added: {addedQuantity}
                  </Text>

                  <Text style={styles.popupProductPrice}>
                    ₱
                    {(product.price * addedQuantity).toLocaleString('en-PH')}
                  </Text>
                </View>
              </View>

              <View style={styles.popupDivider} />

              <View style={styles.popupSubtotalRow}>
                <View>
                  <Text style={styles.popupSubtotalLabel}>
                    Cart subtotal
                  </Text>
                  <Text style={styles.popupItemCount}>
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                <Text style={styles.popupSubtotalValue}>
                  ₱{cartSubtotal.toLocaleString('en-PH')}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={closeMiniCart}
                style={({ pressed }) => [
                  styles.popupPrimaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.popupPrimaryButtonText}>
                  Continue Shopping
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  closeMiniCart();
                  router.push('/cart');
                }}
                style={({ pressed }) => [
                  styles.popupSecondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.popupSecondaryButtonText}>
                  View Cart
                </Text>
                <Text style={styles.popupArrow}>→</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  topBar: {
    minHeight: 62,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: COLORS.text,
    fontSize: 34,
    lineHeight: 38,
    marginTop: -4,
  },
  topCartIcon: {
    fontSize: 19,
  },
  topBarTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  imageContainer: {
    position: 'relative',
    marginHorizontal: 20,
    marginTop: 8,
    aspectRatio: 0.92,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  imageBadgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  largeFavoriteButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeFavoriteIcon: {
    color: COLORS.text,
    fontSize: 27,
    lineHeight: 32,
  },
  favoriteActive: {
    color: COLORS.danger,
  },
  productContent: {
    paddingHorizontal: 22,
    paddingTop: 25,
  },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 9,
  },
  productName: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  price: {
    color: COLORS.accent,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 9,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  description: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 25,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  highlightCheck: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: '800',
    marginRight: 10,
  },
  highlightText: {
    color: COLORS.text,
    fontSize: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginTop: 18,
    gap: 12,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    color: COLORS.accent,
    fontSize: 23,
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  infoDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
  },
  quantitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 22,
  },
  quantityCopy: {
    flex: 1,
  },
  quantityHint: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: -4,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quantityButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.4,
  },
  quantityButtonText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '600',
  },
  quantityValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 17,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 8,
  },
  totalLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  totalPrice: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  bottomFavoriteButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomFavoriteIcon: {
    color: COLORS.text,
    fontSize: 27,
  },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomAddButton: {
    flex: 1,
    minHeight: 52,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },

  // Translucent mini-cart popup
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 18, 0.24)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  miniCartCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(250, 253, 250, 0.94)',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#123D2D',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
  },
  popupSuccessIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: 'rgba(4, 120, 87, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(4, 120, 87, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupSuccessCheck: {
    color: COLORS.accent,
    fontSize: 23,
    fontWeight: '800',
  },
  popupHeaderCopy: {
    flex: 1,
  },
  popupEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  popupTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
  },
  popupCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(4, 120, 87, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupCloseText: {
    color: COLORS.muted,
    fontSize: 25,
    lineHeight: 28,
    marginTop: -2,
  },
  popupProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  popupProductImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
  },
  popupProductDetails: {
    flex: 1,
    gap: 6,
  },
  popupProductName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  popupProductMeta: {
    color: COLORS.muted,
    fontSize: 11,
  },
  popupProductPrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  popupDivider: {
    height: 1,
    backgroundColor: 'rgba(4, 120, 87, 0.12)',
    marginVertical: 20,
  },
  popupSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  popupSubtotalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  popupItemCount: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  popupSubtotalValue: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: '800',
  },
  popupPrimaryButton: {
    minHeight: 50,
    borderRadius: 15,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  popupPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  popupSecondaryButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(4, 120, 87, 0.18)',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  popupSecondaryButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  popupArrow: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '700',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  notFoundIcon: {
    color: COLORS.accent,
    fontSize: 48,
    marginBottom: 10,
  },
  notFoundTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  mutedText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
  },
});
