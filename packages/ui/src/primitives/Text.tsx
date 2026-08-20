import React from "react";
import { Text, TextProps, StyleProp, TextStyle } from "react-native";
import { cn } from "../utils/cn";

interface TextPrimitiveProps extends TextProps {
  className?: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "body" | "body-sm" | "caption" | "overline";
  weight?: "regular" | "medium" | "semibold" | "bold";
  color?: "primary" | "secondary" | "tertiary" | "inverse" | "success" | "warning" | "danger" | "link";
}

const variantStyles: Record<string, StyleProp<TextStyle>> = {
  h1: { fontSize: 36, lineHeight: 44, fontWeight: '700' },
  h2: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  h3: { fontSize: 24, lineHeight: 32, fontWeight: '600' },
  h4: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  'body-sm': { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  overline: { fontSize: 10, lineHeight: 16, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1 },
};

const colorStyles: Record<string, StyleProp<TextStyle>> = {
  primary: { color: '#0f172a' },
  secondary: { color: '#334155' },
  tertiary: { color: '#64748b' },
  inverse: { color: '#ffffff' },
  success: { color: '#16a34a' },
  warning: { color: '#d97706' },
  danger: { color: '#dc2626' },
  link: { color: '#334e68' },
};

const weightStyles: Record<string, StyleProp<TextStyle>> = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semibold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
};

export const TextPrimitive = React.forwardRef<Text, TextPrimitiveProps>(
  ({ className, style, variant = 'body', weight = 'regular', color = 'primary', children, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn(className)}
        style={[
          variantStyles[variant],
          weightStyles[weight],
          colorStyles[color],
          style,
        ] as StyleProp<TextStyle>}
        {...props}
      >
        {children}
      </Text>
    );
  }
);

TextPrimitive.displayName = "TextPrimitive";

export const Heading1 = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="h1" {...props}>{children}</TextPrimitive>
);
export const Heading2 = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="h2" {...props}>{children}</TextPrimitive>
);
export const Heading3 = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="h3" {...props}>{children}</TextPrimitive>
);
export const Heading4 = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="h4" {...props}>{children}</TextPrimitive>
);
export const Body = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="body" {...props}>{children}</TextPrimitive>
);
export const BodySm = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="body-sm" {...props}>{children}</TextPrimitive>
);
export const Caption = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="caption" {...props}>{children}</TextPrimitive>
);
export const Overline = ({ children, ...props }: TextPrimitiveProps) => (
  <TextPrimitive variant="overline" {...props}>{children}</TextPrimitive>
);
