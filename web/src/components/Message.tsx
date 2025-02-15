import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { submitEvaluation } from '../utils/evaluation';
import { getBrowserId } from '../utils/browserId';
import { ModelType } from '../types/models';
import { Mode } from '../App';

interface MessageProps {
  message: {
    role: 'user' | 'assistant';
    content: string;
    mode: string;
  };
  onRegenerate?: () => void;
  question?: string;
  model: ModelType;
  mode: Mode;
}

export function Message({ message, onRegenerate, question, model, mode }: MessageProps) {
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
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedBlock(code);
        setTimeout(() => setCopiedBlock(null), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyRaw = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      const textArea = document.createElement('textarea');
      textArea.value = message.content;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleFeedback = async (type: 'good' | 'bad') => {
    if (feedback === type || isSubmitting || message.role !== 'assistant') return;
  
    setIsSubmitting(true);
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19); // "YYYY-MM-DDTHH:mm:ss"
  
    const evaluationData = {
      q: question || '',
      a: message.content,
      t: timestamp,
      i: getBrowserId(),
      m: model,
      mode: message.mode || '?'
    };
  
    const success = await submitEvaluation(type, evaluationData);
  
    if (success) {
      setFeedback(type);
    }
    setIsSubmitting(false);
  };


  const processContent = (content: string) => {
    const segments = [];
    let currentIndex = 0;

    const mathPatterns = [
      { start: '\\[', end: '\\]', display: true },
      { start: '\\(', end: '\\)', display: false },
      { start: '$$', end: '$$', display: true },
      { start: '$', end: '$', display: false }
    ];

    while (currentIndex < content.length) {
      let nextMathStart = -1;
      let matchedPattern = null;

      for (const pattern of mathPatterns) {
        const startIndex = content.indexOf(pattern.start, currentIndex);
        if (startIndex !== -1 && (nextMathStart === -1 || startIndex < nextMathStart)) {
          nextMathStart = startIndex;
          matchedPattern = pattern;
        }
      }

      if (nextMathStart === -1) {
        segments.push({ type: 'text', content: content.slice(currentIndex) });
        break;
      }

      if (nextMathStart > currentIndex) {
        segments.push({ type: 'text', content: content.slice(currentIndex, nextMathStart) });
      }

      const startDelimiterLength = matchedPattern!.start.length;
      const endIndex = content.indexOf(matchedPattern!.end, nextMathStart + startDelimiterLength);

      if (endIndex === -1) {
        segments.push({ type: 'text', content: content.slice(nextMathStart) });
        break;
      }

      const mathContent = content.slice(nextMathStart + startDelimiterLength, endIndex);
      segments.push({
        type: 'math',
        content: mathContent,
        display: matchedPattern!.display
      });

      currentIndex = endIndex + matchedPattern!.end.length;
    }

    return segments;
  };

  return (
    <div className={`group p-6 rounded-2xl shadow-lg transition-all duration-300 ${
      message.role === 'user'
        ? 'ml-4 md:ml-12 bg-gradient-to-r from-[#0A1A3D] to-[#0D0D0D] border border-[#1E3A8A]/10'
        : 'mr-4 md:mr-12 bg-[#0D0D0D] border border-white/[0.03]'
    }`}>
      <div className="prose prose-invert max-w-none markdown-content">
        {processContent(message.content).map((segment, index) => (
          <React.Fragment key={index}>
            {segment.type === 'text' ? (
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex, rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const code = String(children).replace(/\n$/, '');

                    return !inline && match ? (
                      <div className="relative my-6 first:mt-0 last:mb-0 overflow-hidden rounded-xl border border-white/[0.03]">
                        <div className="absolute top-0 right-0 left-0 h-12 bg-black/40 border-b border-white/[0.03] flex items-center justify-between px-4">
                          <span className="text-sm text-white/40 font-mono">{match[1]}</span>
                          <button
                            onClick={() => handleCopyCode(code)}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                          >
                            {copiedBlock === code ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-white/40" />
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="!mt-0 !bg-black/20 !p-4 !pt-16"
                          customStyle={{
                            margin: 0,
                            background: '#0A0A0A',
                          }}
                          {...props}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className="bg-black/40 rounded px-1.5 py-0.5 font-mono text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {segment.content}
              </ReactMarkdown>
            ) : (
              segment.display ? (
                <div className="my-4 text-center">
                  <span
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(segment.content, {
                        displayMode: true,
                        throwOnError: false,
                      }),
                    }}
                  />
                </div>
              ) : (
                <span
                  className="inline-block"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(segment.content, {
                      displayMode: false,
                      throwOnError: false,
                    }),
                  }}
                />
              )
            )}
          </React.Fragment>
        ))}
      </div>

      {message.role === 'assistant' && (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => handleFeedback('good')}
            disabled={isSubmitting}
            className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${
              feedback === 'good' ? 'text-[#00FF94] bg-white/5' : 'text-white/40 hover:text-[#00FF94]'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Good response"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback('bad')}
            disabled={isSubmitting}
            className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${
              feedback === 'bad' ? 'text-[#FF3DFF] bg-white/5' : 'text-white/40 hover:text-[#FF3DFF]'
            } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Bad response"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyRaw}
            className={`p-2 hover:bg-white/5 rounded-lg transition-colors ${
              copied ? 'text-[#00D1FF] bg-white/5' : 'text-white/40 hover:text-[#00D1FF]'
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