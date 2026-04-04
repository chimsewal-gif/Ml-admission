import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-green-800 text-white py-6 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4">
          <p>&copy; {new Date().getFullYear()} MyApp. All rights reserved.</p>
        </div>
        <div className="space-x-4">
          <Link href="/about" className="hover:text-blue-400">About</Link>
          <Link href="/contact" className="hover:text-blue-400">Contact</Link>
          <Link href="/privacy-policy" className="hover:text-blue-400">Privacy Policy</Link>
          <Link href="/terms-of-service" className="hover:text-blue-400">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
