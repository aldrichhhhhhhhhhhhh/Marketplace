
import { useMarketplace } from '@/context/MarketplaceContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
};

const DEMO_DELIVERY_FEE = 80;

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, cartCount, cartSubtotal } = useMarketplace();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const formatPrice = (price: number) =>
    `₱${price.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const total = cartSubtotal + DEMO_DELIVERY_FEE;

  function handlePlaceDemoOrder() {
    if (cart.length === 0) {
      Alert.alert(
        'Your cart is empty',
        'Add a product before checking out.',
        [{ text: 'Explore products', onPress: () => router.replace('/(tabs)') }],
      );
      return;
    }

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !city.trim() ||
      !postalCode.trim()
    ) {
      Alert.alert(
        'Complete your details',
        'Please fill in every delivery field before continuing.',
      );
      return;
    }

    setOrderConfirmed(true);
  }

  if (orderConfirmed) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.confirmation}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>

          <Text style={styles.eyebrow}>MARKETPLACE CHECKOUT</Text>
          <Text style={styles.confirmationTitle}>Looking good.</Text>
          <Text style={styles.confirmationDescription}>
            Your demo checkout is complete. No payment was collected and no
            real order was placed.
          </Text>

          <View style={styles.confirmationCard}>
            <Text style={styles.cardTitle}>Delivery details</Text>
            <Text style={styles.detailValue}>{fullName}</Text>
            <Text style={styles.detailMuted}>{phone}</Text>
            <Text style={styles.detailMuted}>{address}</Text>
            <Text style={styles.detailMuted}>
              {city}, {postalCode}
            </Text>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Demo total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/(tabs)')}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Back to marketplace</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/cart')}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Return to cart</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back to cart"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>YOUR MARKETPLACE</Text>
            <Text style={styles.headerTitle}>Checkout.</Text>
          </View>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>01 / 01</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <Text style={styles.pageTitle}>Almost yours.</Text>
            <Text style={styles.pageDescription}>
              Add your delivery details and review your items before finishing
              this demo checkout.
            </Text>
          </View>

          <View style={styles.demoNotice}>
            <Text style={styles.noticeTitle}>Demo checkout</Text>
            <Text style={styles.noticeText}>
              This is a UI preview. No payment will be taken and no real order
              will be submitted.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery information</Text>
            <Text style={styles.sectionDescription}>
              Where should your order go?
            </Text>

            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Recipient's full name"
              placeholderTextColor="#9A9E99"
              autoCapitalize="words"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Mobile number</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 09XX XXX XXXX"
              placeholderTextColor="#9A9E99"
              keyboardType="phone-pad"
              returnKeyType="next"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>House number, street, and barangay</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your complete street address"
              placeholderTextColor="#9A9E99"
              autoCapitalize="words"
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.addressInput]}
            />

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <Text style={styles.inputLabel}>City / Municipality</Text>
                <TextInput
                  value={city}
                  onChangeText={setCity}
                  placeholder="Your city"
                  placeholderTextColor="#9A9E99"
                  autoCapitalize="words"
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              <View style={styles.column}>
                <Text style={styles.inputLabel}>Postal code</Text>
                <TextInput
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="Postal code"
                  placeholderTextColor="#9A9E99"
                  keyboardType="number-pad"
                  returnKeyType="done"
                  style={styles.input}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeadingRow}>
              <View>
                <Text style={styles.sectionTitle}>Your order</Text>
                <Text style={styles.sectionDescription}>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
              >
                <Text style={styles.editText}>Edit cart</Text>
              </Pressable>
            </View>

            {cart.length === 0 ? (
              <View style={styles.emptyOrder}>
                <Text style={styles.emptyOrderText}>
                  Your cart is empty. Return to the marketplace to add products.
                </Text>
              </View>
            ) : (
              cart.map((item) => (
                <View key={item.product.id} style={styles.orderItem}>
                  <View style={styles.orderItemCopy}>
                    <Text style={styles.orderItemName}>
                      {item.product.name}
                    </Text>
                    <Text style={styles.orderItemMeta}>
                      Qty {item.quantity} × {formatPrice(item.product.price)}
                    </Text>
                  </View>

                  <Text style={styles.orderItemPrice}>
                    {formatPrice(item.product.price * item.quantity)}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(cartSubtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.shippingCopy}>
                <Text style={styles.summaryLabel}>Delivery fee</Text>
                <Text style={styles.helperText}>Illustrative demo estimate</Text>
              </View>
              <Text style={styles.summaryValue}>
                {formatPrice(DEMO_DELIVERY_FEE)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Estimated total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handlePlaceDemoOrder}
            style={[
              styles.primaryButton,
              cart.length === 0 && styles.disabledButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>Complete demo checkout</Text>
          </Pressable>

          <Text style={styles.footerNote}>
            Demo only · No payment processing · No real order created
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  stepBadge: {
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.cream,
  },
  stepBadgeText: {
    color: COLORS.creamText,
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  intro: {
    marginBottom: 20,
  },
  pageTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
  pageDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  demoNotice: {
    backgroundColor: COLORS.cream,
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
  },
  noticeTitle: {
    color: COLORS.creamText,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  noticeText: {
    color: COLORS.creamMuted,
    fontSize: 11,
    lineHeight: 17,
  },
  section: {
    marginBottom: 26,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionDescription: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 15,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 12,
    backgroundColor: COLORS.background,
  },
  addressInput: {
    minHeight: 86,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  editText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  orderItemCopy: {
    flex: 1,
  },
  orderItemName: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  orderItemMeta: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 5,
  },
  orderItemPrice: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyOrder: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
  },
  emptyOrderText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
  shippingCopy: {
    flex: 1,
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 4,
  },
  totalLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  totalValue: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 13,
    paddingHorizontal: 18,
    marginTop: 4,
  },
  disabledButton: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: '800',
  },
  footerNote: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 13,
  },
  confirmation: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: COLORS.cream,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  successIconText: {
    color: COLORS.accent,
    fontSize: 35,
    fontWeight: '700',
  },
  confirmationTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: 5,
  },
  confirmationDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 23,
  },
  confirmationCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 18,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 13,
  },
  detailValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailMuted: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 18,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 11,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
