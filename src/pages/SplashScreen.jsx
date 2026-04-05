import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimate } from 'framer-motion';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [dotScope, animateDot] = useAnimate();
  const letterRefs = useRef([]);
  const [letterPositions, setLetterPositions] = useState([]);
  const letters = ['C', 'a', 'p', 't', 'i', 'v'];

  useEffect(() => {
    // Wait 150ms then measure letter positions
    const timer = setTimeout(() => {
      const positions = letterRefs.current.map(ref => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          return {
            centerX: rect.left + rect.width / 2,
            topY: rect.top,
            bottomY: rect.bottom,
            width: rect.width,
            left: rect.left,
            right: rect.right
          };
        }
        return null;
      }).filter(Boolean);
      
      setLetterPositions(positions);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (letterPositions.length === 0) return;

    const runAnimation = async () => {
      // Find the minimum topY to ensure arc stays above all letters
      const minTopY = Math.min(...letterPositions.map(p => p.topY));
      
      // Start position above first letter C
      const startX = letterPositions[0].centerX - 11;
      const startY = letterPositions[0].topY - 60;

      // Set initial dot position
      await animateDot(dotScope.current, {
        left: startX,
        top: startY,
        opacity: 1
      }, { duration: 0 });

      // Hop to each letter - dot lands ON TOP of each letter
      for (let i = 0; i < letterPositions.length; i++) {
        const pos = letterPositions[i];
        const prevX = i === 0 ? letterPositions[0].centerX : letterPositions[i - 1].centerX;
        const distance = Math.abs(pos.centerX - prevX);
        const arcHeight = distance * 0.7;
        const midX = (prevX + pos.centerX) / 2;
        
        // Arc peak is above the letters
        const peakY = minTopY - arcHeight - 22;
        
        // Landing position is ON TOP of the letter
        const landingX = pos.centerX - 11;
        const landingY = pos.topY - 22;

        // Phase 1 - rise up to arc peak
        await animateDot(dotScope.current, {
          left: midX - 11,
          top: peakY
        }, {
          duration: 0.15,
          ease: 'easeOut'
        });

        // Phase 2 - come down and land on top of letter
        await animateDot(dotScope.current, {
          left: landingX,
          top: landingY
        }, {
          duration: 0.13,
          ease: 'easeIn'
        });

        // Squash on landing
        await animateDot(dotScope.current, {
          scaleX: 1.6,
          scaleY: 0.5
        }, { duration: 0 });

        // Spring back
        await animateDot(dotScope.current, {
          scaleX: 1,
          scaleY: 1
        }, {
          type: 'spring',
          stiffness: 600,
          damping: 10
        });

        // Scale up the letter
        if (letterRefs.current[i]) {
          letterRefs.current[i].style.transform = 'scale(1.15)';
          letterRefs.current[i].style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
          setTimeout(() => {
            if (letterRefs.current[i]) {
              letterRefs.current[i].style.transform = 'scale(1)';
            }
          }, 200);
        }
      }

      // Move to full stop position - 12px to the right of last letter v on the baseline
      const lastPos = letterPositions[letterPositions.length - 1];
      const fullStopX = lastPos.right + 12 - 11;
      const fullStopY = lastPos.bottomY - 22;

      await animateDot(dotScope.current, {
        left: fullStopX,
        top: fullStopY
      }, {
        type: 'spring',
        stiffness: 500,
        damping: 8,
        mass: 0.4
      });

      // Big squash at full stop
      await animateDot(dotScope.current, {
        scaleX: 1.8,
        scaleY: 0.4
      }, { duration: 0 });

      await animateDot(dotScope.current, {
        scaleX: 1,
        scaleY: 1
      }, {
        type: 'spring',
        stiffness: 400,
        damping: 10
      });

      // Wait at full stop for 700ms - dot sits completely still
      await new Promise(resolve => setTimeout(resolve, 700));

      // Calculate target size to cover entire screen
      const targetSize = Math.ceil(
        Math.sqrt(
          window.innerWidth * window.innerWidth + 
          window.innerHeight * window.innerHeight
        )
      ) + 100;

      // Calculate center position for expansion
      const centerX = fullStopX + 11;
      const centerY = fullStopY + 11;

      // Expand dot from 22px to full screen size
      // Keep it centered on the full stop position
      await animateDot(dotScope.current, {
        width: targetSize,
        height: targetSize,
        left: centerX - targetSize / 2,
        top: centerY - targetSize / 2,
        scaleX: 1,
        scaleY: 1
      }, {
        duration: 1.2,
        ease: 'easeInOut'
      });

      // Wait 100ms after expansion completes
      await new Promise(resolve => setTimeout(resolve, 100));

      // Call onComplete callback to hide splash and navigate
      if (onComplete) {
        onComplete();
      }
    };

    runAnimation();
  }, [letterPositions, animateDot, dotScope, onComplete]);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="brand-word">
          {letters.map((letter, index) => (
            <span
              key={index}
              ref={el => letterRefs.current[index] = el}
              className="brand-letter"
            >
              {letter}
            </span>
          ))}
        </div>

        <motion.div
          ref={dotScope}
          className="bouncing-dot"
          initial={{ 
            opacity: 0,
            width: 22,
            height: 22
          }}
        />
      </div>
    </div>
  );
}

export default SplashScreen;
