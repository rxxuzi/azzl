import React, { useState } from 'react';
import { X, FileText, Download } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: File | null;
  content: string;
  onRemove: () => void;
}

export function FilePreviewModal({ isOpen, onClose, file, content, onRemove }: FilePreviewModalProps) {
  const [numPages, setNumPages] = useState<number>(1);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

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
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      css: 'css',
      scss: 'scss',
      sql: 'sql',
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

  const isTextFile = (fileName: string): boolean => {
    const textExtensions = [
      'txt', 'js', 'ts', 'py', 'go', 'java', 'cpp', 'c', 'rs', 'md',
      'html', 'php', 'json', 'yaml', 'yml', 'xml', 'css', 'scss', 'sql'
    ];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return textExtensions.includes(ext || '');
  };

  const isPDF = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const isOfficeFile = (fileName: string): boolean => {
    const officeExtensions = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return officeExtensions.includes(ext || '');
  };

  const renderPreview = () => {
    if (isPDF(file.name)) {
      return (
        <div className="h-full flex flex-col">
          <Document
            file={file}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setError('Failed to load PDF')}
            className="flex-1 overflow-auto"
          >
            <Page 
              pageNumber={pageNumber} 
              className="mx-auto"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-4 border-t border-white/[0.03] bg-black/20">
              <button
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-white/60">
                Page {pageNumber} of {numPages}
              </span>
              <button
                onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                disabled={pageNumber >= numPages}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      );
    }

    if (isTextFile(file.name)) {
      return (
        <SyntaxHighlighter
          language={getLanguage(file.name)}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: '0.75rem',
            background: '#0A0A0A',
            padding: '1.5rem',
          }}
        >
          {content}
        </SyntaxHighlighter>
      );
    }

    if (isOfficeFile(file.name)) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-16 h-16 text-white/20 mb-4" />
          <p className="text-white/60 mb-6">
            Preview not available for Office documents.
            <br />
            Please download the file to view its contents.
          </p>
          <a
            href={URL.createObjectURL(file)}
            download={file.name}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download {file.name}
          </a>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="w-16 h-16 text-white/20 mb-4" />
        <p className="text-white/60">
          Preview not available for this file type
        </p>
      </div>
    );
  };

  const closeModalOnOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // モーダル内のクリックを防ぐ（子要素まで伝播するのを阻止）
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[200]" 
      onClick={closeModalOnOutsideClick} // 背景をクリックしたらモーダルを閉じる
    >
      <div 
        className="bg-[#0D0D0D] rounded-2xl w-full max-w-4xl h-[80vh] overflow-hidden shadow-2xl border border-white/[0.03]"
        onClick={(e) => e.stopPropagation()} // モーダル内のクリックは伝播を止める
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.03] bg-black/20">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-medium text-white/90">
              {file.name}
            </h3>
            <span className="text-sm text-white/40">
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
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
        <div className="overflow-auto h-[calc(80vh-73px)]">
          {error ? (
            <div className="flex items-center justify-center h-full text-red-400">
              {error}
            </div>
          ) : (
            renderPreview()
          )}
        </div>
      </div>
    </div>
  );
}
