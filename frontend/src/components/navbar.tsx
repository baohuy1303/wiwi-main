// src/components/navbar.tsx

import { useState, useEffect } from 'react';
import { Button } from "@heroui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes, faTicketAlt } from "@fortawesome/free-solid-svg-icons";
import { Link, useLocation } from "react-router-dom"; 
import { useUser } from '@/UserContext';
import { UserDropdown } from './UserDropdown'; // Make sure this path is correct

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user, logout } = useUser();
  const { pathname } = useLocation(); // Hook to get the current page URL

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse Draws" },
    { href: "/buytickets", label: "Buy Tickets" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        hasScrolled 
          ? 'shadow-lg border-slate-800 bg-black/50' 
          : 'border-transparent bg-black/20'
      } backdrop-blur-xl`}
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-24">
          
          {/* Logo */}
          <div className="flex-shrink-0 z-10">
            <Link to="/" className="text-white text-3xl font-bold tracking-tight">
              WI<span className="text-primary">WI</span>
            </Link>
          </div>

          {/* Desktop Navigation Links - Absolutely Centered */}
          <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-baseline space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.label === "Buy Tickets" && !user) {
                return null; // Don't render the link if user is not logged in
              } else
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`relative text-base font-semibold transition-colors duration-300 group ${
                      isActive ? 'text-primary' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                  {/* Animated underline */}
                  <span className={`absolute bottom-[-6px] left-0 w-full h-0.5 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out ${
                      isActive ? 'scale-x-100' : ''
                  }`}></span>
                </Link>
              )
            })}
          </div>

          {/* Auth Buttons / User Dropdown */}
          <div className="hidden md:block z-10">
            {user ? (
              <div className="flex items-center gap-10">
                <UserDropdown user={user} logout={logout} />
                <p className="text-gray-300 text-sm"><FontAwesomeIcon icon={faTicketAlt} /> {user.ticketBalance}</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="text-white font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button color="primary" variant="solid" className="font-semibold">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white focus:outline-none"
            >
              <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="text-gray-300 hover:bg-slate-800/50 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 pb-2 border-t border-slate-700 px-2">
                {user ? (
                    <Button variant="bordered" className="text-white w-full" onClick={logout}>Logout</Button>
                ) : (
                    <div className="flex flex-col gap-2">
                        <Link to="/login">
                            <Button variant="bordered" className="text-white w-full">Sign In</Button>
                        </Link>
                        <Link to="/signup">
                            <Button color="primary" variant="solid" className="w-full">Sign Up</Button>
                        </Link>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};