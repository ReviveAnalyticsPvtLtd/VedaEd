import React, { useRef, useCallback, useEffect } from "react";

const OTP_LENGTH = 6;

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

export default function OtpInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = false,
  idPrefix = "otp",
}) {
  const inputRefs = useRef([]);
  const digits = digitsOnly(value).slice(0, OTP_LENGTH).split("");
  while (digits.length < OTP_LENGTH) digits.push("");

  const focusInput = useCallback((index) => {
    const el = inputRefs.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const emitChange = useCallback(
    (nextDigits) => {
      onChange(nextDigits.join("").slice(0, OTP_LENGTH));
    },
    [onChange]
  );

  const handleChange = (index, raw) => {
    const cleaned = digitsOnly(raw);
    if (!cleaned) {
      const next = [...digits];
      next[index] = "";
      emitChange(next);
      return;
    }

    const next = [...digits];
    let cursor = index;

    for (let i = 0; i < cleaned.length && cursor < OTP_LENGTH; i += 1) {
      next[cursor] = cleaned[i];
      cursor += 1;
    }

    emitChange(next);
    if (cursor < OTP_LENGTH) focusInput(cursor);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits];
        next[index] = "";
        emitChange(next);
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = "";
        emitChange(next);
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = digitsOnly(event.clipboardData.getData("text")).slice(
      0,
      OTP_LENGTH
    );
    if (!pasted) return;

    const next = pasted.split("");
    while (next.length < OTP_LENGTH) next.push("");
    emitChange(next);
    focusInput(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  useEffect(() => {
    if (autoFocus && !disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  return (
    <div
      className="flex gap-2 sm:gap-3"
      role="group"
      aria-label="Enter 6-digit verification code"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={`${idPrefix}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          className={`onboarding-otp-box h-12 w-11 rounded-lg border text-center text-lg font-semibold text-slate-900 outline-none transition sm:h-14 sm:w-12 sm:text-xl ${
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          } disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-60`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
