
import { useMarketplace } from '@/context/MarketplaceContext';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  creamMuted: '#537367',
  creamDecoration: '#D3E5D9',
};

const categories = ['All', 'Fashion', 'Electronics', 'Home', 'Beauty'];

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

type Product = (typeof products)[number];

const MENU_ITEMS = [
  { icon: '🛍', title: 'Shopping Cart & Favorites' },
  { icon: '＋', title: 'Create Listing' },
  { icon: '▤', title: 'My Shop' },
  { icon: '✳', title: 'ASK AI' },
];

type Point = {
  x: number;
  y: number;
};

type FlyingProduct = {
  product: Product;
  start: Point;
};

export default function HomeScreen() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [flyingProduct, setFlyingProduct] =
    useState<FlyingProduct | null>(null);
  const [successfulProductId, setSuccessfulProductId] =
    useState<string | null>(null);

  const {
    favorites,
    toggleFavorite,
    isFavorite,
    cartCount,
    addToCart,
  } = useMarketplace();

  const drawerWidth = Math.min(
    Dimensions.get('window').width * 0.88,
    360,
  );

  const drawerX = useRef(new Animated.Value(drawerWidth)).current;
  const cartButtonRef = useRef<View>(null);
  const productImageRefs = useRef<Record<string, View | null>>({});
  const isAnimatingRef = useRef(false);

  const flyPosition = useRef(new Animated.ValueXY()).current;
  const flyScale = useRef(new Animated.Value(1)).current;
  const flyOpacity = useRef(new Animated.Value(1)).current;
  const flyRotation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const cartBadgeScale = useRef(new Animated.Value(1)).current;

  const previousCartCount = useRef(cartCount);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      category === 'All' || product.category === category;

    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Animate the cart badge when the cart count changes.
  useEffect(() => {
    if (previousCartCount.current === cartCount) {
      return;
    }

    previousCartCount.current = cartCount;

    Animated.sequence([
      Animated.spring(cartBadgeScale, {
        toValue: 1.28,
        speed: 30,
        bounciness: 12,
        useNativeDriver: true,
      }),
      Animated.spring(cartBadgeScale, {
        toValue: 1,
        speed: 24,
        bounciness: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cartCount, cartBadgeScale]);

  function openProduct(productId: string) {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  }

  function openSidebar() {
    drawerX.setValue(drawerWidth);
    setSidebarVisible(true);

    requestAnimationFrame(() => {
      Animated.timing(drawerX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    });
  }

  function closeSidebar() {
    Animated.timing(drawerX, {
      toValue: drawerWidth,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSidebarVisible(false));
  }

  function navigateTo(route: '/cart' | '/favorites') {
    closeSidebar();

    setTimeout(() => {
      router.push(route);
    }, 240);
  }

  function openCart() {
    router.push('/cart');
  }

  function handleAddToCart(product: Product) {
    if (isAnimatingRef.current) {
      return;
    }

    const imageRef = productImageRefs.current[product.id];
    const cartRef = cartButtonRef.current;

    if (!imageRef || !cartRef) {
      addToCart(product);
      setSuccessfulProductId(product.id);

      setTimeout(() => {
        setSuccessfulProductId((current) =>
          current === product.id ? null : current,
        );
      }, 900);

      return;
    }

    isAnimatingRef.current = true;
    setSuccessfulProductId(product.id);

    // Add the item immediately; animation is visual feedback.
    addToCart(product);

    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.94,
        duration: 75,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        speed: 26,
        bounciness: 14,
        useNativeDriver: true,
      }),
    ]).start();

    imageRef.measureInWindow(
      (imageX, imageY, imageWidth, imageHeight) => {
        cartRef.measureInWindow(
          (cartX, cartY, cartWidth, cartHeight) => {
            const start = {
              x: imageX + imageWidth / 2 - 22,
              y: imageY + imageHeight / 2 - 22,
            };

            const destination = {
              x: cartX + cartWidth / 2 - 22,
              y: cartY + cartHeight / 2 - 22,
            };

            flyPosition.setValue(start);
            flyScale.setValue(1);
            flyOpacity.setValue(1);
            flyRotation.setValue(0);

            setFlyingProduct({ product, start });

            requestAnimationFrame(() => {
              Animated.parallel([
                Animated.timing(flyPosition, {
                  toValue: destination,
                  duration: 460,
                  easing: Easing.inOut(Easing.cubic),
                  useNativeDriver: true,
                }),
                Animated.sequence([
                  Animated.timing(flyScale, {
                    toValue: 0.82,
                    duration: 110,
                    useNativeDriver: true,
                  }),
                  Animated.timing(flyScale, {
                    toValue: 0.24,
                    duration: 350,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                  }),
                ]),
                Animated.sequence([
                  Animated.timing(flyRotation, {
                    toValue: 0.12,
                    duration: 220,
                    useNativeDriver: true,
                  }),
                  Animated.timing(flyRotation, {
                    toValue: -0.08,
                    duration: 240,
                    useNativeDriver: true,
                  }),
                ]),
                Animated.sequence([
                  Animated.delay(320),
                  Animated.timing(flyOpacity, {
                    toValue: 0.25,
                    duration: 140,
                    useNativeDriver: true,
                  }),
                ]),
              ]).start(({ finished }) => {
                if (finished) {
                  Animated.sequence([
                    Animated.spring(cartBadgeScale, {
                      toValue: 1.35,
                      speed: 28,
                      bounciness: 15,
                      useNativeDriver: true,
                    }),
                    Animated.spring(cartBadgeScale, {
                      toValue: 1,
                      speed: 22,
                      bounciness: 12,
                      useNativeDriver: true,
                    }),
                  ]).start();
                }

                setFlyingProduct(null);
                isAnimatingRef.current = false;

                setTimeout(() => {
                  setSuccessfulProductId((current) =>
                    current === product.id ? null : current,
                  );
                }, 500);
              });
            });
          },
        );
      },
    );
  }

  function openMenuItem(item: string) {
    if (item === 'Shopping Cart & Favorites') {
      navigateTo('/cart');
      return;
    }

    closeSidebar();

    if (item === 'ASK AI') {
      Alert.alert(
        'ASK AI',
        'Your AI shopping assistant is coming soon.',
      );
      return;
    }

    Alert.alert(
      item,
      'This feature will be built in a future step.',
    );
  }

  const flyRotate = flyRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-360deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>A BETTER WAY TO SHOP</Text>
            <Text style={styles.brand}>marketplace.</Text>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              ref={cartButtonRef}
              collapsable={false}
              accessibilityRole="button"
              accessibilityLabel={`Shopping cart, ${cartCount} items`}
              accessibilityHint="Opens your cart and favorites"
              onPress={openCart}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Text style={styles.cartIcon}>🛒</Text>

              {cartCount > 0 && (
                <Animated.View
                  style={[
                    styles.cartBadge,
                    { transform: [{ scale: cartBadgeScale }] },
                  ]}
                >
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </Animated.View>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open quick menu"
              accessibilityHint="Opens shopping, selling, and AI tools"
              style={styles.iconButton}
              onPress={openSidebar}
            >
              <Text style={styles.iconText}>♧</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products and shops"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Explore categories</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((item) => {
            const selected = category === item;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryPill,
                  selected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selected && styles.categoryTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.banner}>
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerLabel}>
              DISCOVER SOMETHING NEW
            </Text>

            <Text style={styles.bannerTitle}>
              Good finds.{'\n'}Better shopping.
            </Text>

            <Text style={styles.bannerDescription}>
              Explore products from independent sellers.
            </Text>
          </View>

          <Text style={styles.bannerDecoration}>✳</Text>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Picked for you</Text>
            <Text style={styles.sectionSubtitle}>
              Discover your next favorite
            </Text>
          </View>

          <Text style={styles.itemCount}>
            {filteredProducts.length} items
          </Text>
        </View>

        <View style={styles.productGrid}>
          {filteredProducts.map((product) => {
            const productIsFavorite = isFavorite(product.id);
            const isSuccessful = successfulProductId === product.id;

            return (
              <View key={product.id} style={styles.productCard}>
                <View
                  ref={(ref) => {
                    productImageRefs.current[product.id] = ref;
                  }}
                  collapsable={false}
                  style={styles.productImageWrap}
                >
                  <Image
                    source={{ uri: product.image }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />

                  {/* Opens the product details without replacing
                      the existing favorite button. */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${product.name} details`}
                    accessibilityHint="Opens the product details page"
                    onPress={() => openProduct(product.id)}
                    style={StyleSheet.absoluteFill}
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      productIsFavorite
                        ? `Remove ${product.name} from favorites`
                        : `Add ${product.name} to favorites`
                    }
                    accessibilityState={{
                      selected: productIsFavorite,
                    }}
                    onPress={() => toggleFavorite(product.id)}
                    style={({ pressed }) => [
                      styles.favoriteButton,
                      pressed && styles.favoriteButtonPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.favoriteIcon,
                        productIsFavorite && styles.favoriteActive,
                      ]}
                    >
                      {productIsFavorite ? '♥' : '♡'}
                    </Text>
                  </Pressable>
                </View>

                <Text style={styles.productCategory}>
                  {product.category}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`View ${product.name} details`}
                  onPress={() => openProduct(product.id)}
                >
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                </Pressable>

                <View style={styles.priceRow}>
                  <Text style={styles.currencySymbol}>₱</Text>
                  <Text style={styles.productPrice}>
                    {product.price.toLocaleString('en-PH')}
                  </Text>
                </View>

                <Animated.View
                  style={{
                    transform: [
                      { scale: isSuccessful ? 1.02 : 1 },
                    ],
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      isSuccessful
                        ? `${product.name} added to cart`
                        : `Add ${product.name} to cart`
                    }
                    accessibilityState={{
                      disabled: isAnimatingRef.current,
                    }}
                    disabled={isAnimatingRef.current}
                    onPress={() => handleAddToCart(product)}
                    style={({ pressed }) => [
                      styles.addToCartButton,
                      isSuccessful && styles.addToCartButtonSuccess,
                      pressed && styles.addToCartButtonPressed,
                    ]}
                  >
                    <Text style={styles.addToCartButtonText}>
                      {isSuccessful ? '✓ Added!' : '+ Add to Cart'}
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            );
          })}
        </View>

        {filteredProducts.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.sectionSubtitle}>
              Try another search or category.
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          A new way to discover good things.
        </Text>
      </ScrollView>

      <Modal
        visible={flyingProduct !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => undefined}
      >
        <View pointerEvents="none" style={styles.flightOverlay}>
          {flyingProduct && (
            <Animated.View
              style={[
                styles.flyingImageWrap,
                {
                  opacity: flyOpacity,
                  transform: [
                    { translateX: flyPosition.x },
                    { translateY: flyPosition.y },
                    { scale: flyScale },
                    { rotate: flyRotate },
                  ],
                },
              ]}
            >
              <Image
                source={{ uri: flyingProduct.product.image }}
                style={styles.flyingImage}
                resizeMode="cover"
              />
            </Animated.View>
          )}
        </View>
      </Modal>

      <Modal
        visible={sidebarVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeSidebar}
      >
        <View style={styles.drawerOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close quick menu"
            style={StyleSheet.absoluteFill}
            onPress={closeSidebar}
          />

          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                transform: [{ translateX: drawerX }],
              },
            ]}
          >
            <SafeAreaView
              style={styles.drawerContent}
              edges={['top', 'bottom']}
            >
              <View style={styles.drawerHeader}>
                <View>
                  <Text style={styles.drawerTitle}>Your space.</Text>
                  <Text style={styles.drawerSubtitle}>
                    SHOP · SELL · DISCOVER
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close menu"
                  onPress={closeSidebar}
                  style={styles.drawerClose}
                >
                  <Text style={styles.drawerCloseText}>×</Text>
                </Pressable>
              </View>

              <View style={styles.drawerDivider} />

              <Text style={styles.drawerSectionLabel}>
                YOUR MARKETPLACE
              </Text>

              {MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.title}
                  accessibilityRole="button"
                  onPress={() => openMenuItem(item.title)}
                  style={({ pressed }) => [
                    styles.drawerItem,
                    pressed && styles.drawerItemPressed,
                  ]}
                >
                  <View style={styles.drawerItemIcon}>
                    <Text style={styles.drawerItemIconText}>
                      {item.icon}
                    </Text>
                  </View>

                  <View style={styles.drawerItemCopy}>
                    <Text style={styles.drawerItemText}>
                      {item.title}
                    </Text>

                    {item.title === 'Shopping Cart & Favorites' && (
                      <Text style={styles.drawerItemSubtitle}>
                        {cartCount} in cart · {favorites.length} saved
                      </Text>
                    )}
                  </View>

                  <Text style={styles.drawerChevron}>›</Text>
                </Pressable>
              ))}

              <View style={styles.drawerNote}>
                <Text style={styles.drawerNoteTitle}>
                  Good finds. Better shopping.
                </Text>
                <Text style={styles.drawerNoteText}>
                  Your tools, all in one place.
                </Text>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 22,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  brand: {
    color: COLORS.text,
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  eyebrow: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: COLORS.accent,
    fontSize: 28,
  },
  cartIcon: {
    fontSize: 21,
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: COLORS.background,
    fontSize: 9,
    fontWeight: '800',
  },
  searchBox: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 28,
  },
  searchIcon: {
    color: COLORS.muted,
    fontSize: 24,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 12,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  categoryList: {
    gap: 9,
    paddingBottom: 28,
  },
  categoryPill: {
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  categoryPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: COLORS.background,
  },
  banner: {
    minHeight: 180,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 30,
  },
  bannerCopy: {
    flex: 1,
    zIndex: 1,
  },
  bannerLabel: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  bannerTitle: {
    color: COLORS.creamText,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 29,
    letterSpacing: -0.8,
  },
  bannerDescription: {
    color: COLORS.creamMuted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
    maxWidth: 220,
  },
  bannerDecoration: {
    color: COLORS.creamDecoration,
    fontSize: 100,
    position: 'absolute',
    right: -5,
    bottom: 10,
  },
  itemCount: {
    color: COLORS.muted,
    fontSize: 11,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 26,
  },
  productCard: {
    width: '48%',
  },
  productImageWrap: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F1EE',
    overflow: 'hidden',
    aspectRatio: 0.82,
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(236,236,232,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },
  favoriteIcon: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 26,
  },
  favoriteActive: {
    color: '#C34F4F',
  },
  productCategory: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  productName: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 7,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  currencySymbol: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  productPrice: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  addToCartButton: {
    minHeight: 42,
    marginTop: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButtonSuccess: {
    backgroundColor: '#065F46',
  },
  addToCartButtonPressed: {
    opacity: 0.82,
  },
  addToCartButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
  },
  flyingImageWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 44,
    height: 44,
    borderRadius: 13,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.background,
    backgroundColor: COLORS.surface,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  flyingImage: {
    width: '100%',
    height: '100%',
  },
  flightOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 35,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 5,
  },
  footer: {
    color: COLORS.muted,
    textAlign: 'center',
    fontSize: 11,
    marginTop: 35,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 20, 18, 0.38)',
    alignItems: 'flex-end',
  },
  drawer: {
    flex: 1,
    maxWidth: '88%',
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  drawerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  drawerSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 6,
  },
  drawerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCloseText: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 30,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 24,
  },
  drawerSectionLabel: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
    marginBottom: 12,
  },
  drawerItem: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    marginBottom: 6,
  },
  drawerItemPressed: {
    backgroundColor: COLORS.surface,
    opacity: 0.8,
  },
  drawerItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemIconText: {
    color: COLORS.accent,
    fontSize: 21,
    fontWeight: '600',
  },
  drawerItemCopy: {
    flex: 1,
  },
  drawerItemText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
  },
  drawerItemSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },
  drawerChevron: {
    color: COLORS.muted,
    fontSize: 24,
  },
  drawerNote: {
    marginTop: 'auto',
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.cream,
  },
  drawerNoteTitle: {
    color: COLORS.creamText,
    fontSize: 13,
    fontWeight: '700',
  },
  drawerNoteText: {
    color: COLORS.creamMuted,
    fontSize: 11,
    marginTop: 5,
  },
});
