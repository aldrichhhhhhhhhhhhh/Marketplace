
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal, Platform, Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import LocationMap from '../../components/listing-map/LocationMap';
import type { MapPoint } from '../../components/listing-map/LocationMap.types';
import { supabase } from '../../lib/supabase';

const GREEN = '#047857';
const MAX_PHOTOS = 10;
const SAVED_LOCATIONS_KEY = 'sellspace:saved-listing-locations:v1';

type SavedLocation = { id: string; label: string; address: string; latitude: number; longitude: number };

type ListingPhoto = {
  uri: string;
  fileName: string;
  mimeType: string;
};

type ListingType = 'product' | 'vehicle' | 'food' | 'property' | 'service';
type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'used';

const LISTING_TYPES: { value: ListingType; label: string }[] = [
  { value: 'product', label: 'Product' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'food', label: 'Food' },
  { value: 'property', label: 'Property' },
  { value: 'service', label: 'Service' },
];

const CONDITIONS: { value: ListingCondition; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'used', label: 'Used' },
];


type PhotoViewerProps = {
  uri: string;
  onSwipe: (direction: -1 | 1) => void;
  resetKey: string;
};

function PhotoViewer({ uri, onSwipe, resetKey }: PhotoViewerProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1);
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    startX.value = 0;
    startY.value = 0;
  }, [resetKey, scale, savedScale, translateX, translateY, startX, startY]);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(4, savedScale.value * event.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value > 1.02) {
        translateX.value = startX.value + event.translationX;
        translateY.value = startY.value + event.translationY;
      }
    })
    .onEnd((event) => {
      if (scale.value <= 1.02 && Math.abs(event.translationX) > 70 && Math.abs(event.translationX) > Math.abs(event.translationY)) {
        runOnJS(onSwipe)(event.translationX < 0 ? 1 : -1);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const gestures = Gesture.Simultaneous(pinch, pan, doubleTap);
  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gestures}>
      <View style={styles.previewImageStage}>
        <Animated.Image source={{ uri }} style={[styles.previewImage, animatedImageStyle]} resizeMode="contain" />
      </View>
    </GestureDetector>
  );
}

export default function CreateListingScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ListingType>('product');
  const [condition, setCondition] = useState<ListingCondition>('new');
  const [city, setCity] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [locationPoint, setLocationPoint] = useState<MapPoint | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [savedLocationLabel, setSavedLocationLabel] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationsLoaded, setLocationsLoaded] = useState(false);
  const [locationSource, setLocationSource] = useState<'gps' | 'search' | 'map' | 'manual'>('search');
  const [isPublishing, setIsPublishing] = useState(false);
  const [photos, setPhotos] = useState<ListingPhoto[]>([]);
  const [failedPhotoUris, setFailedPhotoUris] = useState<string[]>([]);
  const [loadedPhotoUris, setLoadedPhotoUris] = useState<string[]>([]);
  const [retryTokens, setRetryTokens] = useState<Record<string, number>>({});
  const [previewPhotoUri, setPreviewPhotoUri] = useState<string | null>(null);
  const previewPhotoIndex = photos.findIndex((photo) => photo.uri === previewPhotoUri);
  const previewPhoto = previewPhotoIndex >= 0 ? photos[previewPhotoIndex] : null;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(SAVED_LOCATIONS_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw) as SavedLocation[];
        if (Array.isArray(parsed)) setSavedLocations(parsed);
      })
      .catch((error) => console.warn('Could not load saved locations:', error))
      .finally(() => { if (active) setLocationsLoaded(true); });
    return () => { active = false; };
  }, []);

  async function persistSavedLocations(next: SavedLocation[]) {
    setSavedLocations(next);
    try {
      await AsyncStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Could not save locations:', error);
      Alert.alert('Unable to save location', 'Your saved locations could not be stored on this device. Please try again.');
    }
  }

  async function resolveAddress(latitude: number, longitude: number) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed (${response.status}).`);
      }

      const data = await response.json();
      return typeof data.display_name === 'string' ? data.display_name : '';
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      return '';
    }
  }

  async function handleMapPick(point: MapPoint) {
    setLocationSource('map');
    setLocationPoint(point);
    setLocationConfirmed(false);
    setLocationError('');
    setLocationBusy(true);

    try {
      const address = await resolveAddress(
        point.latitude,
        point.longitude,
      );

      if (address) {
        setLocationAddress(address);
        setLocationSearch(address);
      } else {
        setLocationError(
          'Location captured. Please enter the address manually, then confirm the pin.',
        );
      }
    } finally {
      setLocationBusy(false);
    }
  }

  async function useCurrentLocation() {
    setLocationError('');
    setLocationBusy(true);

    try {
      let point: MapPoint;

      if (
        Platform.OS === 'web' &&
        typeof navigator !== 'undefined' &&
        navigator.geolocation
      ) {
        point = await new Promise<MapPoint>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => reject(error),
            {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 30000,
            },
          );
        });
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!permission.granted) {
          throw new Error('Location permission was denied.');
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        point = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      setLocationSource('gps');
      setLocationPoint(point);
      setLocationConfirmed(false);

      const address = await resolveAddress(
        point.latitude,
        point.longitude,
      );

      if (address) {
        setLocationAddress(address);
        setLocationSearch(address);
      } else {
        setLocationError(
          'GPS location found. Please enter the address manually, then confirm the pin.',
        );
      }
    } catch (error) {
      console.warn('Could not get current location:', error);
      setLocationError(
        error instanceof Error
          ? error.message
          : 'Could not get your current location. Try selecting a point on the map.',
      );
    } finally {
      setLocationBusy(false);
    }
  }

  async function searchLocation() {
    const query = locationSearch.trim();

    if (!query) {
      setLocationError('Enter an address or place to search.');
      return;
    }

    setLocationBusy(true);
    setLocationError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
        {
          headers: { Accept: 'application/json' },
        },
      );

      if (!response.ok) {
        throw new Error(`Address provider returned HTTP ${response.status}.`);
      }

      const results = await response.json();

      if (!Array.isArray(results) || results.length === 0) {
        setLocationError(
          'No matching location found. Try adding your barangay, city, or province.',
        );
        return;
      }

      const result = results[0];
      const point: MapPoint = {
        latitude: Number(result.lat),
        longitude: Number(result.lon),
      };

      if (
        !Number.isFinite(point.latitude) ||
        !Number.isFinite(point.longitude)
      ) {
        throw new Error('The address provider returned invalid coordinates.');
      }

      setLocationSource('search');
      setLocationPoint(point);
      setLocationAddress(String(result.display_name || query));
      setLocationSearch(String(result.display_name || query));
      setLocationConfirmed(false);
    } catch (error) {
      console.warn('Location search failed:', error);
      setLocationError(
        error instanceof Error
          ? `Address search failed: ${error.message}`
          : 'Address search is temporarily unavailable. You can still select a point on the map and enter the address manually.',
      );
    } finally {
      setLocationBusy(false);
    }
  }

  function selectSavedLocation(item: SavedLocation) {
    setLocationSource('manual');
    setLocationAddress(item.address);
    setLocationSearch(item.address);
    setLocationPoint({ latitude: item.latitude, longitude: item.longitude });
    setLocationConfirmed(true);
    setLocationError('');
  }

  async function saveCurrentLocation() {
    const address = locationAddress.trim();
    if (!address || !locationPoint || !locationConfirmed) {
      Alert.alert('Choose a location first', 'Select a point, enter its address, and confirm the location before saving it.');
      return;
    }
    const label = savedLocationLabel.trim();
    if (!label) {
      Alert.alert('Add a location label', 'Enter a label such as Home, Warehouse, Shop, or Product location.');
      return;
    }
    const next: SavedLocation[] = [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, label, address, latitude: locationPoint.latitude, longitude: locationPoint.longitude },
      ...savedLocations.filter((item) => item.label.toLowerCase() !== label.toLowerCase()),
    ];
    await persistSavedLocations(next);
    setSavedLocationLabel('');
    Alert.alert('Location saved', 'You can reuse this saved location for future listings on this device.');
  }

  async function deleteSavedLocation(id: string) {
    await persistSavedLocations(savedLocations.filter((item) => item.id !== id));
  }

  async function pickPhotos() {
    const remaining = MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      Alert.alert('Photo limit reached', 'You can add up to 10 photos.');
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Photo access needed',
          'Allow photo library access to add listing pictures.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.8,
      });

      if (result.canceled) return;

      const selected: ListingPhoto[] = result.assets.map((asset, index) => ({
        uri: asset.uri,
        fileName:
          asset.fileName ?? `listing-photo-${Date.now()}-${index}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      }));

      setPhotos((current) => {
        const existingUris = new Set(current.map((photo) => photo.uri));
        const uniqueSelected = selected.filter(
          (photo) => !existingUris.has(photo.uri),
        );

        return [...current, ...uniqueSelected].slice(0, MAX_PHOTOS);
      });

      setFailedPhotoUris((current) =>
        current.filter((uri) => !selected.some((photo) => photo.uri === uri)),
      );
      setLoadedPhotoUris((current) =>
        current.filter((uri) => !selected.some((photo) => photo.uri === uri)),
      );
    } catch (error) {
      console.error('Photo picker failed:', error);
      Alert.alert(
        'Unable to open photos',
        'Please try selecting your photos again.',
      );
    }
  }

  function removePhoto(uri: string) {
    if (previewPhotoUri === uri) setPreviewPhotoUri(null);
    setPhotos((current) => current.filter((photo) => photo.uri !== uri));
    setFailedPhotoUris((current) => current.filter((item) => item !== uri));
    setLoadedPhotoUris((current) => current.filter((item) => item !== uri));
  }

  function retryPhoto(uri: string) {
    setFailedPhotoUris((current) => current.filter((item) => item !== uri));
    setLoadedPhotoUris((current) => current.filter((item) => item !== uri));
    setRetryTokens((current) => ({ ...current, [uri]: (current[uri] ?? 0) + 1 }));
  }

  function validateForm() {
    const trimmedTitle = title.trim();
    const trimmedPrice = price.trim();
    const pricePattern = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/;
    const numericPrice = Number(trimmedPrice);

    if (trimmedTitle.length < 2) {
      Alert.alert(
        'Add a title',
        'Enter at least 2 characters for your listing. Spaces alone do not count.',
      );
      return;
    }

    if (trimmedTitle.length > 200) {
      Alert.alert(
        'Shorten your title',
        'Your listing title must be 200 characters or fewer.',
      );
      return;
    }

    const trimmedDescription = description.trim();
    const descriptionLetters = (trimmedDescription.match(/\p{L}/gu) ?? []).length;
    if (trimmedDescription.length < 2 || descriptionLetters < 28) {
      Alert.alert(
        'Add more description',
        'Your description must contain at least 2 non-whitespace characters and at least 28 letters.',
      );
      return;
    }

    if (
      !locationAddress.trim() ||
      !locationPoint ||
      !Number.isFinite(locationPoint.latitude) ||
      !Number.isFinite(locationPoint.longitude)
    ) {
      Alert.alert(
        'Choose a location',
        'Please enter an address and select a valid point on the map.',
      );
      return;
    }

    if (!locationConfirmed) {
      Alert.alert(
        'Confirm your location',
        'Please review your selected address and map pin, then tap "Use this location".',
      );
      return;
    }

    if (
      trimmedPrice === '' ||
      !pricePattern.test(trimmedPrice) ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      Alert.alert(
        'Check the price',
        'Enter a valid non-negative price with no more than 2 decimal places (for example, 1200 or 1200.50).',
      );
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Add listing photos', 'Please select at least one photo.');
      return;
    }

    const hasFailedPhoto = photos.some((photo) =>
      failedPhotoUris.includes(photo.uri),
    );

    if (hasFailedPhoto) {
      Alert.alert(
        'Check your photos',
        'At least one photo preview failed to load. Remove that photo or try again before continuing.',
      );
      return;
    }

    const hasLoadingPhoto = photos.some(
      (photo) => !loadedPhotoUris.includes(photo.uri),
    );

    if (hasLoadingPhoto) {
      Alert.alert(
        'Photos still loading',
        'Please wait until every selected photo has finished loading before continuing.',
      );
      return;
    }

    void publishListing();
  }

  async function publishListing() {
    if (isPublishing) return;
    setIsPublishing(true);

    let listingId: string | null = null;
    const uploadedPaths: string[] = [];

    try {
      const { data: userResult, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = userResult.user;
      if (!user) {
        Alert.alert('Sign in required', 'Please sign in to publish a listing. Your listing details are still on this screen.');
        return;
      }

      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const numericPrice = Number(price.trim());
      const trimmedCity = city.trim();
      const { data: createdListing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          listing_type: category,
          title: trimmedTitle,
          description: trimmedDescription,
          price: numericPrice,
          currency: 'PHP',
          category: null,
          condition,
          city: trimmedCity || null,
          status: 'draft',
          attributes: {},
          location_address: locationAddress.trim(),
          latitude: locationPoint!.latitude,
          longitude: locationPoint!.longitude,
          location_source: locationSource,
        } as never)
        .select('id')
        .single();

      if (listingError) throw listingError;
      if (!createdListing?.id) throw new Error('Supabase created the draft but did not return its listing ID.');
      listingId = createdListing.id;

      const mediaRows: {
        listing_id: string;
        storage_path: string;
        media_type: string;
        sort_order: number;
        alt_text: string;
      }[] = [];

      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        const mimeType = photo.mimeType.toLowerCase();
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
          throw new Error(`Photo ${index + 1} uses an unsupported format. Please use JPEG, PNG, or WebP.`);
        }

        const response = await fetch(photo.uri);
        if (!response.ok) throw new Error(`Could not read photo ${index + 1} from your device.`);
        const blob = await response.blob();
        if (blob.size > 10 * 1024 * 1024) {
          throw new Error(`Photo ${index + 1} exceeds the 10 MB upload limit.`);
        }

        const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
        const safeBaseName = photo.fileName
          .replace(/\.[^.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .slice(0, 60) || `photo-${index + 1}`;
        const storagePath = `${user.id}/${listingId}/${String(index + 1).padStart(2, '0')}-${safeBaseName}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(storagePath, blob, {
            contentType: mimeType,
            upsert: false,
          });
        if (uploadError) throw new Error(`Photo ${index + 1} upload failed: ${uploadError.message}`);

        uploadedPaths.push(storagePath);
        mediaRows.push({
          listing_id: listingId,
          storage_path: storagePath,
          media_type: 'image',
          sort_order: index,
          alt_text: `${trimmedTitle} photo ${index + 1}`,
        });
      }

      const { error: mediaError } = await supabase.from('listing_media').insert(mediaRows);
      if (mediaError) throw new Error(`Photos uploaded, but their listing records could not be saved: ${mediaError.message}`);

      const { error: activateError } = await supabase
        .from('listings')
        .update({ status: 'active' } as never)
        .eq('id', listingId)
        .eq('seller_id', user.id);
      if (activateError) throw new Error(`Your listing and photos are saved as a draft, but activation failed: ${activateError.message}`);

      Alert.alert('Listing published', 'Your listing is now live on SELLSPACE.', [
        { text: 'Continue', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('SELLSPACE listing publish failed:', error);
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from('listing-images')
          .remove(uploadedPaths);
        if (cleanupError) console.warn('Could not clean up partially uploaded listing images:', cleanupError);
      }
      if (listingId) {
        const { error: mediaCleanupError } = await supabase
          .from('listing_media')
          .delete()
          .eq('listing_id', listingId);
        if (mediaCleanupError) console.warn('Could not clean up partial listing media records:', mediaCleanupError);
      }
      Alert.alert(
        'Could not publish listing',
        `${error instanceof Error ? error.message : 'An unexpected error occurred.'}${listingId ? '\n\nYour listing draft has been retained. You can retry publishing after resolving the issue.' : ''}`,
      );
    } finally {
      setIsPublishing(false);
    }
  }

  function renderPhoto(item: ListingPhoto, index: number) {
    const hasFailed = failedPhotoUris.includes(item.uri);
    const hasLoaded = loadedPhotoUris.includes(item.uri);

    return (
      <View key={item.uri} style={styles.photoCell}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Preview photo ${index + 1}`}
          onPress={() => setPreviewPhotoUri(item.uri)}
          style={styles.photoTile}
        >
          {!hasFailed ? (
            <>
              <Image
                key={`${item.uri}-${retryTokens[item.uri] ?? 0}`}
                source={{ uri: item.uri }}
                style={[styles.photo, !hasLoaded && styles.photoLoading]}
                resizeMode="cover"
                onLoad={() => {
                  setLoadedPhotoUris((current) =>
                    current.includes(item.uri) ? current : [...current, item.uri],
                  );
                  setFailedPhotoUris((current) =>
                    current.filter((uri) => uri !== item.uri),
                  );
                }}
                onError={(event) => {
                  console.warn(
                    'Listing photo preview failed:',
                    item.uri,
                    event.nativeEvent.error,
                  );
                  setFailedPhotoUris((current) =>
                    current.includes(item.uri) ? current : [...current, item.uri],
                  );
                  setLoadedPhotoUris((current) =>
                    current.filter((uri) => uri !== item.uri),
                  );
                }}
              />
              {!hasLoaded && (
                <View style={styles.photoLoadingOverlay} pointerEvents="none">
                  <ActivityIndicator size="small" color={GREEN} />
                  <Text style={styles.photoLoadingText}>Loading…</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.photoError}>
              <Text style={styles.photoErrorIcon}>!</Text>
              <Text style={styles.photoErrorText}>Preview unavailable</Text>
              <Pressable
                onPress={() => retryPhoto(item.uri)}
                style={styles.retryPhotoButton}
              >
                <Text style={styles.retryPhotoText}>Try again</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.photoNumberBadge}>
            <Text style={styles.photoNumberText}>{index + 1}</Text>
          </View>

          {index === 0 && (
            <View style={styles.coverBadge}>
              <Text style={styles.coverText}>COVER</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove photo ${index + 1}`}
            onPress={() => removePhoto(item.uri)}
            style={styles.removeButton}
          >
            <Text style={styles.removeText}>×</Text>
          </Pressable>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <Modal
        visible={previewPhoto !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPreviewPhotoUri(null)}
      >
        <GestureHandlerRootView style={styles.modalGestureRoot}>
          <View style={styles.previewBackdrop}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewCounter}>
              {previewPhoto ? `${previewPhotoIndex + 1} of ${photos.length}` : ''}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close photo preview"
              onPress={() => setPreviewPhotoUri(null)}
              style={styles.previewCloseButton}
            >
              <Text style={styles.previewCloseText}>×</Text>
            </Pressable>
          </View>
          {previewPhoto && (
            <PhotoViewer
              key={previewPhoto.uri}
              uri={previewPhoto.uri}
              resetKey={previewPhoto.uri}
              onSwipe={(direction) => {
                const nextIndex = Math.max(0, Math.min(photos.length - 1, previewPhotoIndex + direction));
                if (nextIndex !== previewPhotoIndex) setPreviewPhotoUri(photos[nextIndex].uri);
              }}
            />
          )}
          <Text style={styles.previewHint}>Swipe to browse · Pinch or double-tap to zoom</Text>
          </View>
        </GestureHandlerRootView>
      </Modal>

      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>SELLSPACE SELLER STUDIO</Text>
          <Text style={styles.headerTitle}>Create listing</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            Bring your product to life.
          </Text>
          <Text style={styles.introDescription}>
            Add clear photos and the details buyers need to know.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Listing photos</Text>
            <Text style={styles.counter}>{photos.length}/10</Text>
          </View>

          <Text style={styles.helper}>
            Select up to 10 photos. Your first photo becomes the cover.
          </Text>

          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => renderPhoto(photo, index))}
            </View>
          ) : (
            <View style={styles.emptyPhotos}>
              <Text style={styles.emptyPhotosIcon}>▧</Text>
              <Text style={styles.emptyPhotosTitle}>
                Your photos will appear here
              </Text>
              <Text style={styles.emptyPhotosDescription}>
                Add clear photos to help buyers discover your listing.
              </Text>
            </View>
          )}

          {photos.length < MAX_PHOTOS && (
            <Pressable
              accessibilityRole="button"
              onPress={pickPhotos}
              style={({ pressed }) => [
                styles.addPhotoButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.addPhotoIcon}>＋</Text>
              <View style={styles.addPhotoCopy}>
                <Text style={styles.addPhotoText}>Add photos</Text>
                <Text style={styles.addPhotoSubtext}>
                  {photos.length === 0
                    ? 'Choose from your photo library'
                    : `${MAX_PHOTOS - photos.length} more ${
                        MAX_PHOTOS - photos.length === 1 ? 'photo' : 'photos'
                      } available`}
                </Text>
              </View>
            </Pressable>
          )}

        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic information</Text>

          <Text style={styles.label}>Listing title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Minimalist everyday backpack"
            placeholderTextColor="#9CA39D"
            maxLength={200}
            style={styles.input}
          />

          <Text style={styles.label}>Description * (minimum 28 letters)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your item, features, and details..."
            placeholderTextColor="#9CA39D"
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.textArea]}
          />

          <Text style={styles.label}>Price (PHP) *</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            placeholderTextColor="#9CA39D"
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <Text style={styles.label}>Listing type</Text>
          <View style={styles.chipRow}>
            {LISTING_TYPES.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[
                  styles.chip,
                  category === item.value && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === item.value && styles.chipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Condition</Text>
          <View style={styles.chipRow}>
            {CONDITIONS.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setCondition(item.value)}
                style={[
                  styles.chip,
                  condition === item.value && styles.chipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    condition === item.value && styles.chipTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>City / location (optional detail)</Text>
          <TextInput
            value={city}
            onChangeText={setCity}
            placeholder="e.g. Quezon City"
            placeholderTextColor="#9CA39D"
            style={styles.input}
          />

          <Text style={styles.label}>Product / unit location *</Text>
          <Text style={styles.locationHelp}>Search an address, use GPS, or tap the map to pinpoint the product or unit. Confirmed coordinates are required.</Text>
          <TextInput
            value={locationSearch}
            onChangeText={setLocationSearch}
            placeholder="Search street, barangay, city, or landmark"
            placeholderTextColor="#9CA39D"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={searchLocation}
          />
          <View style={styles.locationActions}>
            <Pressable onPress={searchLocation} disabled={locationBusy} style={[styles.locationActionButton, locationBusy && styles.buttonDisabled]}>
              <Text style={styles.locationActionText}>Search address</Text>
            </Pressable>
            <Pressable onPress={useCurrentLocation} disabled={locationBusy} style={[styles.locationActionButton, styles.locationActionPrimary, locationBusy && styles.buttonDisabled]}>
              <Text style={[styles.locationActionText, styles.locationActionPrimaryText]}>◎ Use GPS</Text>
            </Pressable>
          </View>
          {locationBusy && <View style={styles.locationBusyRow}><ActivityIndicator size="small" color={GREEN} /><Text style={styles.locationHelp}>Finding location…</Text></View>}
          {!!locationError && <Text style={styles.locationError}>{locationError}</Text>}
          <View style={styles.mapFrame}>
            <LocationMap point={locationPoint} onPick={handleMapPick} />
          </View>
          <Text style={styles.locationHelp}>Map data © OpenStreetMap contributors. Tap the map to select a point. On Android, allow location permission when prompted.</Text>
          <Text style={styles.label}>Confirmed address *</Text>
          <TextInput
            value={locationAddress}
            onChangeText={(value) => {
              setLocationSource('manual');
              setLocationAddress(value);
              setLocationSearch(value);
              setLocationConfirmed(false);
            }}
            placeholder="Selected address (or enter it manually)"
            placeholderTextColor="#9CA39D"
            style={styles.input}
            multiline
          />
          {locationPoint && (
            <View style={styles.locationConfirmation}>
              <Text style={styles.coordinatesText}>
                Selected pin: {locationPoint.latitude.toFixed(6)},{' '}
                {locationPoint.longitude.toFixed(6)}
              </Text>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  if (!locationAddress.trim()) {
                    setLocationError(
                      'Please enter the address associated with this pin before confirming.',
                    );
                    return;
                  }

                  setLocationConfirmed(true);
                  setLocationError('');
                }}
                style={[
                  styles.locationConfirmButton,
                  locationConfirmed && styles.locationConfirmedButton,
                ]}
              >
                <Text style={styles.locationConfirmButtonText}>
                  {locationConfirmed
                    ? '✓ Location confirmed'
                    : 'Use this location'}
                </Text>
              </Pressable>

              <Text style={styles.locationHelp}>
                {locationConfirmed
                  ? 'This location is confirmed for your listing.'
                  : 'Check the address and map pin, then confirm this location.'}
              </Text>
            </View>
          )}

          <Text style={styles.label}>Save this location for next time</Text>
          <TextInput
            value={savedLocationLabel}
            onChangeText={setSavedLocationLabel}
            placeholder="Label e.g. Home, Warehouse, Shop"
            placeholderTextColor="#9CA39D"
            style={styles.input}
          />
          <Pressable onPress={saveCurrentLocation} style={styles.saveLocationButton}>
            <Text style={styles.saveLocationButtonText}>＋ Save selected location</Text>
          </Pressable>
          <Text style={styles.label}>Saved locations {locationsLoaded ? `(${savedLocations.length})` : ''}</Text>
          {savedLocations.length === 0 ? (
            <Text style={styles.locationHelp}>Your saved locations will appear here for reuse on future listings on this device.</Text>
          ) : savedLocations.map((item) => (
            <View key={item.id} style={styles.savedLocationCard}>
              <Pressable style={styles.savedLocationMain} onPress={() => selectSavedLocation(item)}>
                <Text style={styles.savedLocationLabel}>{item.label}</Text>
                <Text style={styles.savedLocationAddress} numberOfLines={2}>{item.address}</Text>
                <Text style={styles.savedLocationUse}>Use this location</Text>
              </Pressable>
              <Pressable onPress={() => deleteSavedLocation(item.id)} accessibilityRole="button" accessibilityLabel={`Delete saved location ${item.label}`} style={styles.deleteSavedLocationButton}>
                <Text style={styles.deleteSavedLocationText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable
          onPress={validateForm}
          disabled={isPublishing}
          style={({ pressed }) => [
            styles.publishButton,
            (pressed || isPublishing) && styles.buttonPressed,
          ]}
        >
          {isPublishing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.publishText}>Publish listing →</Text>}
        </Pressable>

        <Text style={styles.footerNote}>
          Your listing won't be published until you confirm it in the next step.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAE6',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  backText: {
    fontSize: 30,
    color: '#171717',
    lineHeight: 34,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: GREEN,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#171717',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  intro: {
    marginBottom: 2,
  },
  introTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: '#171717',
    letterSpacing: -0.7,
  },
  introDescription: {
    marginTop: 7,
    color: '#737873',
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: '#E8EBE7',
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
  },
  counter: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
  },
  helper: {
    marginTop: 7,
    marginBottom: 15,
    fontSize: 12,
    lineHeight: 18,
    color: '#737873',
  },
  photoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },

  photoCell: {
    width: '33.3333%',
    padding: 5,
  },

  photoTile: {
  width: '100%',
  aspectRatio: 1,
  borderRadius: 13,
  overflow: 'hidden',
  backgroundColor: '#F1F4F1',
  position: 'relative',
},

 photo: {
  ...StyleSheet.absoluteFill,
},
  photoLoading: {
    opacity: 0.18,
  },
  photoLoadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F4F1CC',
    gap: 7,
  },
  photoLoadingText: {
    color: '#47534A',
    fontSize: 9,
    fontWeight: '700',
  },
  photoNumberBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#171717D9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFFB8',
  },
  photoNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  modalGestureRoot: {
    flex: 1,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: '#080A09',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  previewHeader: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCounter: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: '#171717CC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewCloseButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF26',
  },
  previewCloseText: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
  },
  previewImageStage: {
    width: '100%',
    height: '78%',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewHint: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    color: '#D1D5D2',
    fontSize: 12,
  },

  coverBadge: {
    position: 'absolute',
    left: 5,
    bottom: 5,
    backgroundColor: GREEN,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  coverText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#171717CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 19,
    lineHeight: 22,
  },
  photoError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: '#FCEFEA',
  },
  photoErrorIcon: {
    fontSize: 22,
    fontWeight: '800',
    color: '#B45309',
  },
  photoErrorText: {
    fontSize: 9,
    textAlign: 'center',
    color: '#92400E',
  },
  retryPhotoButton: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#F5D8C9',
  },
  retryPhotoText: {
    fontSize: 9,
    color: '#92400E',
    fontWeight: '800',
  },
  emptyPhotos: {
    minHeight: 150,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8D4CA',
    backgroundColor: '#F8FAF8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyPhotosIcon: {
    fontSize: 32,
    color: GREEN,
    marginBottom: 8,
  },
  emptyPhotosTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#303830',
    textAlign: 'center',
  },
  emptyPhotosDescription: {
    fontSize: 11,
    color: '#737873',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 5,
  },
  addPhotoButton: {
    marginTop: 12,
    minHeight: 66,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C9DCCF',
    backgroundColor: '#F5FAF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  addPhotoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E1F1E6',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 25,
    color: GREEN,
    marginRight: 12,
    overflow: 'hidden',
  },
  addPhotoCopy: {
    flex: 1,
  },
  addPhotoText: {
    fontSize: 13,
    color: GREEN,
    fontWeight: '800',
  },
  addPhotoSubtext: {
    fontSize: 11,
    color: '#737873',
    marginTop: 3,
  },
  locationHelp: {
    marginTop: 7,
    color: '#737873',
    fontSize: 12,
    lineHeight: 18,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  locationActionButton: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C9DCCF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5FAF6',
  },
  locationActionPrimary: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  locationActionText: {
    color: GREEN,
    fontSize: 12,
    fontWeight: '800',
  },
  locationActionPrimaryText: { color: '#FFFFFF' },
  buttonDisabled: { opacity: 0.55 },
  locationBusyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  locationError: { marginTop: 9, color: '#B91C1C', fontSize: 12, lineHeight: 18 },
  mapFrame: {
    height: 260,
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE4DC',
    backgroundColor: '#EAF0EA',
  },
  locationConfirmation: {
    marginTop: 12,
    gap: 10,
  },
  locationConfirmButton: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  locationConfirmedButton: {
    backgroundColor: '#065F46',
  },
  locationConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  coordinatesText: { marginTop: 8, color: '#47534A', fontSize: 11, fontWeight: '700' },
  saveLocationButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#E4F3EA',
    borderWidth: 1,
    borderColor: '#B7D9C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLocationButtonText: { color: GREEN, fontSize: 12, fontWeight: '800' },
  savedLocationCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E7E1',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedLocationMain: { flex: 1 },
  savedLocationLabel: { color: '#171717', fontSize: 13, fontWeight: '800' },
  savedLocationAddress: { marginTop: 4, color: '#737873', fontSize: 11, lineHeight: 16 },
  savedLocationUse: { marginTop: 7, color: GREEN, fontSize: 11, fontWeight: '800' },
  deleteSavedLocationButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FCEFEA', alignItems: 'center', justifyContent: 'center' },
  deleteSavedLocationText: { color: '#B91C1C', fontSize: 22, lineHeight: 25 },
  label: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#414841',
  },
  input: {
    minHeight: 49,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E7E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: '#171717',
    fontSize: 14,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E1E6E0',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#E4F3EA',
    borderColor: GREEN,
  },
  chipText: {
    color: '#555D56',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: GREEN,
    fontWeight: '800',
  },
  publishButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    color: '#777F78',
    paddingHorizontal: 12,
  },
});
