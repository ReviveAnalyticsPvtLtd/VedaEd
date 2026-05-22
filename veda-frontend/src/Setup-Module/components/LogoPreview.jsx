import React from "react";
import { getLogoFrameClasses } from "../utils/logoFrameStyles";

const LogoPreview = ({
  src,
  frameShape = "rounded-square",
  size = "md",
  placeholder = "V",
  backgroundColor = "#ffffff",
  className = "",
  variant = "default",
}) => {
  const { container, image } = getLogoFrameClasses(frameShape, size);

  const variantClasses =
    variant === "branding"
      ? "border-white/25 shadow-sm"
      : "border-setup-border shadow-sm";

  return (
    <div
      className={`${container} ${variantClasses} ${className}`}
      style={{ backgroundColor }}
    >
      {src ? (
        <img src={src} alt="" className={image} draggable={false} />
      ) : (
        <span className="text-sm font-bold text-setup-muted sm:text-base">{placeholder}</span>
      )}
    </div>
  );
};

export default LogoPreview;
