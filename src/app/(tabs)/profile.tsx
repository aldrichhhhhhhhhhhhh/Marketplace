
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const GREEN = '#087F68';
const DARK_GREEN = '#05634F';
const INK = '#171A18';
const MUTED = '#737B76';
const LINE = '#E7ECE9';
const PALE_GREEN = '#E8F7F0';

const db = supabase as any;

type SetupStatus = {
  currentStep: string | null;
  completed: boolean;
  skipped: boolean;
};

type JourneyStep = {
  number: number;
  title: string;
  detail: string;
  status: 'completed' | 'current' | 'upcoming';
  action: () => void;
  optional?: boolean;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [busy, setBusy] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [setup, setSetup] = useState<SetupStatus>({
    currentStep: null,
    completed: false,
    skipped: false,
  });

  const name =
    (typeof user?.user_metadata?.display_name === 'string' &&
      user.user_metadata.display_name.trim()) ||
    user?.email?.split('@')[0] ||
    'SELLSPACE member';

  const initials = name.charAt(0).toUpperCase();

  const loadSetupStatus = useCallback(async () => {
    if (!user?.id) {
      setSetup({
        currentStep: null,
        completed: false,
        skipped: false,
      });
      return;
    }

    setStatusLoading(true);

    try {
      const { data, error } = await db
        .from('account_setup')
        .select('current_step, completed_at, skipped_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setSetup({
        currentStep: data?.current_step ?? null,
        completed: Boolean(data?.completed_at),
        skipped: Boolean(data?.skipped_at),
      });
    } catch (error) {
      console.error('Could not load account setup progress:', error);
    } finally {
      setStatusLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadSetupStatus();
    }, [loadSetupStatus])
  );

  const openSetup = () => {
    router.push('/account-setup');
  };

  const openPersonalInformation = () => {
    router.push('/account/personal-information' as any);
  };

  const openDeliveryAddress = () => {
    router.push('/account/delivery-address' as any);
  };

  const openFavorites = () => {
    router.push('/favorites');
  };

  const logout = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);
              await signOut();
            } catch (error) {
              Alert.alert(
                'Sign out failed',
                error instanceof Error
                  ? error.message
                  : 'Please try again.'
              );
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator color={GREEN} size="large" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.guestPage}
          showsVerticalScrollIndicator={false}
        >
          <BrandHeader />

          <View style={s.guestHero}>
            <View style={s.guestIllustration}>
              <Text style={s.guestIllustrationIcon}>S</Text>
            </View>

            <Text style={s.guestTitle}>
              Welcome to SELLSPACE.
            </Text>

            <Text style={s.guestDescription}>
              One account. Buy and sell. Sign in or create an account
              to manage your marketplace experience.
            </Text>

            <Pressable
              style={s.primaryButton}
              onPress={() => router.push('/auth/sign-in')}
            >
              <Text style={s.primaryButtonText}>Sign In</Text>
            </Pressable>

            <Pressable
              style={s.secondaryButton}
              onPress={() => router.push('/auth/sign-up')}
            >
              <Text style={s.secondaryButtonText}>
                Create Account
              </Text>
            </Pressable>
          </View>

          <Text style={s.guestNote}>
            You can continue browsing SELLSPACE as a guest.
            Some actions will require you to sign in.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // The current account_setup record only confirms these existing
  // milestones. Experience selection and store setup are not yet
  // persisted by the current onboarding implementation.
  const personalComplete =
    setup.completed ||
    setup.currentStep === 'address' ||
    setup.currentStep === 'privacy';

  const addressComplete =
    setup.completed ||
    setup.currentStep === 'privacy';

  const privacyComplete = setup.completed;

  const journeySteps: JourneyStep[] = [
    {
      number: 1,
      title: 'Choose your experience',
      detail: 'Be a Buyer, Seller or Both',
      status: 'upcoming',
      action: openSetup,
    },
    {
      number: 2,
      title: 'Personal information',
      detail: 'Your name, birth date and contact number',
      status: personalComplete
        ? 'completed'
        : setup.currentStep === 'welcome' || !setup.currentStep
          ? 'current'
          : 'upcoming',
      action: openPersonalInformation,
    },
    {
      number: 3,
      title: 'Delivery address',
      detail: 'Add your delivery location',
      status: addressComplete
        ? 'completed'
        : personalComplete
          ? 'current'
          : 'upcoming',
      action: openDeliveryAddress,
    },
    {
      number: 4,
      title: 'Set up your store',
      detail: 'For Seller and Both accounts',
      status: 'upcoming',
      action: openSetup,
      optional: true,
    },
    {
      number: 5,
      title: 'Privacy and policies',
      detail: 'Review our terms, privacy and selling policies',
      status: privacyComplete
        ? 'completed'
        : addressComplete
          ? 'current'
          : 'upcoming',
      action: openSetup,
    },
    {
      number: 6,
      title: "You're all set!",
      detail: 'Complete your setup and enjoy the full experience',
      status: setup.completed ? 'completed' : 'upcoming',
      action: openSetup,
    },
  ];

  const completedCount = journeySteps.filter(
    step => step.status === 'completed'
  ).length;

  const progress = setup.completed
    ? 100
    : Math.round((completedCount / journeySteps.length) * 100);

  const currentStep = journeySteps.find(
    step => step.status === 'current'
  );

  const continueLabel = setup.completed
    ? 'Review Your Setup'
    : setup.skipped
      ? 'Resume Setup'
      : 'Continue Setup';

  const accountRow = (
    icon: string,
    title: string,
    detail: string,
    action: () => void
  ) => (
    <Pressable
      style={s.managementRow}
      onPress={action}
    >
      <View style={s.managementIcon}>
        <Text style={s.managementIconText}>{icon}</Text>
      </View>

      <View style={s.managementCopy}>
        <Text style={s.managementTitle}>{title}</Text>
        <Text style={s.managementDetail}>{detail}</Text>
      </View>

      <Text style={s.chevron}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.page}
        showsVerticalScrollIndicator={false}
      >
        <BrandHeader />

        {/* PROFILE IDENTITY */}
        <View style={s.identity}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>

          <View style={s.identityCopy}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email}>{user.email ?? ''}</Text>

            <View style={s.activeBadge}>
              <View style={s.activeDot} />
              <Text style={s.activeText}>Account Active</Text>
            </View>
          </View>
        </View>

        {/* SETUP PROGRESS CARD */}
        <View style={s.journeyCard}>
          <View style={s.journeyCardTop}>
            <View style={s.journeyCardCopy}>
              <Text style={s.journeyEyebrow}>
                {setup.completed
                  ? 'YOUR SELLSPACE ACCOUNT'
                  : 'YOUR SELLSPACE JOURNEY'}
              </Text>

              <Text style={s.progressHeading}>
                {setup.completed
                  ? 'All Set!'
                  : `${progress}% Complete`}
              </Text>

              <Text style={s.progressDescription}>
                {setup.completed
                  ? 'Your account setup is complete. You can still review and update your details.'
                  : 'Build your profile and set up your marketplace experience.'}
              </Text>
            </View>

            <View style={s.storeIllustration}>
              <Text style={s.storeIllustrationIcon}>▣</Text>
              <Text style={s.storeIllustrationBag}>▱</Text>
            </View>
          </View>

          <View style={s.progressTrack}>
            <View
              style={[
                s.progressFill,
                { width: `${progress}%` },
              ]}
            />
          </View>

          <Pressable
            style={s.continueButton}
            onPress={openSetup}
          >
            {statusLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.continueButtonText}>
                {continueLabel}  →
              </Text>
            )}
          </Pressable>
        </View>

        {/* SETUP JOURNEY */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Your Setup Journey</Text>

          <View style={s.stepCountBadge}>
            <Text style={s.stepCountText}>
              {completedCount} of 6 steps
            </Text>
          </View>
        </View>

        <View style={s.timeline}>
          {journeySteps.map((step, index) => {
            const isLast = index === journeySteps.length - 1;

            return (
              <Pressable
                key={step.number}
                onPress={step.action}
                style={[
                  s.timelineRow,
                  step.status === 'current' && s.timelineCurrent,
                ]}
              >
                <View style={s.timelineMarkerColumn}>
                  <View
                    style={[
                      s.timelineMarker,
                      step.status === 'completed' &&
                        s.timelineMarkerComplete,
                      step.status === 'current' &&
                        s.timelineMarkerCurrent,
                    ]}
                  >
                    <Text
                      style={[
                        s.timelineMarkerText,
                        step.status === 'completed' &&
                          s.timelineMarkerTextComplete,
                        step.status === 'current' &&
                          s.timelineMarkerTextCurrent,
                      ]}
                    >
                      {step.status === 'completed'
                        ? '✓'
                        : step.number}
                    </Text>
                  </View>

                  {!isLast && (
                    <View
                      style={[
                        s.timelineConnector,
                        step.status === 'completed' &&
                          s.timelineConnectorComplete,
                      ]}
                    />
                  )}
                </View>

                <View style={s.timelineCopy}>
                  <View style={s.timelineTitleRow}>
                    <Text style={s.timelineTitle}>
                      {step.title}
                    </Text>

                    {step.status === 'completed' && (
                      <Text style={s.completedLabel}>
                        Completed
                      </Text>
                    )}

                    {step.status === 'current' && (
                      <Text style={s.currentLabel}>
                        Continue
                      </Text>
                    )}
                  </View>

                  <Text style={s.timelineDetail}>
                    {step.detail}
                  </Text>
                </View>

                <Text style={s.timelineChevron}>›</Text>
              </Pressable>
            );
          })}
        </View>

        {/* ACCOUNT MANAGEMENT */}
        <View style={s.managementSection}>
          <Text style={s.managementHeading}>
            Account Management
          </Text>

          {accountRow(
            '♙',
            'Personal information',
            'Manage your name, birth date and contact number',
            openPersonalInformation
          )}

          {accountRow(
            '●',
            'Delivery addresses',
            'Manage your saved delivery locations',
            openDeliveryAddress
          )}

          {accountRow(
            '♡',
            'Favorites',
            'View the products you have saved',
            openFavorites
          )}
        </View>

        {/* ACCOUNT ACTIONS */}
        <View style={s.accountActions}>
          <Pressable
            style={s.logoutButton}
            onPress={logout}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#B42318" />
            ) : (
              <Text style={s.logoutText}>Sign Out</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BrandHeader() {
  return (
    <View style={s.brandHeader}>
      <View style={s.brandLeft}>
        <View style={s.brandMark}>
          <Text style={s.brandMarkText}>S</Text>
        </View>
        <Text style={s.brandName}>SELLSPACE</Text>
      </View>

      <View style={s.headerActions}>
        <View style={s.headerIcon}>
          <Text style={s.cloverIconText}>♧</Text>
          <View style={s.notificationDot} />
        </View>
        <View style={s.headerIcon}>
          <Text style={s.headerIconText}>⚙</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  page: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
  },
  guestPage: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // BRAND HEADER
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  brandMarkText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
  brandName: {
    color: DARK_GREEN,
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerIconText: {
    color: INK,
    fontSize: 25,
    fontWeight: '600',
  },
  // Match the Clover used in the Home header; keep the settings icon unchanged.
  cloverIconText: {
    color: '#047857',
    fontSize: 28,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },

  // IDENTITY
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    paddingHorizontal: 2,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#DDF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: DARK_GREEN,
    fontSize: 34,
    fontWeight: '900',
  },
  identityCopy: {
    flex: 1,
  },
  name: {
    color: '#101412',
    fontSize: 21,
    fontWeight: '900',
  },
  email: {
    color: '#626B66',
    fontSize: 13,
    marginTop: 3,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F8E8',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 9,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#079447',
    marginRight: 6,
  },
  activeText: {
    color: '#087B36',
    fontSize: 11,
    fontWeight: '800',
  },

  // PROGRESS CARD
  journeyCard: {
    backgroundColor: '#EAF8F1',
    borderRadius: 23,
    padding: 19,
    marginBottom: 25,
    overflow: 'hidden',
  },
  journeyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 120,
  },
  journeyCardCopy: {
    flex: 1,
    paddingRight: 5,
  },
  journeyEyebrow: {
    color: INK,
    fontSize: 15,
    fontWeight: '800',
  },
  progressHeading: {
    color: DARK_GREEN,
    fontSize: 32,
    lineHeight: 39,
    fontWeight: '900',
    marginTop: 6,
  },
  progressDescription: {
    color: '#48554E',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  storeIllustration: {
    width: 88,
    height: 105,
    borderRadius: 18,
    backgroundColor: '#D3F1E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  storeIllustrationIcon: {
    color: GREEN,
    fontSize: 48,
    fontWeight: '900',
  },
  storeIllustrationBag: {
    color: '#3EBA8D',
    fontSize: 27,
    marginTop: -17,
    marginLeft: 25,
  },
  progressTrack: {
    height: 11,
    borderRadius: 8,
    backgroundColor: '#BFEBD5',
    overflow: 'hidden',
    marginTop: 13,
    marginBottom: 17,
  },
  progressFill: {
    height: '100%',
    backgroundColor: DARK_GREEN,
    borderRadius: 8,
  },
  continueButton: {
    minHeight: 51,
    borderRadius: 28,
    backgroundColor: DARK_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  // JOURNEY TIMELINE
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  sectionTitle: {
    color: INK,
    fontSize: 19,
    fontWeight: '900',
  },
  stepCountBadge: {
    backgroundColor: '#E4F7EE',
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  stepCountText: {
    color: DARK_GREEN,
    fontSize: 11,
    fontWeight: '800',
  },
  timeline: {
    marginBottom: 23,
  },
  timelineRow: {
    minHeight: 69,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    borderRadius: 17,
  },
  timelineCurrent: {
    backgroundColor: '#E4F8EE',
  },
  timelineMarkerColumn: {
    width: 42,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  timelineMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#C8CECB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    zIndex: 1,
  },
  timelineMarkerComplete: {
    borderColor: GREEN,
    backgroundColor: GREEN,
  },
  timelineMarkerCurrent: {
    borderColor: GREEN,
    backgroundColor: GREEN,
  },
  timelineMarkerText: {
    color: '#4D5651',
    fontSize: 14,
    fontWeight: '800',
  },
  timelineMarkerTextComplete: {
    color: '#FFFFFF',
    fontSize: 17,
  },
  timelineMarkerTextCurrent: {
    color: '#FFFFFF',
  },
  timelineConnector: {
    position: 'absolute',
    top: 38,
    bottom: -8,
    width: 2,
    backgroundColor: '#D7DEDA',
  },
  timelineConnectorComplete: {
    backgroundColor: '#78C9A5',
  },
  timelineCopy: {
    flex: 1,
    paddingVertical: 11,
    paddingLeft: 8,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
  },
  timelineTitle: {
    color: INK,
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 1,
  },
  timelineDetail: {
    color: '#626B66',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  completedLabel: {
    color: '#07843D',
    fontSize: 10,
    fontWeight: '900',
  },
  currentLabel: {
    color: '#FFFFFF',
    backgroundColor: '#15966B',
    overflow: 'hidden',
    borderRadius: 15,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 10,
    fontWeight: '900',
  },
  timelineChevron: {
    color: '#56615A',
    fontSize: 25,
    paddingLeft: 7,
  },

  // ACCOUNT MANAGEMENT
  managementSection: {
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 19,
  },
  managementHeading: {
    color: INK,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 13,
  },
  managementRow: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 8,
  },
  managementIcon: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: '#E2F6EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  managementIconText: {
    color: GREEN,
    fontSize: 23,
    fontWeight: '800',
  },
  managementCopy: {
    flex: 1,
  },
  managementTitle: {
    color: INK,
    fontSize: 13,
    fontWeight: '900',
  },
  managementDetail: {
    color: '#68716C',
    fontSize: 11,
    marginTop: 3,
  },
  chevron: {
    color: '#47534C',
    fontSize: 25,
    paddingHorizontal: 5,
  },

  // ACCOUNT ACTIONS
  accountActions: {
    marginTop: 20,
  },
  logoutButton: {
    height: 49,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1D8D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#B42318',
    fontSize: 13,
    fontWeight: '800',
  },

  // GUEST PROFILE
  guestHero: {
    alignItems: 'center',
    backgroundColor: '#F1FAF5',
    borderRadius: 24,
    padding: 23,
    marginTop: 25,
  },
  guestIllustration: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DDF5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  guestIllustrationIcon: {
    color: GREEN,
    fontSize: 49,
    fontWeight: '900',
  },
  guestTitle: {
    color: INK,
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center',
  },
  guestDescription: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 23,
  },
  primaryButton: {
    width: '100%',
    height: 51,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    height: 51,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E4DA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: INK,
    fontSize: 14,
    fontWeight: '800',
  },
  guestNote: {
    color: '#89928C',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 17,
    paddingHorizontal: 10,
  },
});
