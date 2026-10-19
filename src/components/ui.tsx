import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, useColors } from '@/constants/theme';

export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={[{ flex: 1, backgroundColor: c.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

export function Title({ children, style }: TextProps) {
  const c = useColors();
  return <Text style={[styles.title, { color: c.text }, style]}>{children}</Text>;
}

export function Body({ children, muted, style, ...rest }: TextProps & { muted?: boolean }) {
  const c = useColors();
  return (
    <Text {...rest} style={[styles.body, { color: muted ? c.muted : c.text }, style]}>
      {children}
    </Text>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
}) {
  const c = useColors();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? c.pitch : c.surface,
          borderColor: primary ? c.pitch : c.line,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {loading ? (
        <ActivityIndicator color={primary ? '#fff' : c.text} />
      ) : (
        <Text style={[styles.buttonText, { color: primary ? '#fff' : c.text }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: Spacing.xs }}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={c.muted}
        {...props}
        style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.line }, props.style]}
      />
    </View>
  );
}

export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: Spacing.xs }}>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
      <View style={styles.row}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(o.value)}
              style={[
                styles.chip,
                { borderColor: selected ? c.pitch : c.line, backgroundColor: selected ? c.pitchSoft : c.surface },
              ]}>
              <Text style={{ color: selected ? c.pitch : c.text, fontWeight: '600' }}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Banner({ children, tone = 'good' }: { children: ReactNode; tone?: 'good' | 'warn' }) {
  const c = useColors();
  return (
    <View style={[styles.banner, { backgroundColor: tone === 'good' ? c.pitchSoft : c.claySoft }]}>
      <Text style={{ color: tone === 'good' ? c.pitch : c.clay, fontSize: 13 }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  body: { fontSize: 15, lineHeight: 21 },
  button: { borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  banner: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
});
