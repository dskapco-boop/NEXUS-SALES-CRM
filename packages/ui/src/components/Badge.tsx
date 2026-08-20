import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { cn } from "../utils/cn";
import { TextPrimitive } from "../primitives/Text";

interface BadgeProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

const variantStyles: Record<string, { container: StyleProp<ViewStyle>; text: StyleProp<ViewStyle>; dot: StyleProp<ViewStyle> }> = {
  default: {
    container: { backgroundColor: '#e2e8f0' },
    text: { color: '#334155' },
    dot: { backgroundColor: '#64748b' },
  },
  success: {
    container: { backgroundColor: '#dcfce7' },
    text: { color: '#16a34a' },
    dot: { backgroundColor: '#22c55e' },
  },
  warning: {
    container: { backgroundColor: '#fef3c7' },
    text: { color: '#d97706' },
    dot: { backgroundColor: '#f59e0b' },
  },
  danger: {
    container: { backgroundColor: '#fee2e2' },
    text: { color: '#dc2626' },
    dot: { backgroundColor: '#ef4444' },
  },
  info: {
    container: { backgroundColor: '#dbeafe' },
    text: { color: '#2563eb' },
    dot: { backgroundColor: '#3b82f6' },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#cbd5e1' },
    text: { color: '#334155' },
    dot: { backgroundColor: '#64748b' },
  },
};

const sizeStyles: Record<string, StyleProp<ViewStyle>> = {
  sm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, minHeight: 20 },
  md: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, minHeight: 24 },
};

export const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, children, variant = 'default', size = 'md', dot = false, style, ...props }, ref) => {
    const styles = variantStyles[variant];

    return (
      <View
        ref={ref}
        className={cn('flex-row items-center', variant === 'outline' && 'border', className)}
        style={[sizeStyles[size], styles.container, style] as StyleProp<ViewStyle>}
        {...props}
      >
        {dot && (
          <View style={[{ width: 6, height: 6, borderRadius: 3, marginRight: 6 }, styles.dot] as StyleProp<ViewStyle>} />
        )}
        <TextPrimitive variant={size === 'sm' ? 'caption' : 'body-sm'} weight="medium" style={styles.text}>
          {children}
        </TextPrimitive>
      </View>
    );
  }
);

Badge.displayName = 'Badge';
