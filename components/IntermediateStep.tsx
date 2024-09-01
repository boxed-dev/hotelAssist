import { useState } from "react";
import type { Message } from "ai/react";
import { ChevronDown, ChevronUp } from 'react-feather';

export function IntermediateStep(props: { message: Message }) {
  const parsedInput = JSON.parse(props.message.content);
  const { action, observation } = parsedInput;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-auto bg-gray-700 rounded-lg px-4 py-2 max-w-[80%] mb-4 text-gray-200">
      <div 
        className="flex justify-between items-center cursor-pointer" 
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-semibold">{action.name}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
      {expanded && (
        <div className="mt-2 text-sm">
          <div className="bg-gray-600 rounded p-3 mb-2">
            <h4 className="font-semibold mb-1">Tool Input:</h4>
            <pre className="whitespace-pre-wrap overflow-auto max-h-[100px]">
              {JSON.stringify(action.args, null, 2)}
            </pre>
          </div>
          <div className="bg-gray-600 rounded p-3">
            <h4 className="font-semibold mb-1">Observation:</h4>
            <pre className="whitespace-pre-wrap overflow-auto max-h-[260px]">
              {observation}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}