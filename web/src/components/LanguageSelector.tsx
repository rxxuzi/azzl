import React from 'react';
import { Code } from 'lucide-react';

interface LanguageSelectorProps {
  language: string;
  setLanguage: (language: string) => void;
}

const languages = [
    { id: 'c', label: 'C' },
    { id: 'asm', label: 'Assembly' },
    { id: 'java', label: 'Java' },
    { id: 'python', label: 'Python' },
    { id: 'go', label: 'Go' },
    { id: 'rust', label: 'Rust' },
    { id: 'scala', label: 'Scala' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'typescript', label: 'TypeScript' },
    { id: 'php', label: 'PHP' },
];

export function LanguageSelector({ language, setLanguage }: LanguageSelectorProps) {
  return (
    <div className="relative group w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Code className="w-5 h-5 text-white/50" />
      </div>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="w-full bg-[#1A1A1A] text-white pl-12 pr-4 py-3 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#00D1FF] transition-all appearance-none cursor-pointer hover:bg-[#252525]"
      >
        {languages.map(({ id, label }) => (
          <option key={id} value={id}>
            {label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
        <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}