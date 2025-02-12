import React, { useState } from 'react';
import { Brain, Code, FileText, FileQuestion, Menu } from 'lucide-react';
import { Mode } from '../App';

const modes = [
  { id: 'ask' as Mode, icon: Brain, color: '#FF3DFF', label: 'Ask' },
  { id: 'code' as Mode, icon: Code, color: '#FF8A00', label: 'Code' },
  { id: 'docs' as Mode, icon: FileText, color: '#00FF94', label: 'Docs' },
  { id: 'fix' as Mode, icon: FileQuestion, color: '#00D1FF', label: 'Fix' },
];

interface ModeSelectorProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
}

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop view */}
      <div className="hidden md:flex gap-2">
        {modes.map(({ id, icon: Icon, color, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              mode === id
                ? 'bg-white/10 shadow-lg'
                : 'bg-transparent hover:bg-white/5'
            }`}
            style={{
              boxShadow: mode === id ? `0 4px 20px ${color}20` : undefined,
            }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
            <span style={{ color }}>{label}</span>
          </button>
        ))}
      </div>

      {/* Mobile view */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 top-12 bg-[#1A1A1A] rounded-xl shadow-lg border border-white/10 overflow-hidden w-48">
              {modes.map(({ id, icon: Icon, color, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    mode === id
                      ? 'bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span style={{ color }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}