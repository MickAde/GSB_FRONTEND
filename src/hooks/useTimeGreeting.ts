'use client';
import { useState, useEffect } from 'react';

interface Greeting { text: string; emoji: string }

export function useTimeGreeting(): Greeting | null {
  const [greeting, setGreeting] = useState<Greeting | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      h < 12 ? { text: 'Good morning', emoji: '☀️' }
      : h < 17 ? { text: 'Good afternoon', emoji: '🌤️' }
      :          { text: 'Good evening',   emoji: '🌙' }
    );
  }, []);

  return greeting;
}
