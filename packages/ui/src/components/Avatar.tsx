import React from "react";
import { View, ViewProps, StyleProp, ViewStyle, Image } from "react-native";
import { cn } from "../utils/cn";
import { TextPrimitive } from "../primitives/Text";

interface AvatarProps extends ViewProps {
  className?: string;
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  shape?: "circle" | "square";
}

const sizeStyles: Record<string, StyleProp<ViewStyle>> = {
  xs: { width: 24, height: 24 },
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 48, height: 48 },
  xl: { width: 64, height: 64 },
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const colorFromString = (str: string) => {
  const colors = ['#334e68', '#475569', '#1e293b', '#0f172a', '#16a34a', '#dc2626'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = React.forwardRef<View, AvatarProps>(
  ({ className, src, name, size = 'md', shape = 'circle', style, ...props }, ref) => {
    const bgColor = name ? colorFromString(name) : '#64748b';

    return (
      <View
        ref={ref}
        className={cn(
          'items-center justify-center overflow-hidden',
          shape === 'circle' && 'rounded-full',
          shape === 'square' && 'rounded-lg',
          className
        )}
        style={[sizeStyles[size], { backgroundColor: bgColor }, style] as StyleProp<ViewStyle>}
        {...props}
      >
        {src ? (
          <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <TextPrimitive variant="body" weight="semibold" color="inverse" style={{ 
            fontSize: size === 'xs' ? 10 : size === 'sm' ? 12 : size === 'md' ? 14 : size === 'lg' ? 16 : 20 
          }}>
            {name ? getInitials(name) : '?'}
          </TextPrimitive>
        )}
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';
