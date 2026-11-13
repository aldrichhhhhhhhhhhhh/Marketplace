
import { useMarketplace } from '@/context/MarketplaceContext';
import { getActiveListings, type PublicListing } from '@/lib/listings';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  background: '#FFFFFF',
  surface: '#F6F8F6',
  text: '#171D1B',
  muted: '#7A8580',
  border: '#E8ECE9',
  accent: '#087F68',
  accentDark: '#066653',
  accentLight: '#E8F4F0',
  white: '#FFFFFF',
};

type Product = PublicListing;

export default function ExploreScreen() {
  const router = useRouter();

  const { toggleFavorite, isFavorite, addToCart } = useMarketplace();

  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const loadListings = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const result = await getActiveListings();

      setListings(
        result.filter((listing) => listing.listingType === 'product'),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load products right now.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadListings();

    return () => {};
  }, [loadListings]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        listings
          .map((item) => item.category?.trim())
          .filter((category): category is string => Boolean(category)),
      ),
    );

    return ['All', ...uniqueCategories];
  }, [listings]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return listings.filter((product) => {
      const matchesCategory =
        activeCategory === 'All' ||
        product.category.toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch) ||
        product.description.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [listings, search, activeCategory]);

  const openProduct = (productId: string) => {
    router.push({
      pathname: '/product/[id]',
      params: { id: productId },
    });
  };

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString('en-PH')}`;
  };

  const renderProduct = (product: Product) => {
    const favorite = isFavorite(product.id);

    return (
      <View key={product.id} style={styles.productCard}>
        <View style={styles.imageContainer}>
          <Pressable
            onPress={() => openProduct(product.id)}
            accessibilityRole="button"
            accessibilityLabel={`View ${product.name}`}
            style={styles.imagePressable}
          >
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                style={styles.productImage}
                contentFit="cover"
                transition={180}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>SELLSPACE</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => toggleFavorite(product.id)}
            accessibilityRole="button"
            accessibilityLabel={
              favorite
                ? `Remove ${product.name} from favorites`
                : `Add ${product.name} to favorites`
            }
            accessibilityState={{ selected: favorite }}
            style={({ pressed }) => [
              styles.favoriteButton,
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.favoriteIcon,
                favorite && styles.favoriteIconActive,
              ]}
            >
              {favorite ? '♥' : '♡'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.productCategory} numberOfLines={1}>
            {product.category}
          </Text>

          <Pressable
            onPress={() => openProduct(product.id)}
            accessibilityRole="button"
          >
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
          </Pressable>

          <Text style={styles.productPrice}>
            {formatPrice(product.price)}
          </Text>

          <Pressable
            onPress={() => addToCart(product)}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.addButtonPressed,
            ]}
          >
            <Text style={styles.addButtonText}>+ Add to Cart</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadListings(true)}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SELLSPACE MARKETPLACE</Text>
            <Text style={styles.heading}>Discover</Text>
            <Text style={styles.subtitle}>
              Find something worth bringing home.
            </Text>
          </View>

          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>S</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>⌕</Text>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, categories..."
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            returnKeyType="search"
            accessibilityLabel="Search marketplace products"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearSearch}>×</Text>
            </Pressable>
          )}
        </View>

        {/* Discovery banner */}
        <View style={styles.discoveryBanner}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerEyebrow}>A WORLD OF FINDS</Text>
            <Text style={styles.bannerTitle}>
              Good finds.{'\n'}Great possibilities.
            </Text>
            <Text style={styles.bannerDescription}>
              Explore products from the SELLSPACE marketplace.
            </Text>
          </View>

          <View style={styles.bannerDecoration}>
            <Text style={styles.bannerDecorationText}>S</Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Browse categories</Text>
              <Text style={styles.sectionSubtitle}>
                Explore what's available
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((category) => {
              const selected = activeCategory === category;

              return (
                <Pressable
                  key={category}
                  onPress={() => setActiveCategory(category)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.categoryChip,
                    selected && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selected && styles.categoryTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                {search || activeCategory !== 'All'
                  ? 'Search results'
                  : 'Recently added'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {filteredProducts.length} product
                {filteredProducts.length === 1 ? '' : 's'} available
              </Text>
            </View>

            <Pressable
              onPress={() => {
                setSearch('');
                setActiveCategory('All');
              }}
              accessibilityRole="button"
            >
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.stateText}>
                Finding products for you...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateTitle}>
                We couldn't load products
              </Text>
              <Text style={styles.stateText}>{error}</Text>

              <Pressable
                onPress={() => void loadListings()}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.emptyIcon}>⌕</Text>
              <Text style={styles.stateTitle}>Nothing found just yet</Text>
              <Text style={styles.stateText}>
                Try another search or explore a different category.
              </Text>

              <Pressable
                onPress={() => {
                  setSearch('');
                  setActiveCategory('All');
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Explore all products</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {filteredProducts.map(renderProduct)}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SELLSPACE</Text>
          <Text style={styles.footerText}>
            One marketplace. Endless possibilities.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.7,
    color: COLORS.accent,
    marginBottom: 7,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: COLORS.muted,
  },
  brandMark: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '900',
  },
  searchContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 22,
  },
  searchIcon: {
    fontSize: 25,
    color: COLORS.muted,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearch: {
    color: COLORS.muted,
    fontSize: 24,
    paddingHorizontal: 5,
  },
  discoveryBanner: {
    minHeight: 176,
    borderRadius: 21,
    backgroundColor: COLORS.accent,
    padding: 21,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    marginBottom: 30,
  },
  bannerTextContainer: {
    flex: 1,
    zIndex: 1,
  },
  bannerEyebrow: {
    color: '#C9E8DD',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  bannerTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 29,
  },
  bannerDescription: {
    color: '#DCEFE8',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 9,
    maxWidth: 220,
  },
  bannerDecoration: {
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginRight: -37,
    transform: [{ rotate: '-15deg' }],
  },
  bannerDecorationText: {
    color: 'rgba(255,255,255,0.24)',
    fontSize: 100,
    fontWeight: '900',
  },
  section: {
    marginBottom: 29,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.35,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 4,
  },
  categoryList: {
    gap: 9,
    paddingRight: 4,
  },
  categoryChip: {
    paddingHorizontal: 17,
    paddingVertical: 10,
    borderRadius: 30,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.muted,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accent,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 19,
  },
  productCard: {
    width: '48.2%',
    backgroundColor: COLORS.white,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.88,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  imagePressable: {
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentLight,
  },
  placeholderText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    color: COLORS.text,
    fontSize: 20,
  },
  favoriteIconActive: {
    color: '#D94663',
  },
  productDetails: {
    paddingTop: 10,
  },
  productCategory: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 18,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 7,
  },
  addButton: {
    minHeight: 39,
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  addButtonPressed: {
    backgroundColor: COLORS.accentDark,
    opacity: 0.9,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  stateContainer: {
    minHeight: 190,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 10,
  },
  stateText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 36,
    color: COLORS.accent,
  },
  retryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginTop: 15,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 12,
  },
  footerBrand: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
});
