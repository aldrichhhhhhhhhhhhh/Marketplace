
import { useMarketplace } from '@/context/MarketplaceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  creamMuted: '#537367',
  danger: '#C34F4F',
};

const STORAGE_KEY = '@marketplace/last-shopping-section';
const PAGE_WIDTH = Dimensions.get('window').width;

const products = [
  {
    id: '1',
    name: 'Everyday Tote Bag',
    price: 649,
    category: 'Fashion',
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700',
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    price: 1299,
    category: 'Electronics',
    image:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
  },
  {
    id: '3',
    name: 'Minimal Desk Lamp',
    price: 899,
    category: 'Home',
    image:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=700',
  },
  {
    id: '4',
    name: 'Daily Essentials',
    price: 499,
    category: 'Beauty',
    image:
      'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700',
  },
];

type Section = 'cart' | 'favorites';

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const pagerRef = useRef<ScrollView>(null);
  const hasLoadedPreference = useRef(false);

  const [activeSection, setActiveSection] = useState<Section>('cart');
  const [ready, setReady] = useState(false);

  const {
    cart,
    favorites,
    cartCount,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    toggleFavorite,
    addToCart,
  } = useMarketplace();

  const savedProducts = products.filter((product) =>
    favorites.includes(product.id),
  );

  const formatPrice = (price: number) =>
    `₱${price.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const saveSection = useCallback(async (section: Section) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, section);
    } catch (error) {
      console.warn('Could not save the last shopping section:', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPreference() {
      let savedSection: Section = 'cart';

      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);

        if (stored === 'cart' || stored === 'favorites') {
          savedSection = stored;
        }
      } catch (error) {
        console.warn('Could not load the last shopping section:', error);
      }

      // A legacy /favorites route explicitly requests Favorites.
      if (params.section === 'favorites') {
        savedSection = 'favorites';
      }

      if (cancelled) return;

      setActiveSection(savedSection);
      hasLoadedPreference.current = true;
      setReady(true);

      requestAnimationFrame(() => {
        pagerRef.current?.scrollTo({
          x: savedSection === 'favorites' ? PAGE_WIDTH : 0,
          animated: false,
        });
      });

      if (params.section === 'favorites') {
        void saveSection('favorites');
      }
    }

    void loadPreference();

    return () => {
      cancelled = true;
    };
  }, [params.section, saveSection]);

  const selectSection = useCallback(
    (section: Section) => {
      setActiveSection(section);

      pagerRef.current?.scrollTo({
        x: section === 'favorites' ? PAGE_WIDTH : 0,
        animated: true,
      });

      if (hasLoadedPreference.current) {
        void saveSection(section);
      }
    },
    [saveSection],
  );

  const handlePagerScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const section: Section =
        offsetX >= PAGE_WIDTH / 2 ? 'favorites' : 'cart';

      setActiveSection(section);

      if (hasLoadedPreference.current) {
        void saveSection(section);
      }
    },
    [saveSection],
  );

  function handleCheckout() {
  if (cart.length === 0) {
    Alert.alert(
      'Your cart is empty',
      'Add a product before continuing to checkout.',
    );
    return;
  }

  router.push('/checkout');
}

  function handleAddFavoriteToCart(product: (typeof products)[number]) {
    addToCart(product);

    Alert.alert(
      'Added to cart',
      `${product.name} has been added to your shopping cart.`,
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR MARKETPLACE</Text>
            <Text style={styles.headerTitle}>Your space.</Text>
          </View>

          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>
              {activeSection === 'cart' ? cartCount : favorites.length}
            </Text>
          </View>
        </View>

        <View style={styles.segmentContainer}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: activeSection === 'cart' }}
            onPress={() => selectSection('cart')}
            style={[
              styles.segment,
              activeSection === 'cart' && styles.segmentActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeSection === 'cart' && styles.segmentTextActive,
              ]}
            >
              Shopping cart
            </Text>

            <View
              style={[
                styles.segmentCount,
                activeSection === 'cart' && styles.segmentCountActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentCountText,
                  activeSection === 'cart' &&
                    styles.segmentCountTextActive,
                ]}
              >
                {cartCount}
              </Text>
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityState={{
              selected: activeSection === 'favorites',
            }}
            onPress={() => selectSection('favorites')}
            style={[
              styles.segment,
              activeSection === 'favorites' && styles.segmentActive,
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                activeSection === 'favorites' &&
                  styles.segmentTextActive,
              ]}
            >
              Favorites
            </Text>

            <View
              style={[
                styles.segmentCount,
                activeSection === 'favorites' &&
                  styles.segmentCountActive,
              ]}
            >
              <Text
                style={[
                  styles.segmentCountText,
                  activeSection === 'favorites' &&
                    styles.segmentCountTextActive,
                ]}
              >
                {favorites.length}
              </Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.swipeHint}>
          Swipe left or right to switch sections
        </Text>

        <ScrollView
          ref={pagerRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={ready}
          onMomentumScrollEnd={handlePagerScrollEnd}
          style={styles.pager}
          contentContainerStyle={styles.pagerContent}
          nestedScrollEnabled
        >
          <View style={[styles.page, { width: PAGE_WIDTH }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pageContent}
              nestedScrollEnabled
            >
              {cart.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Text style={styles.emptyIcon}>🛍</Text>
                  </View>

                  <Text style={styles.emptyTitle}>
                    Your cart is waiting.
                  </Text>

                  <Text style={styles.emptyDescription}>
                    Good finds start with a little discovery. Add something
                    you love and it will appear here.
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.navigate('/(tabs)')}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>
                      Explore products
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.sectionHeading}>
                    <View>
                      <Text style={styles.sectionTitle}>
                        Ready when you are
                      </Text>
                      <Text style={styles.sectionSubtitle}>
                        {cartCount} {cartCount === 1 ? 'item' : 'items'} in
                        your cart
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        Alert.alert(
                          'Clear cart?',
                          'Remove all items from your cart?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Clear cart',
                              style: 'destructive',
                              onPress: () => {
                                cart.forEach((item) =>
                                  removeFromCart(item.product.id),
                                );
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                  </View>

                  {cart.map((item) => (
                    <View
                      key={item.product.id}
                      style={styles.cartItem}
                    >
                      <Image
                        source={{ uri: item.product.image }}
                        style={styles.cartImage}
                        resizeMode="cover"
                      />

                      <View style={styles.cartItemDetails}>
                        <Text style={styles.productCategory}>
                          {item.product.category}
                        </Text>

                        <Text style={styles.cartProductName}>
                          {item.product.name}
                        </Text>

                        <Text style={styles.cartPrice}>
                          {formatPrice(item.product.price)}
                        </Text>

                        <View style={styles.quantityRow}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Decrease quantity of ${item.product.name}`}
                            onPress={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity - 1,
                              )
                            }
                            style={styles.quantityButton}
                          >
                            <Text style={styles.quantityButtonText}>−</Text>
                          </Pressable>

                          <Text style={styles.quantityValue}>
                            {item.quantity}
                          </Text>

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Increase quantity of ${item.product.name}`}
                            onPress={() =>
                              updateCartQuantity(
                                item.product.id,
                                item.quantity + 1,
                              )
                            }
                            style={styles.quantityButton}
                          >
                            <Text style={styles.quantityButtonText}>+</Text>
                          </Pressable>

                          <Pressable
                            accessibilityRole="button"
                            onPress={() => removeFromCart(item.product.id)}
                            style={styles.removeButton}
                          >
                            <Text style={styles.removeText}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}

                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Order summary</Text>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Subtotal</Text>
                      <Text style={styles.summaryValue}>
                        {formatPrice(cartSubtotal)}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Shipping</Text>
                      <Text style={styles.summaryMuted}>
                        Calculated at checkout
                      </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.totalLabel}>Estimated total</Text>
                      <Text style={styles.totalValue}>
                        {formatPrice(cartSubtotal)}
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={handleCheckout}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>
                        Continue to checkout
                      </Text>
                    </Pressable>

                    <Text style={styles.checkoutNote}>
                      Shipping and final charges will be confirmed at checkout.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>

          <View style={[styles.page, { width: PAGE_WIDTH }]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pageContent}
              nestedScrollEnabled
            >
              {savedProducts.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Text style={styles.emptyHeart}>♡</Text>
                  </View>

                  <Text style={styles.emptyTitle}>
                    Keep the good finds close.
                  </Text>

                  <Text style={styles.emptyDescription}>
                    Tap the heart on any product to save it here for later.
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.navigate('/(tabs)')}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>
                      Discover products
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.sectionHeading}>
                    <View>
                      <Text style={styles.sectionTitle}>Saved for later</Text>
                      <Text style={styles.sectionSubtitle}>
                        Your favorite finds, all in one place
                      </Text>
                    </View>
                  </View>

                  <View style={styles.favoriteGrid}>
                    {savedProducts.map((product) => (
                      <View
                        key={product.id}
                        style={styles.favoriteCard}
                      >
                        <View style={styles.favoriteImageWrap}>
                          <Image
                            source={{ uri: product.image }}
                            style={styles.favoriteImage}
                            resizeMode="cover"
                          />

                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${product.name} from favorites`}
                            onPress={() => toggleFavorite(product.id)}
                            style={styles.favoriteRemoveButton}
                          >
                            <Text style={styles.favoriteRemoveIcon}>♥</Text>
                          </Pressable>
                        </View>

                        <Text style={styles.productCategory}>
                          {product.category}
                        </Text>

                        <Text
                          style={styles.favoriteProductName}
                          numberOfLines={2}
                        >
                          {product.name}
                        </Text>

                        <Text style={styles.favoritePrice}>
                          {formatPrice(product.price)}
                        </Text>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleAddFavoriteToCart(product)}
                          style={styles.addToCartButton}
                        >
                          <Text style={styles.addToCartButtonText}>
                            Add to cart
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: COLORS.text,
    fontSize: 32,
    lineHeight: 35,
    marginTop: -3,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 19,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadgeText: {
    color: COLORS.creamText,
    fontSize: 13,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 4,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  segment: {
    flex: 1,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  segmentActive: {
    backgroundColor: COLORS.background,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: COLORS.text,
  },
  segmentCount: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: '#E9EBE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCountActive: {
    backgroundColor: COLORS.cream,
  },
  segmentCountText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  segmentCountTextActive: {
    color: COLORS.creamText,
  },
  swipeHint: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    alignItems: 'stretch',
  },
  page: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  clearText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  cartImage: {
    width: 106,
    height: 126,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
  },
  cartItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productCategory: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  cartProductName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  cartPrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 7,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  quantityButton: {
    width: 29,
    height: 29,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 22,
  },
  quantityValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    minWidth: 12,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 'auto',
    paddingVertical: 6,
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 10,
    fontWeight: '600',
  },
  summaryCard: {
    padding: 18,
    marginTop: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
  },
  summaryTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
    gap: 12,
  },
  summaryLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryMuted: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: 'right',
    flexShrink: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 5,
  },
  totalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  totalValue: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 13,
    paddingHorizontal: 18,
    marginTop: 16,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
  },
  checkoutNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 55,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyHeart: {
    color: COLORS.accent,
    fontSize: 42,
    lineHeight: 48,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  emptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 290,
  },
  favoriteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 24,
  },
  favoriteCard: {
    width: '48%',
  },
  favoriteImageWrap: {
    position: 'relative',
    aspectRatio: 0.82,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 10,
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
  },
  favoriteRemoveButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteRemoveIcon: {
    color: COLORS.danger,
    fontSize: 19,
  },
  favoriteProductName: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    minHeight: 36,
    marginTop: 2,
  },
  favoritePrice: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  addToCartButton: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.accent,
    marginTop: 11,
  },
  addToCartButtonText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
});
