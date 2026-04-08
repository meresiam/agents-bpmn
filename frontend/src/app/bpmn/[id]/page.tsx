'use client';

import dynamic from 'next/dynamic';

const ProcessView = dynamic(
  () => import('@/components/features/bpmn/ProcessView'),
  { ssr: false },
);

export default function ProcessPage() {
  return <ProcessView />;
}
