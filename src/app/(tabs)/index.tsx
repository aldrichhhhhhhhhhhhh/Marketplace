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
  PanResponder,
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

const markets = [
  {
    id: 'marketplace',
    title: 'Marketplace',
    subtitle: 'Everyday products and shops',
    icon: '🛍',
  },
  {
    id: 'dealership',
    title: 'Dealership',
    subtitle: 'Cars, motorcycles and dealers',
    icon: '🚘',
  },
  {
    id: 'foods',
    title: 'Foods & Drinks',
    subtitle: 'Food sellers, menus and beverages',
    icon: '🥗',
  },
  {
    id: 'realestate',
    title: 'Real Estate',
    subtitle: 'Properties for sale or rent',
    icon: '🏡',
  },
] as const;

const vehicles = [
  {
    id: 'car-1',
    name: 'Toyota Vios 1.3 XLE',
    price: 625000,
    kind: 'Cars',
    year: '2022',
    mileage: '28,000 km',
    transmission: 'Automatic',
    location: 'Quezon City',
    seller: 'Sample Motors',
    image:
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=900',
  },
  {
    id: 'car-2',
    name: 'Honda Civic RS',
    price: 1180000,
    kind: 'Cars',
    year: '2023',
    mileage: '16,500 km',
    transmission: 'Automatic',
    location: 'Makati City',
    seller: 'Metro Auto Hub',
    image:
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=900',
  },
  {
    id: 'moto-1',
    name: 'Yamaha NMAX 155',
    price: 118000,
    kind: 'Motorcycles',
    year: '2024',
    mileage: '4,200 km',
    transmission: 'Automatic',
    location: 'Pasig City',
    seller: 'RideReady Motors',
    image:
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900',
  },
  {
    id: 'moto-2',
    name: 'Honda Click 160',
    price: 92000,
    kind: 'Motorcycles',
    year: '2023',
    mileage: '7,800 km',
    transmission: 'Automatic',
    location: 'Manila',
    seller: 'City Cycle Trading',
    image:
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=900',
  },
] as const;

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
type MarketId = (typeof markets)[number]['id'];
type VehicleType = 'All' | 'Cars' | 'Motorcycles';

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
  const [activeMarket, setActiveMarket] =
    useState<MarketId>('marketplace');
  const [marketPickerVisible, setMarketPickerVisible] = useState(false);
  const [logBookVisible, setLogBookVisible] = useState(false);
  const [logBookExpanded, setLogBookExpanded] = useState(false);

  // Animate the sheet's actual height so it follows the finger while dragging.
  // Keep the responder on the handle so the status tabs/content remain scrollable.
  const windowHeight = Dimensions.get('window').height;
  const logBookCollapsedHeight = windowHeight * 0.68;
  const logBookExpandedHeight = windowHeight * 0.94;
  const logBookHeight = useRef(
    new Animated.Value(logBookCollapsedHeight),
  ).current;
  const logBookCurrentHeight = useRef(logBookCollapsedHeight);
  const logBookDragStartHeight = useRef(logBookCollapsedHeight);

  const logBookPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 3 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        logBookHeight.stopAnimation((value) => {
          logBookCurrentHeight.current = value;
          logBookDragStartHeight.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const nextHeight = Math.max(
          logBookCollapsedHeight,
          Math.min(
            logBookExpandedHeight,
            logBookDragStartHeight.current - gestureState.dy,
          ),
        );
        logBookCurrentHeight.current = nextHeight;
        logBookHeight.setValue(nextHeight);
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        const shouldExpand =
          gestureState.vy < -0.45 ||
          (gestureState.vy >= -0.45 &&
            logBookCurrentHeight.current >
              (logBookCollapsedHeight + logBookExpandedHeight) / 2);
        const targetHeight = shouldExpand
          ? logBookExpandedHeight
          : logBookCollapsedHeight;

        setLogBookExpanded(shouldExpand);
        logBookCurrentHeight.current = targetHeight;
        Animated.spring(logBookHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          stiffness: 240,
          damping: 28,
          mass: 0.8,
        }).start();
      },
      onPanResponderTerminate: () => {
        const targetHeight = logBookExpanded
          ? logBookExpandedHeight
          : logBookCollapsedHeight;
        logBookCurrentHeight.current = targetHeight;
        Animated.spring(logBookHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          stiffness: 240,
          damping: 28,
          mass: 0.8,
        }).start();
      },
    }),
  ).current;
  const [activeLogBookStatus, setActiveLogBookStatus] = useState('Inquiries');
  const [vehicleType, setVehicleType] = useState<VehicleType>('All');
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

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesType =
      vehicleType === 'All' || vehicle.kind === vehicleType;

    const searchableText =
      `${vehicle.name} ${vehicle.seller} ${vehicle.location} ${vehicle.year}`;

    return (
      matchesType &&
      searchableText.toLowerCase().includes(search.toLowerCase())
    );
  });

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

  function openLogBook() {
    setActiveLogBookStatus('Inquiries');
    setLogBookExpanded(false);
    logBookCurrentHeight.current = logBookCollapsedHeight;
    logBookDragStartHeight.current = logBookCollapsedHeight;
    logBookHeight.setValue(logBookCollapsedHeight);
    setLogBookVisible(true);
  }

  function getMenuTitle(title: string) {
    if (activeMarket !== 'dealership') return title;
    if (title === 'Shopping Cart & Favorites') return 'My LogBook';
    if (title === 'My Shop') return 'My Dealership';
    return title;
  }

  function selectMarket(marketId: MarketId) {
    setActiveMarket(marketId);
    setSearch('');
    setCategory('All');
    setVehicleType('All');
    setMarketPickerVisible(false);
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
      if (activeMarket === 'dealership') {
        closeSidebar();
        setTimeout(() => openLogBook(), 240);
      } else {
        navigateTo('/cart');
      }
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
      getMenuTitle(item),
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose marketplace type"
              accessibilityHint="Opens the available marketplace categories"
              onPress={() => setMarketPickerVisible(true)}
              style={({ pressed }) => [
                styles.brandSwitcher,
                pressed && styles.brandSwitcherPressed,
              ]}
            >
              <Text style={styles.brand}>
                {activeMarket === 'marketplace'
                  ? 'marketplace.'
                  : activeMarket === 'dealership'
                    ? 'dealership.'
                    : activeMarket === 'foods'
                      ? 'foods & drinks.'
                      : 'real estate.'}
              </Text>
              <Text style={styles.brandChevron}>⌄</Text>
            </Pressable>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              ref={activeMarket === 'dealership' ? undefined : cartButtonRef}
              collapsable={false}
              accessibilityRole="button"
              accessibilityLabel={
                activeMarket === 'dealership'
                  ? 'Open My LogBook'
                  : `Shopping cart, ${cartCount} items`
              }
              accessibilityHint={
                activeMarket === 'dealership'
                  ? 'Track inquiries, schedules, viewings, completed and cancelled activity'
                  : 'Opens your cart and favorites'
              }
              onPress={activeMarket === 'dealership' ? openLogBook : openCart}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.headerButtonPressed,
              ]}
            >
              <Text style={styles.cartIcon}>
                {activeMarket === 'dealership' ? '▤' : '🛒'}
              </Text>

              {activeMarket !== 'dealership' && cartCount > 0 && (
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

        {activeMarket === 'marketplace' ? (
          <>
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
                const isSuccessful =
                  successfulProductId === product.id;

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
                            productIsFavorite &&
                              styles.favoriteActive,
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
                      <Text
                        style={styles.productName}
                        numberOfLines={2}
                      >
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
                          isSuccessful &&
                            styles.addToCartButtonSuccess,
                          pressed &&
                            styles.addToCartButtonPressed,
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
                <Text style={styles.emptyTitle}>
                  No products found
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Try another search or category.
                </Text>
              </View>
            )}

            <Text style={styles.footer}>
              A new way to discover good things.
            </Text>
          </>
        ) : activeMarket === 'dealership' ? (
          <>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search cars, motorcycles or dealers"
                placeholderTextColor={COLORS.muted}
                style={styles.searchInput}
                returnKeyType="search"
              />
            </View>

            <View style={styles.dealershipHero}>
              <Text style={styles.dealershipEyebrow}>
                SELLSPACE · DEALERSHIP
              </Text>
              <Text style={styles.dealershipHeroTitle}>
                Find your next ride.
              </Text>
              <Text style={styles.dealershipHeroDescription}>
                Explore cars and motorcycles from vehicle sellers.
              </Text>

              <View style={styles.vehicleStatsRow}>
                <View style={styles.vehicleStat}>
                  <Text style={styles.vehicleStatValue}>Cars</Text>
                  <Text style={styles.vehicleStatLabel}>
                    Find your fit
                  </Text>
                </View>

                <View style={styles.vehicleStatDivider} />

                <View style={styles.vehicleStat}>
                  <Text style={styles.vehicleStatValue}>
                    Motorcycles
                  </Text>
                  <Text style={styles.vehicleStatLabel}>
                    Ride your way
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionTitle}>
                  Browse vehicles
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Find a ride that fits your life
                </Text>
              </View>

              <Text style={styles.itemCount}>
                {filteredVehicles.length} listings
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            >
              {(['All', 'Cars', 'Motorcycles'] as const).map(
                (item) => {
                  const selected = vehicleType === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setVehicleType(item)}
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
                },
              )}
            </ScrollView>

            <View style={styles.vehicleGrid}>
              {filteredVehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <View style={styles.vehicleImageWrap}>
                    <Image
                      source={{ uri: vehicle.image }}
                      style={styles.vehicleImage}
                      resizeMode="cover"
                    />

                    <View style={styles.vehicleTypeBadge}>
                      <Text style={styles.vehicleTypeBadgeText}>
                        {vehicle.kind === 'Cars'
                          ? 'CAR'
                          : 'MOTORCYCLE'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.productCategory}>
                    {vehicle.year} · {vehicle.mileage}
                  </Text>

                  <Text style={styles.vehicleName} numberOfLines={2}>
                    {vehicle.name}
                  </Text>

                  <Text style={styles.vehiclePrice}>
                    ₱{vehicle.price.toLocaleString('en-PH')}
                  </Text>

                  <Text style={styles.vehicleMeta}>
                    {vehicle.transmission} · {vehicle.location}
                  </Text>

                  <View style={styles.vehicleSellerRow}>
                    <View style={styles.sellerDot}>
                      <Text style={styles.sellerDotText}>D</Text>
                    </View>

                    <Text
                      style={styles.vehicleSeller}
                      numberOfLines={1}
                    >
                      {vehicle.seller}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() =>
                      Alert.alert(
                        vehicle.name,
                        `Seller: ${vehicle.seller}\nLocation: ${vehicle.location}\n\nVehicle detail pages and dealer inquiries will be added in the next dealership step.`,
                      )
                    }
                    style={({ pressed }) => [
                      styles.vehicleInquiryButton,
                      pressed && styles.addToCartButtonPressed,
                    ]}
                  >
                    <Text style={styles.vehicleInquiryText}>
                      View vehicle
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {filteredVehicles.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  No vehicles found
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Try another search or vehicle type.
                </Text>
              </View>
            )}

            <Text style={styles.footer}>
              Your next ride starts here.
            </Text>
          </>
        ) : (
          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonIcon}>
              {activeMarket === 'foods' ? '🥗' : '🏡'}
            </Text>

            <Text style={styles.comingSoonEyebrow}>
              SELLSPACE · COMING SOON
            </Text>

            <Text style={styles.comingSoonTitle}>
              {activeMarket === 'foods'
                ? 'Foods & Drinks'
                : 'Real Estate'}
            </Text>

            <Text style={styles.comingSoonDescription}>
              {activeMarket === 'foods'
                ? 'Discover local food sellers, menus, and drinks. We are preparing this marketplace next.'
                : 'Explore properties for sale and rent. This marketplace will be built after Dealership.'}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => setMarketPickerVisible(true)}
              style={({ pressed }) => [
                styles.comingSoonButton,
                pressed && styles.addToCartButtonPressed,
              ]}
            >
              <Text style={styles.comingSoonButtonText}>
                Choose another market
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={marketPickerVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMarketPickerVisible(false)}
      >
        <View style={styles.marketPickerOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close marketplace choices"
            style={StyleSheet.absoluteFill}
            onPress={() => setMarketPickerVisible(false)}
          />

          <View style={styles.marketPickerSheet}>
            <View style={styles.marketPickerHandle} />

            <Text style={styles.marketPickerEyebrow}>
              ONE APP · MORE POSSIBILITIES
            </Text>
            <Text style={styles.marketPickerTitle}>
              Choose your market
            </Text>
            <Text style={styles.marketPickerDescription}>
              Switch between different ways to discover and buy.
            </Text>

            {markets.map((market) => {
              const selected = activeMarket === market.id;
              const comingSoon =
                market.id === 'foods' ||
                market.id === 'realestate';

              return (
                <Pressable
                  key={market.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => selectMarket(market.id)}
                  style={({ pressed }) => [
                    styles.marketOption,
                    selected && styles.marketOptionSelected,
                    pressed && styles.marketOptionPressed,
                  ]}
                >
                  <View
                    style={[
                      styles.marketOptionIcon,
                      selected && styles.marketOptionIconSelected,
                    ]}
                  >
                    <Text style={styles.marketOptionEmoji}>
                      {market.icon}
                    </Text>
                  </View>

                  <View style={styles.marketOptionCopy}>
                    <Text style={styles.marketOptionTitle}>
                      {market.title}
                    </Text>
                    <Text style={styles.marketOptionSubtitle}>
                      {market.subtitle}
                    </Text>
                  </View>

                  {comingSoon && (
                    <Text style={styles.comingSoonTag}>SOON</Text>
                  )}

                  {selected && (
                    <Text style={styles.marketOptionCheck}>✓</Text>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              onPress={() => setMarketPickerVisible(false)}
              style={styles.marketPickerCancel}
            >
              <Text style={styles.marketPickerCancelText}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={logBookVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setLogBookVisible(false)}
      >
        <View style={styles.logBookOverlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close LogBook"
            style={StyleSheet.absoluteFill}
            onPress={() => setLogBookVisible(false)}
          />
          <Animated.View
            style={[styles.logBookSheet, { height: logBookHeight }]}
            accessibilityLabel="LogBook sheet. Drag the handle up to expand or down to collapse."
          >
            <View
              {...logBookPanResponder.panHandlers}
              style={styles.logBookDragArea}
              accessibilityRole="adjustable"
              accessibilityLabel="LogBook handle. Drag up to expand or down to collapse."
            >
              <View style={styles.marketPickerHandle} />
            </View>
            <View style={styles.logBookHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.marketPickerEyebrow}>
                  DEALERSHIP · ACTIVITY
                </Text>
                <Text style={styles.logBookTitle}>My LogBook</Text>
                <Text style={styles.logBookDescription}>
                  Keep track of every buyer inquiry and vehicle appointment.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close LogBook"
                onPress={() => setLogBookVisible(false)}
                style={styles.drawerClose}
              >
                <Text style={styles.drawerCloseText}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.logBookStatusScroll}
              contentContainerStyle={styles.logBookStatusList}
            >
              {['Inquiries', 'Schedules', 'Viewings', 'Completed', 'Cancelled'].map((status) => {
                const selected = activeLogBookStatus === status;
                return (
                  <Pressable
                    key={status}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setActiveLogBookStatus(status)}
                    style={[
                      styles.logBookStatusPill,
                      selected && styles.logBookStatusPillActive,
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.logBookStatusText,
                        selected && styles.logBookStatusTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.logBookEmptyState}>
              <View style={styles.logBookEmptyIcon}>
                <Text style={styles.logBookEmptyIconText}>▤</Text>
              </View>
              <Text style={styles.logBookEmptyTitle}>
                No {activeLogBookStatus.toLowerCase()} yet
              </Text>
              <Text style={styles.logBookEmptyDescription}>
                {activeLogBookStatus === 'Inquiries'
                  ? 'Buyer inquiries about your vehicles will appear here.'
                  : activeLogBookStatus === 'Schedules'
                    ? 'Confirmed appointments will appear here.'
                    : activeLogBookStatus === 'Viewings'
                      ? 'Vehicle viewing activity will appear here.'
                      : activeLogBookStatus === 'Completed'
                        ? 'Completed transactions and visits will appear here.'
                        : 'Cancelled inquiries and appointments will appear here.'}
              </Text>
              <Text style={styles.logBookFootnote}>
                Your activity will appear here once inquiry and appointment flows are connected.
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
                      {getMenuTitle(item.title)}
                    </Text>

                    {item.title === 'Shopping Cart & Favorites' &&
                      activeMarket !== 'dealership' && (
                        <Text style={styles.drawerItemSubtitle}>
                          {cartCount} in cart · {favorites.length} saved
                        </Text>
                      )}

                    {item.title === 'Shopping Cart & Favorites' &&
                      activeMarket === 'dealership' && (
                        <Text style={styles.drawerItemSubtitle}>
                          Inquiries · appointments · vehicle viewings
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
  brandSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  brandSwitcherPressed: {
    opacity: 0.68,
  },
  brandChevron: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '600',
    marginTop: -5,
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
    alignSelf: 'center',
    flexGrow: 0,
    flexShrink: 0,
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
  marketPickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 20, 18, 0.42)',
  },
  marketPickerSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
  },
  marketPickerHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D9DDD9',
    marginBottom: 22,
  },
  marketPickerEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 7,
  },
  marketPickerTitle: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  marketPickerDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    marginBottom: 18,
  },
  marketOption: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 9,
  },
  marketOptionSelected: {
    backgroundColor: '#F0F7F3',
    borderColor: '#A8D1BF',
  },
  marketOptionPressed: {
    opacity: 0.76,
  },
  marketOptionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marketOptionIconSelected: {
    backgroundColor: '#DCEFE6',
  },
  marketOptionEmoji: {
    fontSize: 22,
  },
  marketOptionCopy: {
    flex: 1,
  },
  marketOptionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  marketOptionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  comingSoonTag: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    backgroundColor: '#F1F2F0',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
  },
  marketOptionCheck: {
    color: COLORS.accent,
    fontSize: 19,
    fontWeight: '800',
    marginHorizontal: 3,
  },
  marketPickerCancel: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  marketPickerCancelText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  dealershipHero: {
    backgroundColor: '#EAF2ED',
    borderRadius: 22,
    padding: 21,
    marginBottom: 28,
    overflow: 'hidden',
  },
  dealershipEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  dealershipHeroTitle: {
    color: '#0B3D33',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  dealershipHeroDescription: {
    color: '#537367',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 260,
  },
  vehicleStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#D2E2D8',
  },
  vehicleStat: {
    flex: 1,
  },
  vehicleStatValue: {
    color: '#0B3D33',
    fontSize: 14,
    fontWeight: '800',
  },
  vehicleStatLabel: {
    color: '#537367',
    fontSize: 10,
    marginTop: 4,
  },
  vehicleStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#C8DCCF',
    marginHorizontal: 14,
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 25,
  },
  vehicleCard: {
    width: '48%',
  },
  vehicleImageWrap: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderRadius: 17,
    overflow: 'hidden',
    aspectRatio: 0.88,
    marginBottom: 11,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleTypeBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  vehicleTypeBadgeText: {
    color: COLORS.creamText,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  vehicleName: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    minHeight: 36,
    marginTop: 5,
  },
  vehiclePrice: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4,
  },
  vehicleMeta: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
  },
  vehicleSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  sellerDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCEFE6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerDotText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
  },
  vehicleSeller: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  vehicleInquiryButton: {
    minHeight: 38,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 11,
    paddingHorizontal: 8,
  },
  vehicleInquiryText: {
    color: COLORS.background,
    fontSize: 11,
    fontWeight: '700',
  },
  logBookOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17, 20, 18, 0.42)',
  },
  logBookSheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  logBookDragArea: {
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  logBookHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  logBookTitle: {
    color: COLORS.text,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.7,
    marginTop: 3,
  },
  logBookDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    maxWidth: 280,
  },
  logBookStatusScroll: {
    height: 62,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  logBookStatusList: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingBottom: 12,
    paddingRight: 4,
  },
  logBookStatusPill: {
    height: 44,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: 'center',
  },
  logBookStatusPillActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  logBookStatusText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    includeFontPadding: false,
    textAlign: 'center',
  },
  logBookStatusTextActive: {
    color: COLORS.background,
  },
  logBookEmptyState: {
    flex: 1,
    minHeight: 260,
    marginTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    backgroundColor: '#FCFCFB',
  },
  logBookEmptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logBookEmptyIconText: {
    color: COLORS.accent,
    fontSize: 30,
    fontWeight: '700',
  },
  logBookEmptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  logBookEmptyDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 270,
  },
  logBookFootnote: {
    color: COLORS.creamMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 18,
    maxWidth: 270,
  },
  comingSoon: {
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: 22,
    paddingHorizontal: 24,
    paddingVertical: 38,
    marginTop: 8,
    marginBottom: 28,
  },
  comingSoonIcon: {
    fontSize: 44,
    marginBottom: 18,
  },
  comingSoonEyebrow: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  comingSoonTitle: {
    color: COLORS.creamText,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 9,
  },
  comingSoonDescription: {
    color: COLORS.creamMuted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 10,
  },
  comingSoonButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 22,
  },
  comingSoonButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '700',
  },
});