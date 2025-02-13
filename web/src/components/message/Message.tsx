import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, ThumbsUp, ThumbsDown, Flag } from 'lucide-react';
import { submitEvaluation } from '../utils/evaluation';
import { getBrowserId } from '../utils/browserId';
import { ModelType } from '../types/models';

interface MessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
  onRegenerate?: () => void;
  question?: string;
  model: ModelType;
}

export function Message({ message, onRegenerate, question, model }: MessageProps) {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedBlock(code);
      setTimeout(() => setCopiedBlock(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFeedback = async (type: 'good' | 'bad') => {
    if (feedback === type || isSubmitting || message.role !== 'assistant') return;

    setIsSubmitting(true);
    const success = await submitEvaluation(type, {
      q: question || '',
      a: message.content,
      t: Math.floor(Date.now() / 1000),
      i: getBrowserId(),
      m: model,
    });

    if (success) {
      setFeedback(type);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg transition-all duration-200 ${
      message.role === 'user' ? 'ml-4 md:ml-12 bg-gray-800/50 border border-gray-600/50' : 'mr-4 md:mr-12 bg-[#111] border border-white/10'
    }`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
      >
        {message.content}
      </ReactMarkdown>

      {message.role === 'assistant' && (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => handleFeedback('good')}
            disabled={isSubmitting}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
              feedback === 'good' ? 'text-[ #00FF94] bg-white/10' : 'text-white/70 hover:text-[ #00FF94]'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback('bad')}
            disabled={isSubmitting}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
              feedback === 'bad' ? 'text-[#FF3DFF] bg-white/10' : 'text-white/70 hover:text-[#FF3DFF]'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyRaw}
            className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
              copied ? 'text-[#00D1FF] bg-white/10' : 'text-white/70 hover:text-[#00D1FF]'
            }`}
            title={copied ? 'Copied!' : 'Copy raw markdown'}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}