import React from "react";
import { TextInput, TextInputProps, StyleProp, ViewStyle, TextStyle, View } from "react-native";
import { cn } from "../utils/cn";
import { TextPrimitive } from "../primitives/Text";
import { Box } from "../primitives/Box";

interface InputProps extends TextInputProps {
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({
    className,
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    style,
    disabled,
    ...props
  }, ref) => {
    return (
      <Box className="w-full">
        {label && (
          <TextPrimitive className="mb-2" variant="body-sm" weight="medium" color="primary">
            {label}
          </TextPrimitive>
        )}
        <Box
          className="flex-row items-center"
          style={[
            {
              borderWidth: 1,
              borderColor: error ? '#dc2626' : disabled ? '#e2e8f0' : '#cbd5e1',
              borderRadius: 8,
              backgroundColor: disabled ? '#f8fafc' : '#ffffff',
            },
            error && { borderWidth: 2 },
            style,
          ] as StyleProp<ViewStyle>}
        >
          {leftIcon && (
            <Box className="px-3" style={{ color: '#94a3b8' }}>
              {leftIcon}
            </Box>
          )}
          <TextInput
            ref={ref}
            className={cn(
              'flex-1 px-4 py-3',
              'text-base',
              'placeholder:text-tertiary',
              disabled && 'text-tertiary'
            )}
            style={[{ color: '#0f172a' }, style] as StyleProp<TextStyle>}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            {...props}
          />
          {rightIcon && (
            <Box className="px-3" style={{ color: '#94a3b8' }}>
              {rightIcon}
            </Box>
          )}
        </Box>
        {error && (
          <TextPrimitive className="mt-1.5" variant="caption" color="danger" role="alert">
            {error}
          </TextPrimitive>
        )}
        {!error && helperText && (
          <TextPrimitive className="mt-1.5" variant="caption" color="tertiary">
            {helperText}
          </TextPrimitive>
        )}
      </Box>
    );
  }
);

Input.displayName = 'Input';
