import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, UserCircle } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 shrink-0">
      <div className="px-4 py-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/20 p-1.5 rounded-md">
              <FileText className="h-5 w-5 text-orange-500" />
            </div>
            <Link to="/" className="text-sm font-semibold text-zinc-100 tracking-wide">
              Inspection Report Builder
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-zinc-400">ABC Company</span>
            </div>
            <div className="w-px h-4 bg-zinc-800"></div>
            <button className="text-zinc-400 hover:text-zinc-200 transition-colors">
              <UserCircle size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
