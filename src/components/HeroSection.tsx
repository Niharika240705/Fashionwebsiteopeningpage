import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useState, useEffect } from 'react';
import bgImage from '../assets/6e45595c696a9eb4a2b03a0f569541c36c9f0457.png';
import fashionImage1 from '../assets/3894254e2cf740948e8589c22a75a5ecde389811.png';
import fashionImage2 from '../assets/bc1b49959fd4c00033c5b478058d367ca177b7f0.png';
import fashionImage3 from '../assets/8a370e24ba6fd833c66323001eca35159e221dbb.png';

// Only existing black-and-white fashion images (removed PERSONA overlay image)
const fashionImages = [
  bgImage,
  fashionImage1,
  fashionImage2,
  fashionImage3,
];

export function HeroSection() {
  const rotationX = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Lighting effects based on rotation
  const lightShift = useTransform(rotationX, 
    [0, -45, -90], 
    ['0deg', '15deg', '30deg']
  );

  const shadowIntensity = useTransform(rotationX,
    [0, -45, -90],
    [0.15, 0.25, 0.15]
  );

  useEffect(() => {
    const totalFaces = fashionImages.length;
    const degreesPerFace = 360 / totalFaces;
    
    let faceIndex = 0;

    const rotateCuboid = () => {
      const nextRotation = -(faceIndex * degreesPerFace);
      
      // Cinematic rotation with hold
      animate(rotationX, nextRotation, {
        duration: 2.8, // Slow luxury rotation
        ease: [0.45, 0, 0.55, 1], // ease-in-out-sine curve
        onComplete: () => {
          // Brief hold before next rotation
          setTimeout(() => {
            faceIndex = (faceIndex + 1) % totalFaces;
            setCurrentIndex(faceIndex);
            rotateCuboid();
          }, 800); // Hold time between rotations
        },
      });
    };

    // Start the rotation cycle
    rotateCuboid();
  }, [rotationX]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-neutral-50">
      {/* 3D Cuboid Container with Perspective */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ 
          perspective: typeof window !== 'undefined' && window.innerWidth < 768 ? '1200px' : '1800px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Rotating Cuboid Container with Luxury Motion */}
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            rotateX: rotationX,
          }}
        >
          {/* Each face of the cuboid */}
          {fashionImages.map((image, index) => {
            const degreesPerFace = 360 / fashionImages.length;
            const rotationAngle = index * degreesPerFace;
            const translateZ = typeof window !== 'undefined' && window.innerWidth < 768 ? 300 : 450;
            
            return (
              <div
                key={index}
                className="absolute inset-0"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: `rotateX(${rotationAngle}deg) translateZ(${translateZ}px)`,
                  backfaceVisibility: 'hidden',
                }}
              >
                <div className="relative w-full h-full">
                  {/* Image with subtle parallax depth */}
                  <motion.img
                    src={image}
                    alt="Fashion Editorial"
                    className="w-full h-full object-cover"
                    style={{
                      opacity: 0.42,
                      filter: 'contrast(1.08) brightness(0.96)',
                    }}
                    animate={{
                      scale: currentIndex === index ? 1.03 : 1,
                      filter: currentIndex === index 
                        ? 'contrast(1.08) brightness(0.96) blur(0px)' 
                        : 'contrast(1.08) brightness(0.96) blur(1px)', // Micro motion blur
                    }}
                    transition={{
                      duration: 2.8,
                      ease: [0.45, 0, 0.55, 1],
                    }}
                  />
                  
                  {/* Dynamic lighting highlight */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent"
                    style={{
                      background: `linear-gradient(${lightShift}deg, rgba(255,255,255,0.08) 0%, transparent 50%)`,
                    }}
                  />
                  
                  {/* Soft depth shadow */}
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20"
                    style={{
                      opacity: shadowIntensity,
                      boxShadow: 'inset 0 0 200px rgba(0,0,0,0.12)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Shadow drift under cuboid */}
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-20 sm:h-24 md:h-32 bg-black/5 blur-3xl rounded-full"
          animate={{
            scaleX: [1, 1.15, 1],
            opacity: [0.05, 0.08, 0.05],
          }}
          transition={{
            duration: 5.6,
            repeat: Infinity,
            ease: [0.45, 0, 0.55, 1],
          }}
        />
      </div>

      {/* Static PERSONA Typography - stays on top with depth parallax */}
      <div className="relative h-full flex items-center justify-center pt-16 sm:pt-20 pointer-events-none z-10">
        <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 md:px-8">
          {/* PERSONA text removed - now handled by PersonaLogo component */}
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      >
        <div className="w-5 h-8 sm:w-6 sm:h-10 border-2 border-black/20 rounded-full flex items-start justify-center p-1.5 sm:p-2">
          <div className="w-0.5 sm:w-1 h-1.5 sm:h-2 bg-black/20 rounded-full" />
        </div>
      </motion.div>
    </section>
  );
}