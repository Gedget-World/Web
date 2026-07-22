"use client";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OTPInputComponentProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (otp: string) => void;
  disabled?: boolean;
}

export default function OTPInputComponent({
  value,
  onChange,
  onComplete,
  disabled,
}: OTPInputComponentProps) {
  return (
    <InputOTP
      maxLength={6}
      value={value}
      onChange={(newValue) => {
        onChange(newValue);
        if (newValue.length === 6) {
          onComplete?.(newValue);
        }
      }}
      disabled={disabled}
    >
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}
