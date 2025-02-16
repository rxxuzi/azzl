import React from 'react';
import { X, Shield, HelpCircle, FileText, Trash2, ToggleLeft, ToggleRight, Sun, Moon } from 'lucide-react';
import { APP_NAME, VERSION } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanup: () => void;
  enterToSubmit: boolean;
  onEnterToSubmitChange: (value: boolean) => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}

const menuItems = [
  { icon: HelpCircle, label: 'Help', path: '/help' },
  { icon: Shield, label: 'Security', path: '/security' },
  { icon: FileText, label: 'License', path: '/license' },
];

export function Sidebar({
  isOpen,
  onClose,
  onCleanup,
  enterToSubmit,
  onEnterToSubmitChange,
  theme,
  onThemeChange
}: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-50 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-[#111111] border-r border-white/10 p-6 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold text-white">{APP_NAME} Menu</h2>
            <p className="text-white/30 text-sm">Version {VERSION}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="px-4 py-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Enter to Submit</h3>
                  <p className="text-xs text-white/50">
                    {enterToSubmit ? 'Press Shift + Enter for new line' : 'Press Enter for new line'}
                  </p>
                </div>
                <button
                  onClick={() => onEnterToSubmitChange(!enterToSubmit)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {enterToSubmit ? (
                    <ToggleRight className="w-6 h-6 text-[#00D1FF]" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            <div className="px-4 py-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Theme</h3>
                  <p className="text-xs text-white/50">
                    {theme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled'}
                  </p>
                </div>
                <button
                  onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {theme === 'dark' ? (
                    <Moon className="w-6 h-6 text-[#00D1FF]" />
                  ) : (
                    <Sun className="w-6 h-6 text-[#FF8A00]" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map(({ icon: Icon, label, path }) => (
              <a
                key={path}
                href={path}
                className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </a>
            ))}
            <button
              onClick={onCleanup}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>Cleanup Chat</span>
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}