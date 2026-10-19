import { useMemo, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Spacing, useColors } from '@/constants/theme';

const THRESHOLD = 110;

// A stack of cards: drag the top one right for yes, left for pass, or use the buttons.
export function SwipeDeck<T>({
  items,
  keyOf,
  renderCard,
  onSwipe,
  empty,
}: {
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onSwipe: (item: T, liked: boolean) => void;
  empty: ReactNode;
}) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;
  const top = items[0];

  const fling = (liked: boolean) => {
    if (!top) return;
    Animated.timing(x, { toValue: (liked ? 1 : -1) * width * 1.4, duration: 220, useNativeDriver: true }).start(() => {
      x.setValue(0);
      onSwipe(top, liked);
    });
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_e, g) => x.setValue(g.dx),
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) > THRESHOLD) fling(g.dx > 0);
          else Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
      }),
    // fling reads the current top card, so rebuild when it changes.
    [top, width],
  );

  const rotate = x.interpolate({ inputRange: [-width, 0, width], outputRange: ['-18deg', '0deg', '18deg'] });
  const yesOpacity = x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const noOpacity = x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.deck}>
        {!top && <View style={styles.empty}>{empty}</View>}
        {items[1] && (
          <View key={keyOf(items[1])} style={[styles.card, styles.behind]}>
            {renderCard(items[1])}
          </View>
        )}
        {top && (
          <Animated.View
            key={keyOf(top)}
            {...responder.panHandlers}
            style={[styles.card, { transform: [{ translateX: x }, { rotate }] }]}>
            {renderCard(top)}
            <Animated.Text style={[styles.stamp, styles.yes, { color: c.pitch, borderColor: c.pitch, opacity: yesOpacity }]}>
              YES
            </Animated.Text>
            <Animated.Text style={[styles.stamp, styles.no, { color: c.clay, borderColor: c.clay, opacity: noOpacity }]}>
              PASS
            </Animated.Text>
          </Animated.View>
        )}
      </View>
      <View style={styles.actions}>
        <RoundButton label="Pass" symbol="✕" color={c.clay} onPress={() => fling(false)} disabled={!top} />
        <RoundButton label="Swipe yes" symbol="✓" color={c.pitch} onPress={() => fling(true)} disabled={!top} />
      </View>
    </View>
  );
}

function RoundButton({
  label,
  symbol,
  color,
  onPress,
  disabled,
}: {
  label: string;
  symbol: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: c.surface, borderColor: c.line, opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] },
      ]}>
      <Text style={{ color, fontSize: 26, fontWeight: '700' }}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deck: { flex: 1, marginHorizontal: Spacing.lg },
  card: { ...StyleSheet.absoluteFill, borderRadius: 22, overflow: 'hidden' },
  behind: { transform: [{ scale: 0.95 }, { translateY: 10 }] },
  empty: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  stamp: { position: 'absolute', top: 28, fontSize: 30, fontWeight: '800', borderWidth: 4, borderRadius: 10, paddingHorizontal: 12 },
  yes: { left: 22, transform: [{ rotate: '-14deg' }] },
  no: { right: 22, transform: [{ rotate: '14deg' }] },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 22, paddingVertical: Spacing.lg },
  round: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
