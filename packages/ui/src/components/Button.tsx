import React from "react";
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from "react-native";
import { cn } from "../utils/cn";
import { TextPrimitive } from "../primitives/Text";

interface ButtonProps extends TouchableOpacityProps {
  className?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, StyleProp<ViewStyle>> = {
  primary: { backgroundColor: '#334e68', borderWidth: 0 },
  secondary: { backgroundColor: '#64748b', borderWidth: 0 },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334e68' },
  ghost: { backgroundColor: 'transparent', borderWidth: 0 },
  danger: { backgroundColor: '#dc2626', borderWidth: 0 },
};

const sizeStyles: Record<string, StyleProp<ViewStyle>> = {
  sm: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, minHeight: 36 },
  md: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, minHeight: 44 },
  lg: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8, minHeight: 52 },
};

const textColorStyles: Record<string, StyleProp<TextStyle>> = {
  primary: { color: '#ffffff' },
  secondary: { color: '#ffffff' },
  outline: { color: '#334e68' },
  ghost: { color: '#334e68' },
  danger: { color: '#ffffff' },
};

export const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  ({
    className,
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    style,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <TouchableOpacity
        ref={ref}
        className={cn(
          'flex-row items-center justify-center',
          fullWidth && 'w-full',
          isDisabled && 'opacity-50'
        )}
        style={[
          variantStyles[variant],
          sizeStyles[size],
          { opacity: isDisabled ? 0.6 : 1 },
          style,
        ] as StyleProp<ViewStyle>}
        disabled={isDisabled}
        activeOpacity={0.85}
        {...props}
      >
        {loading && (
          <ActivityIndicator size="small" color={variant === 'outline' || variant === 'ghost' ? '#334e68' : '#ffffff'} style={{ marginRight: 8 }} />
        )}
        {!loading && leftIcon && <>{leftIcon}</>}
        <TextPrimitive
          className={cn('font-medium', !loading && rightIcon && 'pr-2')}
          style={textColorStyles[variant]}
        >
          {children}
        </TextPrimitive>
        {!loading && rightIcon && <>{rightIcon}</>}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';
