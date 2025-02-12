import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  language: string;
  code: string;
  copiedBlock: string | null;
  onCopy: (code: string) => void;
}

export function CodeBlock({ language, code, copiedBlock, onCopy }: CodeBlockProps) {
  return (
    <div className="relative">
      <div className="sticky top-0 right-0 left-0 h-12 bg-[#1E1E1E] border-b border-white/10 rounded-t-xl flex items-center justify-between px-4">
        <span className="text-sm text-white/50 font-mono">{language || 'plaintext'}</span>
        <button
          onClick={() => onCopy(code)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {copiedBlock === code ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-white/50" />
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={language || 'plaintext'}
        PreTag="div"
        className="rounded-xl !mt-0 !bg-[#1E1E1E] !p-4 !pt-16"
        customStyle={{
          margin: 0,
          borderRadius: '0.75rem',
          background: '#1E1E1E',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}