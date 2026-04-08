'use client';

import dynamic from 'next/dynamic';

const PublicProcessView = dynamic(
  () => import('@/components/features/bpmn/PublicProcessView'),
  { ssr: false },
);

export default function SharePage() {
  return <PublicProcessView />;
}
