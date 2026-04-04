'use client';

import { useEffect, useState } from 'react';

const images = [
  '/images/mzuni.png',
  '/images/mzuni1.jpeg',
  '/images/mzuni3.jpeg',
];


export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col justify-between text-white overflow-hidden">
      {/* Background Image Layer */}
     <div
  className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 filter blur-sm"
  style={{
    backgroundImage: `url(${images[currentImageIndex]})`,
    zIndex: -1,
  }}
/>


      {/* Overlay */}
      <div className="absolute inset-0  bg-opacity-50 z-0" />

      <section className="flex-grow container mx-auto px-4 py-20 text-center z-10">
        <h2 className="text-4xl font-semibold  text-green-900 font-bold mb-4">Welcome to Mzuni cleaning services management system</h2>
        <p className="text-lg mb-8  text-green-900 font-bold">where the cleaning services for mzuzu university are managed,monitored, sechuled, etc are scheduled with ease
          </p>
        <div className="space-x-4">
          <a href="/login" className="bg-mzuni-green hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow">
            Your account
          </a>
          <a href="/status" className=" hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow">
            Check Status
          </a>
        </div>
      </section>

    </main>
  );
}
