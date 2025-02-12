import React, { useState } from 'react';
import { ModelType, models } from '../types/models';
import { DurianIcon, MangoIcon, GuavaIcon } from './ModelIcons';
import { ChevronDown } from 'lucide-react';
import { APP_NAME } from '../App';

interface ModelSelectorProps {
  model: ModelType;
  setModel: (model: ModelType) => void;
}

export function ModelSelector({ model, setModel }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getModelColor = (modelId: ModelType) => {
    switch (modelId) {
      case 'durian':
        return '#4CAF50';
      case 'mango':
        return '#FFC107';
      case 'guava':
        return '#FF4081';
    }
  };

  const getModelIcon = (modelId: ModelType) => {
    switch (modelId) {
      case 'durian':
        return <DurianIcon className="w-5 h-5" />;
      case 'mango':
        return <MangoIcon className="w-5 h-5" />;
      case 'guava':
        return <GuavaIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <img src="/azzl.svg" alt="AZZL ICON" className="h-6" />
          <span className="text-lg font-bold bg-gradient-to-r from-[#00D1FF] to-[#FF3DFF] bg-clip-text text-transparent">
            {APP_NAME}
          </span>
          {getModelIcon(model)}
          <span className="text-white/90">
            {model.charAt(0).toUpperCase() + model.slice(1)}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1A1A] rounded-xl shadow-lg border border-white/10 overflow-hidden z-50">
            {models.map(({ id, label, description }) => (
              <button
                key={id}
                onClick={() => {
                  setModel(id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 p-4 hover:bg-white/5 transition-colors ${
                  model === id ? 'bg-white/10' : ''
                }`}
              >
                {getModelIcon(id)}
                <div className="text-left">
                  <div className="font-medium" style={{ color: getModelColor(id) }}>
                    {label}
                  </div>
                  <div className="text-sm text-white/50">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}