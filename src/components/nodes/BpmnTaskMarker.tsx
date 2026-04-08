'use client';

import { memo } from 'react';
import { BpmnTaskKind } from '@/lib/types';

/** Marcadores BPMN 2.0 no canto da tarefa (Task, User Task, Service Task, etc.) */
export const BpmnTaskMarker = memo(function BpmnTaskMarker({ kind }: { kind?: BpmnTaskKind }) {
  if (!kind || kind === 'task') return null;

  const box = 'w-[14px] h-[14px] flex items-center justify-center flex-shrink-0 text-zinc-800';

  switch (kind) {
    case 'userTask':
      return (
        <div className={`${box} absolute -top-1 -left-1`} title="User Task (BPMN)">
          <svg viewBox="0 0 16 16" width="14" height="14" className="text-zinc-800">
            <circle cx="8" cy="5" r="2.5" className="fill-none stroke-current" strokeWidth="1.2" />
            <path
              d="M3 14c0-3 2.5-4.5 5-4.5s5 1.5 5 4.5"
              className="fill-none stroke-current"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );
    case 'serviceTask':
      return (
        <div className={`${box} absolute -top-1 -left-1`} title="Service Task (BPMN)">
          <svg viewBox="0 0 16 16" width="14" height="14" className="text-zinc-800">
            <circle cx="8" cy="8" r="5.5" className="fill-none stroke-current" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2" className="fill-none stroke-current" strokeWidth="1" />
            <path d="M8 2v2M8 12v2M2 8h2M12 8h2" className="stroke-current" strokeWidth="1" />
          </svg>
        </div>
      );
    case 'scriptTask':
      return (
        <div className={`${box} absolute -top-1 -left-1`} title="Script Task (BPMN)">
          <svg viewBox="0 0 16 16" width="14" height="14" className="text-zinc-800">
            <rect x="2" y="2" width="12" height="12" rx="1" className="fill-none stroke-current" strokeWidth="1.2" />
            <path d="M4 5h8M4 8h6M4 11h7" className="stroke-current" strokeWidth="1" />
          </svg>
        </div>
      );
    case 'manualTask':
      return (
        <div className={`${box} absolute -top-1 -left-1`} title="Manual Task (BPMN)">
          <svg viewBox="0 0 16 16" width="14" height="14" className="text-zinc-800">
            <path
              d="M8 2 L10 6 L14 7 L10 8 L8 12 L6 8 L2 7 L6 6 Z"
              className="stroke-current"
              strokeWidth="1.1"
              fill="white"
            />
          </svg>
        </div>
      );
    case 'sendTask':
      return (
        <div className={`${box} absolute -top-1 -left-1`} title="Send Task (BPMN)">
          <svg viewBox="0 0 16 16" width="14" height="14" className="text-zinc-800">
            <path d="M2 3h12v10H2z" className="fill-none stroke-current" strokeWidth="1.2" />
            <path d="M2 3l6 5 6-5" className="stroke-current" strokeWidth="1" />
          </svg>
        </div>
      );
    case 'receiveTask':
      return (
        <div className={`${box} absolute -top-1 -left-1`} title="Receive Task (BPMN)">
          <svg viewBox="0 0 16 16" width="14" height="14" className="text-zinc-800">
            <path d="M2 3h12v10H2z" className="fill-none stroke-current" strokeWidth="1.2" />
            <circle cx="8" cy="8" r="2" className="fill-none stroke-current" strokeWidth="1" />
          </svg>
        </div>
      );
    default:
      return null;
  }
});
