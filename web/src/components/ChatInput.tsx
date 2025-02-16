"use client"

import React, { useRef, useEffect, useState } from "react";
import { Send, Paperclip, Loader2, Code, AlertCircle, X } from "lucide-react";
import { APP_NAME, Mode } from "../App";
import { FilePreviewModal } from "./FilePreviewModal";
import { ModelType } from "../types/models";

interface ChatInputProps {
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  mode: Mode;
  model: ModelType;
  language: string;
  setLanguage: (language: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string;
  className?: string;
  enterToSubmit: boolean;
  file: File | null;
  setFile: (file: File | null) => void;
}

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const PREVIEW_FILE_SIZE_LIMIT = 1 * 1024 * 1024; // 1MBまでプレビュー可能

const languages = [
  { id: "c", label: "C" },
  { id: "asm", label: "Assembly" },
  { id: "java", label: "Java" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "scala", label: "Scala" },
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "php", label: "PHP" },
];

const modeColors = {
  ask: "#FF3DFF",
  code: "#FF8A00",
  docs: "#00FF94",
  deep: "#00D1FF",
};

export function ChatInput({
  input,
  setInput,
  isLoading,
  mode,
  model,
  language,
  setLanguage,
  onSubmit,
  error,
  className = "",
  enterToSubmit,
  file,
  setFile,
}: ChatInputProps) {
  const [fileContent, setFileContent] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // .goなどテキストファイルかどうか判定
  const isTextFile = (fileName: string): boolean => {
    const textExtensions = [
      "txt", "js", "ts", "py", "go", "java", "cpp", "c", "rs",
      "md", "html", "php", "json", "yaml", "yml", "xml", "css", "scss", "sql"
    ];
    const ext = fileName.split(".").pop()?.toLowerCase();
    return textExtensions.includes(ext || "");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (enterToSubmit && !e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      } else if (!enterToSubmit && e.shiftKey) {
        e.preventDefault();
        onSubmit(e);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
      return false;
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!validateFile(selectedFile)) {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      setFile(selectedFile);
      setFileError(null);
      if (isTextFile(selectedFile.name) && selectedFile.size < PREVIEW_FILE_SIZE_LIMIT) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFileContent(e.target?.result as string);
        };
        reader.readAsText(selectedFile);
      } else {
        setFileContent("");
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [input]);

  return (
    <>
      <div className={`fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent pb-6 pt-12 px-4 md:px-0 z-[20] ${className}`}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div 
            className="bg-[#0D0D0D] rounded-2xl shadow-2xl transition-all duration-700 overflow-hidden border border-white/5"
            style={{
              boxShadow: isFocused 
                ? `0 0 0 2px ${modeColors[mode]}20, 0 8px 32px rgba(0,0,0,0.4), 0 4px 24px ${modeColors[mode]}15` 
                : "0 8px 32px rgba(0,0,0,0.4)"
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
                placeholder="How can AZZL help you today?"
                className="w-full bg-transparent px-6 py-4 resize-none text-white/90 min-h-[46px] placeholder:text-white/30 focus:outline-none focus:ring-0 border-none text-[15px]"
                style={{ maxHeight: "100px", overflowY: "auto" }}
              />
            </div>

            <div className="flex justify-between items-center px-4 py-2 border-t border-white/[0.03] bg-black/20">
              <div className="flex items-center gap-2">
                {mode !== "deep" && (
                  <label className="p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                    <Paperclip className="w-5 h-5 text-white/40 hover:text-white/60 transition-colors" />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".c,.py,.java,.js,.go,.txt,.md,.html,.php,.asm,.tsx,.jsx,.json,.yaml,.csv,.pdf,.docx,.pptx,.xlsx"
                    />
                  </label>
                )}

                {mode === "code" && (
                  <div className="relative">
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="appearance-none bg-[#151515] text-white/80 text-sm pl-8 pr-3 py-1.5 rounded-lg focus:outline-none hover:bg-[#1A1A1A] transition-colors cursor-pointer border border-white/[0.06]"
                    >
                      {languages.map(({ id, label }) => (
                        <option key={id} value={id}>{label}</option>
                      ))}
                    </select>
                    <Code className="w-4 h-4 text-white/40 absolute left-2 top-1/2 -translate-y-1/2" />
                  </div>
                )}

                {file && mode !== "deep" && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg hover:bg-white/[0.06] transition-colors"
                  >
                    <span className="text-sm text-white/60">{file.name}</span>
                    <X
                      className="w-4 h-4 text-white/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setFileContent("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    />
                  </button>
                )}
              </div>

              <button
                onClick={(e) => onSubmit(e)}
                disabled={isLoading}
                className="p-2.5 bg-gradient-to-r rounded-xl disabled:opacity-50 transition-all"
                style={{
                  background: isLoading 
                    ? '#1A1A1A'
                    : `linear-gradient(135deg, ${modeColors[mode]}, ${modeColors[mode]}90)`
                }}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <FilePreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={file}
        content={
          file && isTextFile(file.name)
            ? fileContent
            : file && file.size < PREVIEW_FILE_SIZE_LIMIT
            ? "プレビュー可能"
            : "ファイルが大きすぎます"
        }
        onRemove={() => {
          setFile(null);
          setFileContent("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
      />
    </>
  );
}
