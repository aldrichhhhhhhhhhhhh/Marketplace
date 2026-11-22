import {
  TabList,
  TabListProps,
  Tabs,
  TabSlot,
  TabTrigger,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

const COLORS = {
  accent: '#087F68',
  accentSoft: '#E8F3EF',
  text: '#202522',
  muted: '#737B76',
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
          <TabTrigger name="shorts" href="/shorts" asChild>
            <TabButton>Shorts</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>

      <TabSlot style={styles.tabSlot} />
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  ...props
}: TabTriggerSlotProps) {
  const { ref: _ref, ...pressableProps } = props;

  return (
    <Pressable
      {...pressableProps}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && styles.tabButtonSelected,
        pressed && styles.tabButtonPressed,
      ]}
    >
      <View>
        {typeof children === 'string' ? (
          <>{children}</>
        ) : (
          children
        )}
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View
      {...props}
      style={[props.style, styles.tabListContainer]}
    />
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    width: '100%',
    minHeight: 64,
    paddingHorizontal: 24,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF0ED',
    zIndex: 1,
  },
  tabSlot: {
    flex: 1,
    minHeight: 0,
  },
  tabButton: {
    minWidth: 88,
    minHeight: 40,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  } as any,
  tabButtonSelected: {
    backgroundColor: COLORS.accentSoft,
  },
  tabButtonPressed: {
    opacity: 0.72,
  },
});
