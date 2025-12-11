import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function PersonaLogo() {
  const [isInHeader, setIsInHeader] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    const handleScroll = () => {
      // Threshold: 15% of viewport height (synchronized with Header)
      const threshold = window.innerHeight * 0.15;
      const shouldBeInHeader = window.scrollY > threshold;

      if (shouldBeInHeader !== isInHeader) {
        setIsInHeader(shouldBeInHeader);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    window.addEventListener("resize", handleResize, {
      passive: true,
    });

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [isInHeader]);

  // ============================================================
  // DIRECT SLOT REPLACEMENT CALCULATION - RESPONSIVE
  // ============================================================

  // HERO STATE (before scroll):
  // - PERSONA is at viewport center (top: 50vh, left: 50vw)
  // - Element uses: fixed left-1/2 top-1/2 -translate-x-1/2
  // - No transform applied (x=0, y=0, scale=1)

  const heroScale = 1;
  const heroY = 0;
  const heroX = 0;

  // HEADER STATE (after scroll):
  // - PERSONA must move into the EXACT CENTER SLOT where the search bar lives
  // - Responsive positioning based on screen size

  // Calculate responsive header center position
  let headerCenterY = 11; // Default for desktop

  // Adjust for mobile/tablet
  if (windowWidth < 640) {
    // Mobile - smaller header
    headerCenterY = 8;
  } else if (windowWidth < 768) {
    // Tablet
    headerCenterY = 10;
  }

  // Scale PERSONA responsively
  let headerScale = 0.32; // Default for desktop

  if (windowWidth < 640) {
    // Mobile - smaller scale
    headerScale = 0.22;
  } else if (windowWidth < 768) {
    // Tablet
    headerScale = 0.28;
  } else if (windowWidth < 1024) {
    // Small desktop
    headerScale = 0.3;
  }

  // Calculate Y translation: move from 50vh to headerCenterY
  // Translation = -(starting position - target position)
  const headerY = -(window.innerHeight * 0.5 - headerCenterY);

  // Horizontal: PERSONA stays centered (search bar is also centered)
  // Element is already at left-1/2 -translate-x-1/2, so no X translation needed
  const headerX = 0;

  return (
    <motion.div
      className="fixed left-1/2 top-[calc(50%-80px)] -translate-x-1/2 z-30 pointer-events-none"
      animate={{
        scale: isInHeader ? headerScale : heroScale,
        y: isInHeader ? headerY : heroY,
        x: isInHeader ? headerX : heroX,
      }}
      transition={{
        duration: 0.8,
        ease: [0.45, 0, 0.55, 1], // ease-in-out
      }}
    >
      <h1
        className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[160px] tracking-tighter leading-none select-none text-black text-center font-[Anton] whitespace-nowrap px-4"
        style={{
          textShadow: isInHeader
            ? "0 1px 4px rgba(0,0,0,0.02)"
            : "0 6px 40px rgba(0,0,0,0.12)",
        }}
      >
        PERSONA
      </h1>
    </motion.div>
  );
}