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

  // Calculate responsive header position
  // We want the new center of the logo to be exactly in the middle of the header.
  // The header is roughly 64px tall, so its center is at y=32.
  // The initial motion.div has top="50vh - 80px", so its center is initially at "50vh".
  // Therefore, the required translation is: 32 - 50vh.
  // The code below calculates `headerY = -(startingY - headerCenterY)`.
  // To make `new_center = 32`, we need `80 + headerCenterY = 32` => `headerCenterY = -48`.
  let headerCenterY = -48; // Default for desktop

  // Adjust for mobile/tablet (header might be slightly smaller/larger)
  if (windowWidth < 640) {
    headerCenterY = -52;
  } else if (windowWidth < 768) {
    headerCenterY = -48;
  } else if (windowWidth < 1024) {
    headerCenterY = -48;
  }

  // Scale PERSONA responsively for header (needs to fit in search bar area)
  let headerScale = 0.28; // Default for desktop (slightly larger to be more visible)

  if (windowWidth < 640) {
    // Mobile - smaller scale
    headerScale = 0.2;
  } else if (windowWidth < 768) {
    // Tablet
    headerScale = 0.24;
  } else if (windowWidth < 1024) {
    // Small desktop
    headerScale = 0.26;
  }

  // Calculate Y translation: move from center viewport to header center
  // Starting position: calc(50% - 80px) from top = window.innerHeight * 0.5 - 80
  // Target position: headerCenterY pixels from top
  const startingY = window.innerHeight * 0.5 - 80;
  const headerY = -(startingY - headerCenterY);

  // Horizontal: PERSONA stays centered in the header
  // Element is already at left-1/2 -translate-x-1/2, so no X translation needed
  const headerX = 0;

  return (
    <>
      {/* Full-viewport scroll block — reserves space so Monthly Trends starts after intro */}
      <section
        aria-hidden
        className="relative h-screen w-full shrink-0 bg-white"
      />
      <motion.div
        className="fixed left-1/2 top-[calc(50%-80px)] -translate-x-1/2 z-40 pointer-events-none"
        animate={{
          scale: isInHeader ? headerScale : heroScale,
          y: isInHeader ? headerY : heroY,
          x: isInHeader ? headerX : heroX,
        }}
        transition={{
          duration: 0.8,
          ease: [0.45, 0, 0.55, 1], // ease-in-out
        }}
        style={{
          zIndex: isInHeader ? 51 : 30, // Higher z-index when in header (above header's z-50)
        }}
      >
        <h1
          className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[160px] tracking-tighter leading-none select-none text-black text-center font-[Anton] whitespace-nowrap px-4"
          style={{
            textShadow: isInHeader
              ? "0 1px 2px rgba(0,0,0,0.05)"
              : "0 6px 40px rgba(0,0,0,0.12)",
            opacity: isInHeader ? 0.95 : 1,
          }}
        >
          PERSONA
        </h1>
      </motion.div>
    </>
  );
}
