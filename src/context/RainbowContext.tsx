import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";

interface RainbowContextType {
  hue: number;
  isMouseOnPage: boolean;
}

const RainbowContext = createContext<RainbowContextType>({ hue: 0, isMouseOnPage: false });

export function RainbowProvider({ children }: { children: ReactNode }) {
  const [hue, setHue] = useState(0);
  const [isMouseOnPage, setIsMouseOnPage] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const lastMouseX = useRef<number | null>(null); // Track last mouse X for delta calculation
  const hueRef = useRef(0); // Track hue in ref for smooth updates

  useEffect(() => {
    // Mouse sensitivity: how many degrees of hue per pixel of mouse movement
    const MOUSE_SENSITIVITY = 0.25; // degrees per pixel (halved from 0.5)

    const handleMouseMove = (e: MouseEvent) => {
      if (lastMouseX.current !== null) {
        // Calculate delta from last position
        const deltaX = e.clientX - lastMouseX.current;
        // Add delta to hue (negative to make left-movement go backwards)
        hueRef.current = (hueRef.current + deltaX * MOUSE_SENSITIVITY + 360) % 360;
      }
      lastMouseX.current = e.clientX;
      setIsMouseOnPage(true);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      // Initialize lastMouseX on enter to prevent jump on first move
      lastMouseX.current = e.clientX;
      setIsMouseOnPage(true);
    };

    const handleMouseLeave = () => {
      lastMouseX.current = null;
      setIsMouseOnPage(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Animation loop
  useEffect(() => {
    // Constant speed: 60 deg/s (50% of original 120)
    const RAINBOW_SPEED = 60; // degrees per second

    const animate = (timestamp: number) => {
      if (lastTimestamp.current === null) {
        lastTimestamp.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimestamp.current) / 1000; // in seconds
      lastTimestamp.current = timestamp;

      // Always advance the hue by the automatic animation amount
      hueRef.current = (hueRef.current + RAINBOW_SPEED * deltaTime + 360) % 360;
      setHue(hueRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Update CSS custom property on document
  useEffect(() => {
    document.documentElement.style.setProperty("--rainbow-hue", String(hue));
  }, [hue]);

  return (
    <RainbowContext.Provider value={{ hue, isMouseOnPage }}>{children}</RainbowContext.Provider>
  );
}

export function useRainbow() {
  return useContext(RainbowContext);
}
