
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#087F68';
const DARK_GREEN = '#064B37';
const BACKGROUND = '#F8FCF9';
const SCREEN_WIDTH = Dimensions.get('window').width;

const WELCOME_COMPLETED_KEY = 'sellspace_welcome_completed_v2';

const slides = [
  {
    eyebrow: 'WELCOME TO THE MARKETPLACE',
    title: 'Welcome to\nSELLSPACE',
    description:
      'A marketplace where great products, independent sellers and curious shoppers come together.',
    image: require('../../assets/images/onboarding/01-welcome-sellers-and-buyers.png'),
  },
  {
    eyebrow: 'FOR EVERY ENTREPRENEUR',
    title: 'Your Store,\nYour Business',
    description:
      'Create your own space, showcase products and reach more customers.',
    image: require('../../assets/images/onboarding/02-build-your-store-seller.png'),
  },
  {
    eyebrow: 'YOUR NEXT DISCOVERY',
    title: 'Discover\nSomething New',
    description:
      'Explore products, discover stores and find things you’ll love.',
    image: require('../../assets/images/onboarding/04-grow-together-seller-and-buyer.png'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const isLast = activeIndex === slides.length - 1;

  function goToSlide(index: number) {
    if (index < 0 || index >= slides.length) return;

    listRef.current?.scrollToIndex({
      index,
      animated: true,
    });

    setActiveIndex(index);
  }

  function handleScrollEnd(
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
    );

    setActiveIndex(
      Math.max(0, Math.min(index, slides.length - 1)),
    );
  }

  async function enterMarketplace() {
    if (submitting) return;

    setSubmitting(true);

    try {
      await AsyncStorage.setItem(WELCOME_COMPLETED_KEY, 'true');
    } catch (error) {
      console.warn('Welcome completion could not be saved:', error);
    } finally {
      router.replace('/(tabs)');
    }
  }

  function handleContinue() {
    if (submitting) return;

    if (isLast) {
      void enterMarketplace();
    } else {
      goToSlide(activeIndex + 1);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* Top navigation */}
        <View style={styles.header}>
          {activeIndex === 0 ? (
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <Text style={styles.brandIconText}>S</Text>
              </View>
              <Text style={styles.brandText}>SELLSPACE</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => goToSlide(activeIndex - 1)}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Previous screen"
            >
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => void enterMarketplace()}
            disabled={submitting}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip and explore SELLSPACE"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Welcome slides */}
        <FlatList
          ref={listRef}
          data={slides}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          keyExtractor={(_, index) => `welcome-${index}`}
          onMomentumScrollEnd={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              {/* Illustration section */}
              <View style={styles.hero}>
                <View style={styles.heroGlow} />
                <View style={styles.heroCircleOne} />
                <View style={styles.heroCircleTwo} />

                <Image
                  source={item.image}
                  style={styles.heroImage}
                  resizeMode="contain"
                  accessibilityLabel={item.title.replace('\n', ' ')}
                />
              </View>

              {/* Text section */}
              <View style={styles.content}>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>

                <Text style={styles.title}>{item.title}</Text>

                <Text style={styles.description}>
                  {item.description}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Bottom controls */}
        <View style={styles.bottomArea}>
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <Pressable
                key={index}
                onPress={() => goToSlide(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Go to welcome screen ${index + 1}`}
              >
                <View
                  style={[
                    styles.dot,
                    activeIndex === index && styles.activeDot,
                  ]}
                />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handleContinue}
            disabled={submitting}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryPressed,
              submitting && styles.disabledButton,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {submitting
                ? 'Opening SELLSPACE...'
                : isLast
                  ? 'Explore SELLSPACE  →'
                  : 'Next  →'}
            </Text>
          </Pressable>

          <Text style={styles.footer}>
            Explore first. Discover more. Join when you’re ready.
          </Text>
        </View>

        {/* Decorative bottom waves */}
        <View pointerEvents="none" style={styles.waveContainer}>
          <View style={styles.waveMint} />
          <View style={styles.waveGreen} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },

  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: BACKGROUND,
  },

  header: {
    height: 54,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 5,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  brandIcon: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandIconText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },

  brandText: {
    color: DARK_GREEN,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  backButton: {
    width: 42,
    height: 42,
    justifyContent: 'center',
  },

  backArrow: {
    color: DARK_GREEN,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '400',
  },

  skipText: {
    color: DARK_GREEN,
    fontSize: 15,
    fontWeight: '800',
  },

  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  hero: {
    flex: 1.12,
    width: '100%',
    minHeight: 230,
    maxHeight: 490,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },

  heroGlow: {
    position: 'absolute',
    width: '105%',
    height: '88%',
    borderRadius: 260,
    backgroundColor: '#DDF5E8',
    opacity: 0.8,
  },

  heroCircleOne: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 100,
    backgroundColor: '#BCEBD1',
    opacity: 0.45,
    left: -35,
    bottom: 35,
  },

  heroCircleTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#A8E5C4',
    opacity: 0.35,
    right: -50,
    top: 35,
  },

  heroImage: {
    width: '112%',
    height: '100%',
    zIndex: 2,
  },

  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingTop: 13,
    paddingBottom: 15,
  },

  eyebrow: {
    color: GREEN,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },

  title: {
    color: DARK_GREEN,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    letterSpacing: -1.1,
    textAlign: 'center',
  },

  description: {
    color: '#25372E',
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 15,
    maxWidth: 340,
  },

  bottomArea: {
    paddingHorizontal: 23,
    paddingTop: 8,
    paddingBottom: 16,
    zIndex: 3,
  },

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 11,
    marginBottom: 22,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 10,
    backgroundColor: '#BED5C5',
  },

  activeDot: {
    width: 12,
    height: 12,
    backgroundColor: DARK_GREEN,
  },

  primaryButton: {
    height: 57,
    borderRadius: 30,
    backgroundColor: GREEN,
    borderWidth: 1,
    borderColor: '#056B53',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DARK_GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 9,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    elevation: 5,
  },

  primaryPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  footer: {
    textAlign: 'center',
    color: '#71867A',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 16,
  },

  waveContainer: {
    position: 'absolute',
    bottom: -39,
    left: -30,
    right: -30,
    height: 65,
    zIndex: 0,
  },

  waveMint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 120,
    backgroundColor: '#C9EED9',
  },

  waveGreen: {
    position: 'absolute',
    top: 20,
    left: '27%',
    right: -10,
    height: 48,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    backgroundColor: '#64C99A',
  },
});
