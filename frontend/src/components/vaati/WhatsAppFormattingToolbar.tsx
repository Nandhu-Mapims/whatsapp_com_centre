import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Terminal,
  List,
  ListOrdered,
  Quote,
} from 'lucide-react';

interface WhatsAppFormattingToolbarProps {
  textareaId: string;
  value: string;
  onChange: (nextValue: string) => void;
}

type FormatAction =
  | { kind: 'wrap'; marker: string; placeholder: string; label: string; title: string; icon: React.ReactNode }
  | { kind: 'line'; prefix: string; placeholder: string; label: string; title: string; icon: React.ReactNode; numbered?: boolean };

const FORMAT_ACTIONS: FormatAction[] = [
  {
    kind: 'wrap',
    marker: '*',
    placeholder: 'bold text',
    label: 'Bold',
    title: 'Bold (*text*)',
    icon: <Bold className="w-3.5 h-3.5" />,
  },
  {
    kind: 'wrap',
    marker: '_',
    placeholder: 'italic text',
    label: 'Italic',
    title: 'Italic (_text_)',
    icon: <Italic className="w-3.5 h-3.5" />,
  },
  {
    kind: 'wrap',
    marker: '~',
    placeholder: 'strikethrough',
    label: 'Strike',
    title: 'Strikethrough (~text~)',
    icon: <Strikethrough className="w-3.5 h-3.5" />,
  },
  {
    kind: 'wrap',
    marker: '```',
    placeholder: 'monospace text',
    label: 'Mono',
    title: 'Monospace (```text```)',
    icon: <Terminal className="w-3.5 h-3.5" />,
  },
  {
    kind: 'wrap',
    marker: '`',
    placeholder: 'code',
    label: 'Code',
    title: 'Inline Code (`text`)',
    icon: <Code className="w-3.5 h-3.5" />,
  },
  {
    kind: 'line',
    prefix: '- ',
    placeholder: 'List item',
    label: 'Bullet List',
    title: 'Bulleted List (- item)',
    icon: <List className="w-3.5 h-3.5" />,
  },
  {
    kind: 'line',
    prefix: '1. ',
    placeholder: 'First item',
    label: 'Numbered',
    title: 'Numbered List (1. item)',
    icon: <ListOrdered className="w-3.5 h-3.5" />,
    numbered: true,
  },
  {
    kind: 'line',
    prefix: '> ',
    placeholder: 'Quoted text',
    label: 'Quote',
    title: 'Quote (> text)',
    icon: <Quote className="w-3.5 h-3.5" />,
  },
];

export const WhatsAppFormattingToolbar: React.FC<WhatsAppFormattingToolbarProps> = ({
  textareaId,
  value,
  onChange,
}) => {
  const applyFormat = (action: FormatAction) => {
    const el = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const selected = value.slice(start, end);

    let replacement = '';
    let selectStart = start;
    let selectEnd = end;

    if (action.kind === 'wrap') {
      const m = action.marker;
      const inner = selected || action.placeholder;
      // Trim outer spaces outside markers so WhatsApp renders styles properly
      const leadingSpaces = inner.match(/^\s*/)?.[0] || '';
      const trailingSpaces = inner.match(/\s*$/)?.[0] || '';
      const core = inner.trim() || action.placeholder;
      replacement = `${leadingSpaces}${m}${core}${m}${trailingSpaces}`;
      selectStart = start + leadingSpaces.length + m.length;
      selectEnd = selectStart + core.length;
    } else {
      const textToFormat = selected || action.placeholder;
      const lines = textToFormat.split('\n');
      const formattedLines = lines.map((line, i) =>
        action.numbered ? `${i + 1}. ${line}` : `${action.prefix}${line}`
      );
      const needsNewlineBefore = start > 0 && value[start - 1] !== '\n' && !selected;
      replacement = (needsNewlineBefore ? '\n' : '') + formattedLines.join('\n');
      selectStart = start + (needsNewlineBefore ? 1 : 0) + (action.numbered ? 3 : action.prefix.length);
      selectEnd = start + replacement.length;
    }

    const nextValue = value.slice(0, start) + replacement + value.slice(end);
    onChange(nextValue);

    setTimeout(() => {
      if (el) {
        el.focus();
        el.setSelectionRange(selectStart, selectEnd);
      }
    }, 20);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 mb-2">
      {FORMAT_ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          title={action.title}
          onClick={() => applyFormat(action)}
          className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
};

/**
 * Renders WhatsApp inline formatting (*bold*, _italic_, ~strike~, ```mono```, `code`, > quote)
 * for accurate Smartphone Preview display.
 */
function renderInlineStyles(text: string): React.ReactNode[] {
  const tokenRegex = /(```[\s\S]+?```|`[^`\n]+`|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('```') && token.endsWith('```')) {
      parts.push(
        <code key={keyIdx++} className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
          {token.slice(3, -3)}
        </code>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={keyIdx++} className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded text-rose-700">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <strong key={keyIdx++} className="font-bold text-slate-900">
          {token.slice(1, -1)}
        </strong>
      );
    } else if (token.startsWith('_') && token.endsWith('_')) {
      parts.push(
        <em key={keyIdx++} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('~') && token.endsWith('~')) {
      parts.push(
        <del key={keyIdx++} className="line-through text-slate-500">
          {token.slice(1, -1)}
        </del>
      );
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

export const WhatsAppFormattedText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.startsWith('> ')) {
          return (
            <div
              key={i}
              className="pl-2.5 py-0.5 border-l-3 border-emerald-500 bg-emerald-50/50 text-slate-700 rounded-r text-xs"
            >
              {renderInlineStyles(line.slice(2))}
            </div>
          );
        }
        if (line === '') {
          return <div key={i} className="h-2" />;
        }
        return <div key={i}>{renderInlineStyles(line)}</div>;
      })}
    </div>
  );
};

