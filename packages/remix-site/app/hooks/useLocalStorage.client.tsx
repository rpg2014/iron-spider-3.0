//a react hook with the same parameters and return as useState, but uses local storage to store the state
import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (e) {
      console.error(e);
      // If user is in private browsing mode or has storage restriction
      // localStorage can throw. JSON.stringify() should also throw.
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as [T, React.Dispatch<React.SetStateAction<T>>];
}
