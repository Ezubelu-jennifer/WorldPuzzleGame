import { useState, useEffect, useRef } from "react";

interface UseGameTimerProps {
  isRunning?: boolean;
  onTick?: (seconds: number) => void;
}

export function useGameTimer({ isRunning = false, onTick }: UseGameTimerProps = {}) {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Start the timer
  const start = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Set current time as start time
    startTimeRef.current = Date.now() - (seconds * 1000);
    
    // Start the interval
    timerRef.current = setInterval(() => {
      const currentSeconds = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000);
      setSeconds(currentSeconds);
      
      if (onTick) {
        onTick(currentSeconds);
      }
    }, 1000);
  };

  // Stop the timer
  const stop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Reset the timer
  const reset = () => {
    stop();
    setSeconds(0);
    startTimeRef.current = null;
  };

  // Format seconds as MM:SS
  const formatTime = (secs: number): string => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Effect to manage timer based on isRunning prop
  useEffect(() => {
    if (isRunning) {
      start();
    } else {
      stop();
    }
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  return {
    seconds,
    formattedTime: formatTime(seconds),
    start,
    stop,
    reset,
  };
}
