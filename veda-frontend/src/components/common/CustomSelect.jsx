import React, { useState, useRef, useEffect, useMemo } from "react";
import { FiChevronDown } from "react-icons/fi";

/**
 * Reusable theme-aware CustomSelect component
 * Supports both `options` prop and standard `<option>` children.
 * Dynamically binds to the application's primary theme color for active & hover states.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  children,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  name = "",
  id,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options from either options prop or children
  const parsedOptions = useMemo(() => {
    if (Array.isArray(options) && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return {
            value: opt.value !== undefined ? String(opt.value) : "",
            label: opt.label !== undefined ? opt.label : String(opt.value ?? ""),
          };
        }
        return {
          value: String(opt),
          label: String(opt),
        };
      });
    }

    if (children) {
      const opts = [];
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child) && child.props) {
          const val = child.props.value !== undefined ? String(child.props.value) : "";
          const lbl = child.props.children !== undefined ? child.props.children : val;
          opts.push({ value: val, label: lbl });
        }
      });
      return opts;
    }

    return [];
  }, [options, children]);

  const selectedOption = parsedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  const displayLabel = selectedOption
    ? selectedOption.label
    : (parsedOptions.length > 0 && (value === undefined || value === ""))
    ? parsedOptions[0].label
    : placeholder;

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (opt) => {
    if (disabled) return;
    setIsOpen(false);
    if (typeof onChange === "function") {
      onChange({
        target: {
          value: opt.value,
          name: name,
        },
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      id={id}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 border px-3 py-2 rounded-lg text-sm bg-white text-gray-800 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-300"
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left font-normal">{displayLabel}</span>
        <FiChevronDown
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${
            isOpen ? "transform rotate-180 text-blue-600" : ""
          }`}
          size={16}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 right-0 mt-1.5 w-full min-w-[140px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto animate-fadeIn ${menuClassName}`}
          role="listbox"
        >
          {parsedOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400 italic">
              No options available
            </div>
          ) : (
            parsedOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={`${opt.value}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={`w-full text-left px-3.5 py-2 text-sm transition-colors flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-600 text-white font-medium shadow-sm"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
