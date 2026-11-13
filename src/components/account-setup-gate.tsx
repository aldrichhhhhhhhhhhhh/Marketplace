
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export function AccountSetupGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const checkedUserId = useRef<string | null>(null);
  const db = supabase as any;

  useEffect(() => {
    if (loading) return;

    // Guests are not required to complete account setup.
    if (!user) {
      checkedUserId.current = null;
      return;
    }

    // Skip another check after a successful database response.
    if (checkedUserId.current === user.id) return;

    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const checkSetup = async () => {
      const { data, error } = await db
        .from('account_setup')
        .select('completed_at, skipped_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        console.error(
          'Account setup status check failed:',
          error.message
        );

        // Do not mark this user as checked.
        // Retry if the database request fails.
        retryTimer = setTimeout(() => {
          if (active) {
            void checkSetup();
          }
        }, 3000);

        return;
      }

      // Only mark the user checked after a successful response.
      checkedUserId.current = user.id;

      // Redirect incomplete accounts to onboarding.
     const setupFinishedOrSkipped =
      Boolean(data?.completed_at) || Boolean(data?.skipped_at);

      if (!setupFinishedOrSkipped && pathname !== '/account-setup') {
      router.replace('/account-setup'); 
      }
    };

    void checkSetup();

    return () => {
      active = false;

      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [loading, user?.id, pathname, router]);

  return null;
}
