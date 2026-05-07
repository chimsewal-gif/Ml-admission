'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1 rounded-md transition ${
          theme === 'light' 
            ? 'bg-white text-gray-900 shadow' 
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        ☀️ Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1 rounded-md transition ${
          theme === 'dark' 
            ? 'bg-gray-700 text-white shadow' 
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        🌙 Dark
      </button>
      <button
        onClick={() => setTheme('high-contrast')}
        className={`px-3 py-1 rounded-md transition ${
          theme === 'high-contrast' 
            ? 'bg-yellow-200 text-black shadow border border-yellow-600' 
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        🔆 High Contrast
      </button>
    </div>
  );
}