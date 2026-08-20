import React from "react";
import { View, ViewProps, StyleProp, ViewStyle, TouchableOpacity } from "react-native";
import { cn } from "../utils/cn";
import { TextPrimitive } from "../primitives/Text";
import { Box } from "../primitives/Box";

interface CardProps extends ViewProps {
  className?: string;
  children: React.ReactNode;
  variant?: "default" | "outlined" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  onPress?: () => void;
}

const variantStyles: Record<string, StyleProp<ViewStyle>> = {
  default: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  outlined: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#cbd5e1' },
  elevated: { backgroundColor: '#ffffff', borderWidth: 0, elevation: 3 },
};

const paddingStyles: Record<string, StyleProp<ViewStyle>> = {
  none: { padding: 0 },
  sm: { padding: 12 },
  md: { padding: 16 },
  lg: { padding: 24 },
};

export const Card = React.forwardRef<View, CardProps>(
  ({ className, children, variant = 'default', padding = 'md', onPress, style, ...props }, ref) => {
    const Component = onPress ? TouchableOpacity : View;

    return (
      <Component
        ref={ref}
        className={cn(
          'rounded-xl',
          onPress && 'active:opacity-90',
          className
        )}
        style={[variantStyles[variant], paddingStyles[padding], style] as StyleProp<ViewStyle>}
        onPress={onPress}
        activeOpacity={0.9}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...props }: ViewProps) => (
  <Box className={cn('mb-4', className)} {...props}>{children}</Box>
);

export const CardTitle = ({ className, children, ...props }: ViewProps) => (
  <TextPrimitive className={cn('text-lg font-semibold text-primary', className)} variant="h4" {...props}>
    {children}
  </TextPrimitive>
);

export const CardContent = ({ className, children, ...props }: ViewProps) => (
  <Box className={cn('', className)} {...props}>{children}</Box>
);

export const CardFooter = ({ className, children, ...props }: ViewProps) => (
  <Box className={cn('mt-4 pt-4 border-t border-light', className)} {...props}>
    {children}
  </Box>
);
