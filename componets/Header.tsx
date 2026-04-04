import React from 'react'

const Header = () => {
  return (
     <header className="bg-mzuni-blue text-white py-6 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-green-900 font-bold">Mzuzu University Application System</h1>
          <nav className="space-x-4">
            <a href="/apply" className=" text-gray-500  hover:underline">Apply</a>
            <a href="/status" className=" text-gray-500 hover:underline">Check Status</a>
            <a href="/contact" className=" text-gray-500  hover:underline">Contact</a>
          </nav>
        </div>
      </header>

  )
}

export default Header;