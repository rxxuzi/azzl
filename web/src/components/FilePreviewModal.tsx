import React from 'react';
import { X } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  content: string;
  onRemove: () => void;
}

export function FilePreviewModal({ isOpen, onClose, file, content, onRemove }: FilePreviewModalProps) {
  if (!isOpen || !file) return null;

  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      rs: 'rust',
      txt: 'text',
      md: 'markdown',
      html: 'html',
      php: 'php',
    };
    return languageMap[ext || ''] || 'text';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-white">
              {file.name}
            </h3>
            <span className="text-sm text-white/50">
              {formatFileSize(file.size)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRemove}
              className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
            >
              Remove
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-auto max-h-[calc(80vh-80px)]">
          <SyntaxHighlighter
            language={getLanguage(file.name)}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              borderRadius: '0.75rem',
              background: '#0D0D0D',
            }}
          >
            {content}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}