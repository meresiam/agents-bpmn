'use client';

import { memo } from 'react';
import { BpmnTaskKind } from '@/lib/types';

const wrap =
  'pointer-events-none absolute left-2.5 top-2.5 z-[1] flex h-[18px] w-[18px] items-center justify-center text-zinc-700';

/** Marcadores BPMN 2.0 no canto superior interno da tarefa */
export const BpmnTaskMarker = memo(function BpmnTaskMarker({ kind }: { kind?: BpmnTaskKind }) {
  if (!kind || kind === 'task') return null;

  const sw = 1.45;

  switch (kind) {
    case 'userTask':
      return (
        <div className={wrap} title="User Task (BPMN)">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <circle cx="8" cy="5.25" r="2.15" className="stroke-current" strokeWidth={sw} />
            <path
              d="M3.25 13.25c0-2.35 1.85-3.85 4.75-3.85s4.75 1.5 4.75 3.85"
              className="stroke-current"
              strokeWidth={sw}
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case 'serviceTask':
      return (
        <div className={wrap} title="Service Task (BPMN)">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="5" className="stroke-current" strokeWidth={sw} />
            <circle cx="8" cy="8" r="1.85" className="stroke-current" strokeWidth={1.15} />
            <path d="M8 2.5v1.9M8 11.6v1.9M2.5 8h1.9M11.6 8h1.9" className="stroke-current" strokeWidth={1.15} strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'scriptTask':
      return (
        <div className={wrap} title="Script Task (BPMN)">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="1.25" className="stroke-current" strokeWidth={sw} />
            <path d="M4.5 5.5h7M4.5 8h5.5M4.5 10.5h6" className="stroke-current" strokeWidth={1.1} strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'manualTask':
      return (
        <div className={wrap} title="Manual Task (BPMN)">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <path
              d="M8 2.4 L9.85 5.9 L13.6 6.65 L9.85 7.4 L8 10.9 L6.15 7.4 L2.4 6.65 L6.15 5.9 Z"
              className="stroke-current"
              strokeWidth={1.2}
              strokeLinejoin="round"
              fill="white"
            />
          </svg>
        </div>
      );
    case 'sendTask':
      return (
        <div className={wrap} title="Send Task (BPMN)">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <path d="M2.25 3.25h11.5v9.5H2.25z" className="stroke-current" strokeWidth={sw} />
            <path d="M2.25 3.25L8 7.35l5.75-4.1" className="stroke-current" strokeWidth={1.15} strokeLinejoin="round" />
          </svg>
        </div>
      );
    case 'receiveTask':
      return (
        <div className={wrap} title="Receive Task (BPMN)">
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
            <path d="M2.25 3.25h11.5v9.5H2.25z" className="stroke-current" strokeWidth={sw} />
            <circle cx="8" cy="8" r="2" className="stroke-current" strokeWidth={1.15} />
          </svg>
        </div>
      );
    default:
      return null;
  }
});
