"use client";

import React, { useState, forwardRef } from "react";
import { Input, InputProps } from "./Input";
import { Eye, EyeOff, Lock } from "lucide-react";

export interface PasswordInputProps extends Omit<InputProps, "type" | "rightIcon" | "onRightIconClick"> {
  showLockIcon?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showLockIcon = true, leftIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        {...props}
        ref={ref}
        type={showPassword ? "text" : "password"}
        leftIcon={leftIcon || (showLockIcon ? Lock : undefined)}
        rightIcon={showPassword ? EyeOff : Eye}
        onRightIconClick={() => setShowPassword(!showPassword)}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";
