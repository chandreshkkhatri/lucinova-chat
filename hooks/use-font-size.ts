import { useState, useEffect } from "react";

export type FontSize = "small" | "medium" | "large";

export function useFontSize() {
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem("app-font-size") as FontSize;
    if (stored && ["small", "medium", "large"].includes(stored)) {
      setFontSizeState(stored);
    }
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem("app-font-size", size);
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "small":
        return "prose-sm max-w-none"; // 14px base
      case "large":
        return "prose-lg max-w-none"; // 18px base
      case "medium":
      default:
        return "prose-base max-w-none"; // 16px base
    }
  };

  return {
    fontSize,
    setFontSize,
    getFontSizeClass,
    isMounted,
  };
}
