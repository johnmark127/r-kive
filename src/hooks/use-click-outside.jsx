import { useEffect, useRef } from "react";

export const useClickOutside = (refs, callback) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handleClick = (event) => {
      const isClickOutside = refs.every(ref => 
        ref.current && !ref.current.contains(event.target)
      );
      
      if (isClickOutside) {
        callbackRef.current();
      }
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [refs]);
};
