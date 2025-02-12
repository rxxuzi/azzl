import React from 'react';
import { ThumbsUp, ThumbsDown, Flag, Copy, Check } from 'lucide-react';

interface MessageActionsProps {
  feedback: 'good' | 'bad' | null;
  isSubmitting: boolean;
  copied: boolean;
  onFeedback: (type: 'good' | 'bad') => void;
  onReport: () => void;
  onCopyRaw: () => void;
}

export function MessageActions({
  feedback,
  isSubmitting,
  copied,
  onFeedback,
  onReport,
  onCopyRaw,
}: MessageActionsProps) {
  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => onFeedback('good')}
        disabled={isSubmitting}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          feedback === 'good' ? 'text-[ #04ff00] bg-white/10' : 'text-white/70 hover:text-[ #04ff00]'
        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Good response"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => onFeedback('bad')}
        disabled={isSubmitting}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          feedback === 'bad' ? 'text-[ #ff3d3d] bg-white/10' : 'text-white/70 hover:text-[ #ff3d3d]'
        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Bad response"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
      <button
        onClick={onReport}
        disabled={isSubmitting}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-[#FF8A00] ${
          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Report response"
      >
        <Flag className="w-4 h-4" />
      </button>
      <button
        onClick={onCopyRaw}
        className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
          copied ? 'text-[ #00D1FF] bg-white/10' : 'text-white/70 hover:text-[ #00D1FF]'
        }`}
        title={copied ? 'Copied!' : 'Copy raw markdown'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}