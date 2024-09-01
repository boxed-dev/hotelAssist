import type { Message } from "ai/react";
import ReactMarkdown from 'react-markdown';

export function ChatMessageBubble(props: { message: Message, sources: any[] }) {
  const isUser = props.message.role === "user";
  const colorClassName = isUser ? "bg-black text-gray-200" : "bg-transparent text-gray-100";
  const alignmentClassName = isUser ? "ml-auto" : "mr-auto";

  return (
    <div className={`${alignmentClassName} ${colorClassName} rounded-lg px-4 py-2 max-w-[80%] mb-4`}>
      <div className="flex flex-col">
        <ReactMarkdown className="prose prose-sm max-w-none">
          {props.message.content}
        </ReactMarkdown>
        {props.sources && props.sources.length > 0 && (
          <div className="mt-2">
            <details className="text-xs">
              <summary className="font-semibold cursor-pointer">Sources</summary>
              <ul className="mt-2 list-disc list-inside">
                {props.sources.map((source, i) => (
                  <li key={`source:${i}`} className="mb-1">
                    &quot;{source.pageContent}&quot;
                    {source.metadata?.loc?.lines && (
                      <span className="text-gray-500">
                        (Lines {source.metadata.loc.lines.from} to {source.metadata.loc.lines.to})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}