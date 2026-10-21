import React from 'react';
import { Link } from 'react-router-dom';
import { Globe } from 'lucide-react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-700 text-white items-center justify-center">
        <div className="max-w-sm text-center px-8">
          <div className="flex items-center justify-center mb-6">
            <Globe className="w-12 h-12 mr-3" />
            <h1 className="text-3xl font-bold">GlobeTrotter</h1>
          </div>
          <h2 className="text-xl font-semibold mb-3">
            Plan Your Perfect Journey
          </h2>
          <p className="text-primary-100 text-base leading-relaxed">
            Create personalized multi-city itineraries, discover amazing destinations, 
            and make your travel dreams come true with our comprehensive planning tools.
          </p>
          <div className="mt-6 text-sm text-primary-200">
            Explore • Plan • Travel
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center">
              <Globe className="w-7 h-7 text-primary-600 mr-2" />
              <span className="text-xl font-semibold text-gray-900">GlobeTrotter</span>
            </Link>
          </div>

          {/* Auth content */}
          <div className="card">
            <div className="card-body">
              {children}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>&copy; 2024 GlobeTrotter. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;