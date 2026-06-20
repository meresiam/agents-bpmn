'use client';

import dynamic from 'next/dynamic';

const PairView = dynamic(
  () => import('@/components/features/bpmn/PairView'),
  { ssr: false },
);

export default function PairPage() {
  return <PairView />;
}
