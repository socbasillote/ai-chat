import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface MarkdownMessageProps {
  content: string;
}

export const MarkdownMessage = ({ content }: MarkdownMessageProps) => {
  return (
    <div className="break-words [&_a]:break-words [&_a]:text-violet-700 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-500 [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:overflow-x-auto [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-zinc-200 [&_td]:p-2 [&_th]:border [&_th]:border-zinc-200 [&_th]:bg-zinc-50 [&_th]:p-2 [&_th]:text-left [&_th]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-zinc-100 [&_:not(pre)>code]:px-1 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-violet-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className ?? "");

            const code = String(children).replace(/\n$/, "");

            const isBlock = Boolean(match) || String(children).includes("\n");

            if (!isBlock) {
              return (
                <code
                  className={`rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.9em] text-violet-700 ${className ?? ""}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return <CodeBlock language={match?.[1]} code={code} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

interface CodeBlockProps {
  language?: string;
  code: string;
}

const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-2">
        <span className="text-[11px] font-semibold lowercase tracking-wide text-zinc-500">
          {language ?? "code"}
        </span>

        <button
          type="button"
          className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50"
          onClick={handleCopy}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre className="m-0 overflow-x-auto p-4 text-xs leading-6">
        <code
          className={`bg-transparent p-0 font-mono [&_.hljs-built_in]:text-cyan-700 [&_.hljs-comment]:text-zinc-400 [&_.hljs-keyword]:text-violet-700 [&_.hljs-literal]:text-orange-700 [&_.hljs-meta]:text-zinc-500 [&_.hljs-number]:text-amber-700 [&_.hljs-string]:text-emerald-700 [&_.hljs-title]:text-sky-700 ${language ? `language-${language}` : ""}`}
        >
          {code}
        </code>
      </pre>
    </div>
  );
};
