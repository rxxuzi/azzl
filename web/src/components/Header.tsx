import React from 'react';
import { Menu } from 'lucide-react';
import { ModeSelector } from './ModeSelector';
import { Mode } from '../App';
import { ModelType } from '../types/models';
import { ModelSelector } from './ModelSelector';

interface HeaderProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  model: ModelType;
  setModel: (model: ModelType) => void;
  onMenuClick: () => void;
}

export function Header({ mode, setMode, model, setModel, onMenuClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#111111]/80 backdrop-blur-xl border-b border-white/10 z-40">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <ModelSelector model={model} setModel={setModel} />
        </div>
        <ModeSelector mode={mode} setMode={setMode} />
      </div>
    </header>
  );
}