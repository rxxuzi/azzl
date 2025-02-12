import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Loader2, Code } from 'lucide-react';
import { APP_NAME, Mode } from '../App';
import { FilePreviewModal } from './FilePreviewModal';
import { ModelType } from '../types/models';

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  isLoading: boolean;
  mode: Mode;
  model: ModelType;
  language: string;
  setLanguage: (language: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string;
  className?: string;
  enterToSubmit: boolean;
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

const modeColors = {
  ask: '#FF3DFF',
  code: '#FF8A00',
  docs: '#00FF94',
  fix: '#00D1FF',
};

export function ChatInput({
  input,
  setInput,
  file,
  setFile,
  isLoading,
  mode,
  language,
  setLanguage,
  onSubmit,
  error,
  className = '',
  enterToSubmit,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (enterToSubmit && !e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      } else if (!enterToSubmit && e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(selectedFile);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent pb-3 pt-8 px-4 md:px-0 z-[100] ${className}`}>
        <div className="max-w-4xl mx-auto space-y-2">
          <div 
            className="bg-[#1A1A1A] rounded-2xl shadow-lg transition-all duration-700 overflow-hidden"
            style={{
              boxShadow: isFocused ? `0 0 0 2px ${modeColors[mode]}20, 0 4px 20px ${modeColors[mode]}10` : undefined
            }}
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={enterToSubmit ? "How can AZZL help you today? (Shift + Enter for new line)" : "How can AZZL help you today? (Enter for new line, Shift + Enter to submit)"}
                className="w-full bg-transparent px-6 py-3 resize-none text-white min-h-[46px] placeholder:text-white/30 focus:outline-none focus:ring-0 border-none"
                style={{ maxHeight: '100px', overflowY: 'auto' }}
              />
              <div 
                className="absolute bottom-0 left-0 right-0 h-[2px] transition-transform duration-700 ease-out"
                style={{
                  background: modeColors[mode],
                  transform: `scaleX(${isFocused ? 1 : 0})`,
                  opacity: 0.5
                }}
              />
            </div>
            
            <div className="flex justify-between items-center px-4 py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <label className="p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                  <Paperclip className="w-5 h-5 text-white/50" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".c,.py,.java,.js,.go,.txt,.md,.html,.php,.asm,.tsx,.jsx,.json,.yaml,.csv,.pdf,.docx,.pptx,.xlsx"
                  />
                </label>

                {file && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-sm text-white/70">{file.name}</span>
                  </button>
                )}

                {mode === 'code' && (
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="appearance-none bg-[#252525] text-white/90 text-sm pl-8 pr-3 py-1.5 rounded-lg focus:outline-none hover:bg-[#303030] transition-colors cursor-pointer border border-white/10"
                    >
                      {languages.map(({ id, label }) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                    <Code className="w-4 h-4 text-white/50 absolute left-2 top-1/2 -translate-y-1/2" />
                  </div>
                )}

                {error && <span className="text-sm text-red-500">{error}</span>}
              </div>
              
              <button
                onClick={(e) => onSubmit(e as any)}
                disabled={isLoading}
                className="p-2 bg-gradient-to-r from-[#00D1FF] to-[#FF3DFF] rounded-xl disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-[#00D1FF]/20 hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <p className="text-center text-white/30 text-xs">
            {APP_NAME} may make mistakes. Please double-check responses.
          </p>
        </div>
      </div>

      <FilePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={file}
        content={fileContent}
        onRemove={() => {
          setFile(null);
          setFileContent('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      />
    </>
  );
}