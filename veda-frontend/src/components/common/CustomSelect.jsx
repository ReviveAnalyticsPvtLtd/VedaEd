import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  const [menuRect, setMenuRect] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const r = buttonRef.current.getBoundingClientRect();
    const openUp = window.innerHeight - r.bottom < 240;
    setMenuRect({
      top: openUp ? undefined : r.bottom + 4,
      bottom: openUp ? window.innerHeight - r.top + 4 : undefined,
      left: r.left,
      width: Math.max(r.width, 140),
    });
    setIsOpen(true);
  };

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
      const inContainer = containerRef.current && containerRef.current.contains(event.target);
      const inMenu = menuRef.current && menuRef.current.contains(event.target);
      if (!inContainer && !inMenu) {
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
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={toggleMenu}
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

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            ref={menuRef}
            className={`fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[1000] py-1 max-h-60 overflow-y-auto animate-fadeIn ${menuClassName}`}
            style={{
              top: menuRect.top,
              bottom: menuRect.bottom,
              left: menuRect.left,
              width: menuRect.width,
            }}
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
          </div>,
          document.body
        )}
    </div>
  );
}
