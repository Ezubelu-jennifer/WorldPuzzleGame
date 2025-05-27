import { useState, useEffect, useRef } from "react";

interface UseGameTimerProps {
  isRunning?: boolean;
  maxTime?: number; // in seconds
  onTick?: (seconds: number) => void;
  onTimeUp?: () => void;
}

export function useGameTimer({
  isRunning = false,
  maxTime,
  onTick,
  onTimeUp,
}: UseGameTimerProps = {}) {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [running, setRunning] = useState(isRunning);


  // Start the timer
  const start = () => {
    // Clear any existing timer
    //stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Set current time as start time
    //startTimeRef.current = Date.now() - (seconds * 1000);
     // Use existing startTimeRef if set, otherwise calculate from seconds
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now() - (seconds * 1000);
    }
   // console.log('timer:',startTimeRef.current);
    
    // Start the interval
    timerRef.current = setInterval(() => {
      const currentSeconds = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000);
      setSeconds((prev) => {
        if (maxTime && currentSeconds >= maxTime) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
         // console.log('timer:',startTimeRef.current);

          onTimeUp?.(); // Notify when time is up
          return maxTime;
        }
        return currentSeconds;
      });
      
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
    startTimeRef.current = Date.now();
   // console.log('running', running);

    if (running) {
      start();
    }
  };

  // Format seconds as MM:SS
  const formatTime = (secs: number): string => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Effect to manage timer based on isRunning prop
  useEffect(() => {
    setRunning(isRunning);
    if (isRunning) {
      start();
    } else {
      stop();
    }
    
    // Clean up on unmount
    return () => {
      //clearInterval(timerRef.current!);
      stop(); // Clear interval on unmount
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
