'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Topbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo or Brand */}
        <Link href="/" className="text-xl font-bold text-green-600">
          MyApp
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-green-700 font-bold hover:text-green-500">Home</Link>
          <Link href="/about" className="text-green-700 font-bold hover:text-green-500">About</Link>
          <Link href="/contact" className="text-green-700 font-bold hover:text-green-700">Contact</Link>
        </nav>

        {/* Mobile menu toggle */}
        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-green-700">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <nav className="md:hidden bg-white px-4 pb-4">
          <Link href="/" className="text-green-700 font-bold block py-2 border-b">Home</Link>
          <Link href="/about" className="text-green-700 font-bold block py-2 border-b">About</Link>
          <Link href="/contact" className="text-green-700 font-bold block py-2 border-b">Contact</Link>
        </nav>
      )}
    </header>
  );
}
