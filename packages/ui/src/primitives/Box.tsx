import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { cn } from "../utils/cn";

interface BoxProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export const Box = React.forwardRef<View, BoxProps>(
  ({ className, style, children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(className)}
        style={style as StyleProp<ViewStyle>}
        {...props}
      >
        {children}
      </View>
    );
  }
);

Box.displayName = "Box";
