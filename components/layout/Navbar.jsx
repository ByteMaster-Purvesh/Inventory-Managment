import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <Link to="/" className="text-xl font-bold text-slate-800">
              Inspection Report Builder
            </Link>
          </div>
          <div className="flex items-center">
            <span className="text-sm font-medium text-slate-500">ABC Company</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
