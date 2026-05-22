import {
  DEFAULT_LOGO_FRAME_SHAPE,
  LOGO_FRAME_SHAPES,
} from "../constants/schoolProfile";

const SIZE_CLASSES = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-24 w-24",
};

const PADDING_CLASSES = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

export function resolveLogoFrameShape(shapeId) {
  return (
    LOGO_FRAME_SHAPES.find((s) => s.id === shapeId) ||
    LOGO_FRAME_SHAPES.find((s) => s.id === DEFAULT_LOGO_FRAME_SHAPE) ||
    LOGO_FRAME_SHAPES[0]
  );
}

/** Container + image classes for logo frame (object-contain, centered, no crop) */
export function getLogoFrameClasses(shapeId, size = "md") {
  const shape = resolveLogoFrameShape(shapeId);
  return {
    container: [
      "flex shrink-0 items-center justify-center overflow-hidden",
      SIZE_CLASSES[size] || SIZE_CLASSES.md,
      shape.borderRadius,
      "border",
    ].join(" "),
    image: ["max-h-full max-w-full object-contain", PADDING_CLASSES[size] || PADDING_CLASSES.md].join(
      " "
    ),
  };
}
