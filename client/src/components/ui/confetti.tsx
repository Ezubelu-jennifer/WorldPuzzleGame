import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

export function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [isActive, setIsActive] = useState(active);

  useEffect(() => {
    setIsActive(active);
    
    if (active) {
      const timer = setTimeout(() => {
        setIsActive(false);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!isActive) return null;

  // Using a 3rd party confetti library that's loaded via CDN
  return createPortal(
    <div id="confetti-container" className="fixed inset-0 pointer-events-none z-50">
      <script 
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const confettiScript = document.createElement('script');
              confettiScript.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
              confettiScript.onload = function() {
                const duration = ${duration};
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
                
                function randomInRange(min, max) {
                  return Math.random() * (max - min) + min;
                }
                
                const interval = setInterval(function() {
                  const timeLeft = animationEnd - Date.now();
                  
                  if (timeLeft <= 0) {
                    return clearInterval(interval);
                  }
                  
                  const particleCount = 50 * (timeLeft / duration);
                  
                  // since particles fall down, start a bit higher than random
                  confetti(Object.assign({}, defaults, { 
                    particleCount, 
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
                  }));
                  confetti(Object.assign({}, defaults, { 
                    particleCount, 
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
                  }));
                }, 250);
              };
              document.body.appendChild(confettiScript);
            })();
          `,
        }}
      />
    </div>,
    document.body
  );
}
