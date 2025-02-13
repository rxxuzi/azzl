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
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 ${
              mode === id
                ? 'bg-[#0D0D0D] shadow-lg border border-white/[0.03]'
                : 'bg-transparent hover:bg-[#0D0D0D] border border-transparent'
            }`}
            style={{
              boxShadow: mode === id ? `0 4px 24px ${color}15` : undefined,
            }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
            <span 
              className={`transition-colors ${
                mode === id ? 'text-white/90' : 'text-white/60'
              }`}
              style={{ color: mode === id ? color : undefined }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Mobile view */}
      <div className="md:hidden relative">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 hover:bg-[#0D0D0D] rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {isMenuOpen && (
          <>
            <div
              className="fixed inset-0"
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="absolute right-0 top-12 bg-[#0D0D0D] rounded-xl shadow-2xl border border-white/[0.03] overflow-hidden w-48">
              {modes.map(({ id, icon: Icon, color, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setMode(id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    mode === id
                      ? 'bg-black/20'
                      : 'hover:bg-black/20'
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