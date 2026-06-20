'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, Workflow, Maximize2, Minimize2, Copy, Check, MessageCircle, Share2, Sparkles, StickyNote, GitCompare } from 'lucide-react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  Node,
  NodeDragHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphToReactFlow } from '@/lib/parse-process-graph';
import { layoutProcessGraph } from '@/lib/layout';
import { BpmnNode, BpmnEdge, formatProcessGraphPoolLabel } from '@/lib/types';
import { getProcess, saveLayoutOverrides, updateProcess, pairProcess, ProcessDetail } from '@/services/process.service';
import { getThreads, createThread, deleteThread, CommentThread } from '@/services/comment.service';
import { getNotes, createNote, updateNote, deleteNote, StickyNote as StickyNoteType } from '@/services/sticky-note.service';
import { useAuth } from '@/contexts/auth.context';
import type { GeneratedGraph } from '@/services/chat.service';
import { EditWithAIDialog } from '@/components/features/chat/EditWithAIDialog';
import { CommentsPanel } from '@/components/shared/CommentsPanel';
import { CommentPins } from './CommentPins';
import { StickyNoteNode, StickyNoteNodeData } from './nodes/StickyNoteNode';
import { ActivityNode } from './nodes/ActivityNode';
import { DecisionNode } from './nodes/DecisionNode';
import { StartEndNode } from './nodes/StartEndNode';
import { AutomationNode } from './nodes/AutomationNode';
import { GroupNode } from './nodes/GroupNode';
import { BpmnPoolNode } from './nodes/BpmnPoolNode';
import { ExportButton } from './ExportButton';
import { BpmnLegend } from './BpmnLegend';
import { LaserPointerLayer } from './LaserPointerLayer';
import { withBpmnEdgeStyle } from '@/lib/react-flow-theme';
import { diagramInline } from '@/lib/diagram-tokens';

const nodeTypes = {
  activity: ActivityNode,
  decision: DecisionNode,
  startEnd: StartEndNode,
  automation: AutomationNode,
  group: GroupNode,
  bpmnPool: BpmnPoolNode,
  stickyNote: StickyNoteNode,
};

type CanvasMode = 'default' | 'comment' | 'note';

function FlowCanvasWithOverlays({
  initialNodes,
  initialEdges,
  title,
  slug,
  pool,
  threads,
  noteNodes,
  canvasMode,
  onCommentCanvasClick,
  onNoteCanvasClick,
  onNodeDragStop,
  onThreadUpdated,
  onDeleteThread,
}: {
  initialNodes: BpmnNode[];
  initialEdges: BpmnEdge[];
  title: string;
  slug: string;
  pool?: string;
  threads: CommentThread[];
  noteNodes: Node<StickyNoteNodeData>[];
  canvasMode: CanvasMode;
  onCommentCanvasClick: (flowX: number, flowY: number, screenX: number, screenY: number) => void;
  onNoteCanvasClick: (x: number, y: number) => void;
  onNodeDragStop: NodeDragHandler;
  onThreadUpdated: () => void;
  onDeleteThread: (threadId: string) => void;
}) {
  const edgesWithStyle = useMemo(() => withBpmnEdgeStyle(initialEdges), [initialEdges]);
  const allNodes = useMemo(() => [...initialNodes, ...noteNodes] as any[], [initialNodes, noteNodes]);
  const [nodes, setNodes, onNodesChange] = useNodesState(allNodes as BpmnNode[]);
  const [edges, , onEdgesChange] = useEdgesState(edgesWithStyle);

  // Sync nodes when noteNodes change (useNodesState only uses initial value)
  useEffect(() => {
    setNodes([...initialNodes, ...noteNodes] as any[]);
  }, [noteNodes, initialNodes, setNodes]);
  const flowRef = useRef<HTMLDivElement>(null);

  const modeClass = canvasMode === 'note' ? 'cursor-copy-mode' : canvasMode === 'comment' ? 'cursor-crosshair-mode' : '';

  return (
    <div ref={flowRef} className={`relative ${modeClass}`} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        className="bg-[var(--diagram-surface)]"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0.55} color={diagramInline.dot} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={diagramInline.minimapNode} maskColor="rgb(0 0 0 / 0.45)" style={{ backgroundColor: 'var(--surface-elevated)' }} />

        <Panel position="top-left">
          <div className="flex flex-col gap-2 items-start w-[calc(100vw-7rem)] sm:w-auto sm:max-w-md">
            <div className="bg-surface-elevated/95 backdrop-blur-sm border border-border-app rounded-bpmn px-3 py-2 sm:px-4 sm:py-2.5 shadow-md w-full">
              <span className="text-[9px] sm:text-[10px] font-semibold text-fg-secondary uppercase tracking-[0.08em] sm:tracking-[0.12em] block truncate">{slug}</span>
              {pool && (
                <p className="text-[10px] text-fg-primary mt-1 leading-snug border-l-[3px] border-fg-secondary pl-2.5 mb-1 line-clamp-2">
                  Pool: {pool}
                </p>
              )}
              <h2 className="text-xs sm:text-sm font-semibold text-fg-primary tracking-tight line-clamp-2">{title}</h2>
            </div>
            <BpmnLegend align="left" />
          </div>
        </Panel>

        <Panel position="top-right">
          <ExportButton flowRef={flowRef} filename={`${slug}-${title}`.replace(/\s+/g, '-').toLowerCase()} />
        </Panel>
      </ReactFlow>

      {/* Unified overlay: handles both comment and note clicks */}
      <CommentPins
        threads={threads}
        mode={canvasMode === 'comment' ? 'comment' : canvasMode === 'note' ? 'note' : 'off'}
        onCommentClick={onCommentCanvasClick}
        onNoteClick={onNoteCanvasClick}
        onThreadUpdated={onThreadUpdated}
        onDeleteThread={onDeleteThread}
      />

      {/* Mode indicator */}
      {canvasMode !== 'default' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-fg-primary text-surface px-4 py-2 rounded-full shadow-lg text-xs font-medium flex items-center gap-2">
          {canvasMode === 'comment' ? (
            <><MessageCircle size={14} /> Clique para comentar</>
          ) : (
            <><StickyNote size={14} /> Clique para adicionar nota</>
          )}
          <kbd className="px-1.5 py-0.5 bg-fg-secondary/40 rounded text-[10px] font-mono ml-1">ESC</kbd>
        </div>
      )}

      <LaserPointerLayer containerRef={flowRef} />
    </div>
  );
}

export default function ProcessView() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const processId = params.id as string;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [proc, setProc] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('default');
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [editWithAIOpen, setEditWithAIOpen] = useState(false);
  const [pairing, setPairing] = useState(false);

  // Epic 4.A — gera o TO-BE vinculado (processo SINGLE vira AS-IS) e abre a comparação.
  const handleGenerateToBe = useCallback(async () => {
    if (!processId || pairing) return;
    setPairing(true);
    try {
      const pair = await pairProcess(processId);
      router.push(`/pair/${pair.asIs.id}`);
    } catch (err) {
      console.error('Falha ao gerar TO-BE', err);
      setPairing(false);
    }
  }, [processId, pairing, router]);

  const handleApplyAIEdit = useCallback(
    async (next: GeneratedGraph) => {
      if (!processId) return;
      const updated = await updateProcess(processId, { graph: next.graph });
      setProc(updated);
      setEditWithAIOpen(false);
    },
    [processId],
  );

  // Comments
  const [threads, setThreads] = useState<CommentThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newThreadPrompt, setNewThreadPrompt] = useState<{ flowX: number; flowY: number; screenX: number; screenY: number } | null>(null);
  const [newThreadContent, setNewThreadContent] = useState('');

  // Sticky notes
  const [stickyNotes, setStickyNotes] = useState<StickyNoteType[]>([]);

  const handleShare = useCallback(() => {
    const shareUrl = `${window.location.origin}/share/${processId}`;
    void navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  }, [processId]);

  // Auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/login');
  }, [authLoading, isAuthenticated, router]);

  // Load process
  useEffect(() => {
    if (!processId || !isAuthenticated) return;
    setLoading(true);
    getProcess(processId)
      .then(setProc)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [processId, isAuthenticated]);

  // Load threads
  const loadThreads = useCallback(() => {
    if (!processId || !isAuthenticated) return;
    getThreads(processId).then(setThreads).catch(console.error);
  }, [processId, isAuthenticated]);
  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Load sticky notes
  const loadNotes = useCallback(() => {
    if (!processId || !isAuthenticated) return;
    getNotes(processId).then(setStickyNotes).catch(console.error);
  }, [processId, isAuthenticated]);
  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === 'c' || e.key === 'C') {
        setCanvasMode((prev) => prev === 'comment' ? 'default' : 'comment');
        setNewThreadPrompt(null);
      }
      if (e.key === 'n' || e.key === 'N') {
        setCanvasMode((prev) => {
          const next = prev === 'note' ? 'default' : 'note';
          console.log('[KEY] N pressed, canvasMode:', prev, '->', next);
          return next;
        });
      }
      if (e.key === 'Escape') {
        setCanvasMode('default');
        setNewThreadPrompt(null);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Comment canvas click — receives both flow coords and screen coords
  const handleCommentCanvasClick = useCallback((flowX: number, flowY: number, screenX: number, screenY: number) => {
    setNewThreadPrompt({ flowX, flowY, screenX, screenY });
    setNewThreadContent('');
  }, []);

  // Create thread
  const handleCreateThread = useCallback(async () => {
    if (!newThreadPrompt || !newThreadContent.trim() || !processId) return;
    try {
      await createThread(processId, newThreadPrompt.flowX, newThreadPrompt.flowY, newThreadContent.trim());
      loadThreads();
      setNewThreadPrompt(null);
      setNewThreadContent('');
      setCanvasMode('default');
    } catch { /* silently fail */ }
  }, [newThreadPrompt, newThreadContent, processId, loadThreads]);

  // Delete thread from pin
  const handleDeleteThread = useCallback(async (threadId: string) => {
    try {
      await deleteThread(threadId);
      loadThreads();
    } catch { /* silently fail */ }
  }, [loadThreads]);

  // Note canvas click
  const handleNoteCanvasClick = useCallback(async (x: number, y: number) => {
    console.log('[NOTE] handleNoteCanvasClick called', { x, y, processId });
    if (!processId) { console.log('[NOTE] no processId, aborting'); return; }
    try {
      const result = await createNote(processId, { content: 'Nova nota', x, y });
      console.log('[NOTE] created:', result);
      loadNotes();
      setCanvasMode('default');
    } catch (err) { console.error('[NOTE] create failed:', err); }
  }, [processId, loadNotes]);

  // Handle sticky note update (content edit from node)
  const handleNoteUpdate = useCallback(async (noteId: string, content: string) => {
    await updateNote(noteId, { content });
    loadNotes();
  }, [loadNotes]);

  // Handle sticky note color change
  const handleNoteColorChange = useCallback(async (noteId: string, color: string) => {
    await updateNote(noteId, { color: color as any });
    loadNotes();
  }, [loadNotes]);

  // Handle sticky note delete from node
  const handleNoteDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
    loadNotes();
  }, [loadNotes]);

  // Handle node drag stop — save position (sticky notes or BPMN nodes)
  const handleNodeDragStop: NodeDragHandler = useCallback((_event, node) => {
    if (node.type === 'stickyNote') {
      const noteId = (node.data as StickyNoteNodeData).noteId;
      updateNote(noteId, { x: node.position.x, y: node.position.y }).then(loadNotes);
      return;
    }
    // BPMN node — save layout override (SUPER_ADMIN only)
    if (processId && isSuperAdmin && node.type !== 'bpmnPool') {
      saveLayoutOverrides(processId, {
        [node.id]: { x: node.position.x, y: node.position.y },
      }).catch(console.error);
    }
  }, [loadNotes, processId, isSuperAdmin]);

  // Convert sticky notes to ReactFlow nodes
  const noteNodes: Node<StickyNoteNodeData>[] = useMemo(() => {
    return stickyNotes.map((note) => ({
      id: `note-${note.id}`,
      type: 'stickyNote' as const,
      position: { x: note.x, y: note.y },
      draggable: true,
      selectable: false,
      connectable: false,
      data: {
        noteId: note.id,
        content: note.content,
        color: note.color,
        onUpdate: handleNoteUpdate,
        onColorChange: handleNoteColorChange,
        onDelete: handleNoteDelete,
      },
    }));
  }, [stickyNotes, handleNoteUpdate, handleNoteColorChange, handleNoteDelete]);

  const handleCopyGraphJson = useCallback(() => {
    if (!proc) return;
    void navigator.clipboard.writeText(JSON.stringify(proc.graph, null, 2));
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 2000);
  }, [proc]);

  const { nodes, edges } = useMemo(() => {
    if (!proc) return { nodes: [], edges: [] };
    const { nodes: raw, edges: rawEdges } = graphToReactFlow(proc.graph);
    const laid = layoutProcessGraph(proc.graph, raw, rawEdges);

    // Apply layout overrides (saved node positions)
    if (proc.layoutOverrides) {
      const overrides = proc.layoutOverrides as Record<string, { x: number; y: number }>;
      laid.nodes = laid.nodes.map((n) => {
        const ov = overrides[n.id];
        if (!ov) return n;
        return { ...n, position: { x: ov.x, y: ov.y } };
      });
    }

    // Make BPMN nodes draggable for SUPER_ADMIN
    if (isSuperAdmin) {
      laid.nodes = laid.nodes.map((n) => {
        if (n.type === 'bpmnPool' || n.type === 'stickyNote') return n;
        return { ...n, draggable: true };
      });
    }

    return laid;
  }, [proc, isSuperAdmin]);

  const unresolvedCount = threads.filter((t) => !t.resolved).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-sm text-fg-secondary">Carregando...</p>
      </div>
    );
  }

  if (error || !proc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <Workflow size={48} className="mx-auto mb-4 text-fg-tertiary" />
          <h1 className="text-xl font-bold text-fg-primary mb-2">Processo nao encontrado</h1>
          <p className="text-sm text-fg-secondary mb-6">O processo solicitado nao existe ou voce nao tem acesso.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-fg-primary text-surface text-sm font-semibold rounded-bpmn hover:opacity-90 transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar ao inicio
          </Link>
        </div>
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div style={{ width: '100vw', height: '100dvh' }}>
        <div
          className="absolute z-20"
          style={{
            top: 'max(env(safe-area-inset-top, 0px), 1rem)',
            left: 'max(env(safe-area-inset-left, 0px), 1rem)',
          }}
        >
          <button onClick={() => setFullscreen(false)} className="flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-border-app rounded-bpmn text-xs font-medium text-fg-primary hover:bg-surface-hover transition-all shadow-sm">
            <Minimize2 size={12} /> Sair
          </button>
        </div>
        <ReactFlowProvider>
          <FlowCanvasWithOverlays
            initialNodes={nodes} initialEdges={edges} title={proc.title} slug={proc.slug}
            pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
            threads={threads} noteNodes={noteNodes} canvasMode={canvasMode}
            onCommentCanvasClick={handleCommentCanvasClick} onNoteCanvasClick={handleNoteCanvasClick}
            onNodeDragStop={handleNodeDragStop} onThreadUpdated={loadThreads}
            onDeleteThread={handleDeleteThread}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <header className="bg-surface-elevated/90 backdrop-blur-md border-b border-border-app px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link
            href="/"
            className="text-fg-tertiary hover:text-fg-primary transition-colors shrink-0 inline-flex h-9 w-9 sm:h-auto sm:w-auto items-center justify-center -ml-1.5 sm:ml-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0 flex-1">
            <span className="hidden sm:block text-[11px] font-semibold text-fg-secondary uppercase tracking-[0.08em] truncate">{proc.slug}</span>
            <h1 className="text-xs sm:text-sm font-semibold text-fg-primary tracking-tight truncate">{proc.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            onClick={handleShare}
            className={`inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${shareCopied ? 'bg-aila-success/10 text-aila-success border-aila-success/30' : 'text-fg-secondary border-border-app hover:bg-surface-hover'}`}
            title="Compartilhar"
            aria-label="Compartilhar"
          >
            {shareCopied ? (
              <>
                <Check size={14} className="sm:hidden" />
                <Check size={12} className="hidden sm:inline" />
                <span className="hidden sm:inline">Link copiado!</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="sm:hidden" />
                <Share2 size={12} className="hidden sm:inline" />
                <span className="hidden sm:inline">Compartilhar</span>
              </>
            )}
          </button>
          <button
            onClick={() => setCanvasMode((prev) => prev === 'comment' ? 'default' : 'comment')}
            className={`relative inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              canvasMode === 'comment' ? 'bg-fg-primary text-surface border-fg-primary' : 'text-fg-secondary border-border-app hover:bg-surface-hover'
            }`}
            title="Comentários (C)"
            aria-label="Comentários"
          >
            <MessageCircle size={14} className="sm:hidden" />
            <MessageCircle size={12} className="hidden sm:inline" />
            {unresolvedCount > 0 && (
              <span className={`absolute sm:static -top-1 -right-1 sm:top-auto sm:right-auto text-[9px] sm:text-[10px] min-w-[16px] h-4 px-1 sm:px-1.5 sm:py-0.5 rounded-full font-bold inline-flex items-center justify-center ${canvasMode === 'comment' ? 'bg-surface text-fg-primary' : 'bg-fg-primary text-surface'}`}>{unresolvedCount}</span>
            )}
          </button>
          <button
            onClick={() => setCanvasMode((prev) => prev === 'note' ? 'default' : 'note')}
            className={`inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              canvasMode === 'note' ? 'bg-aila-warning text-fg-primary border-aila-warning' : 'text-fg-secondary border-border-app hover:bg-surface-hover'
            }`}
            title="Nota (N)"
            aria-label="Nota"
          >
            <StickyNote size={14} className="sm:hidden" />
            <StickyNote size={12} className="hidden sm:inline" />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${showComments ? 'bg-surface-hover text-fg-primary border-border-app shadow-sm' : 'text-fg-secondary border-border-app hover:bg-surface-hover'}`}
            title="Painel de comentários"
          >
            Drawer
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${showCode ? 'bg-surface-hover text-fg-primary border-border-app shadow-sm' : 'text-fg-secondary border-border-app hover:bg-surface-hover'}`}
            title="Código JSON"
          >
            <Code2 size={12} /> Codigo
          </button>
          {proc.processKind === 'SINGLE' ? (
            <button
              onClick={handleGenerateToBe}
              disabled={pairing}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border border-border-app text-fg-secondary hover:bg-surface-hover transition-all disabled:opacity-50"
              title="Gerar TO-BE (versão otimizada do processo)"
              aria-label="Gerar TO-BE"
            >
              <GitCompare size={14} className="sm:hidden" />
              <GitCompare size={12} className="hidden sm:inline" />
              <span className="hidden sm:inline">{pairing ? 'Gerando…' : 'Gerar TO-BE'}</span>
            </button>
          ) : (
            <Link
              href={`/pair/${processId}`}
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border border-border-app text-fg-secondary hover:bg-surface-hover transition-all"
              title="Comparar AS-IS | TO-BE"
              aria-label="Comparar AS-IS e TO-BE"
            >
              <GitCompare size={14} className="sm:hidden" />
              <GitCompare size={12} className="hidden sm:inline" />
              <span className="hidden sm:inline">Comparar</span>
            </Link>
          )}
          <button
            onClick={() => setEditWithAIOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 rounded-bpmn text-xs font-semibold border border-aila-violet/30 bg-aila-violet/5 text-aila-violet hover:bg-aila-violet/10 transition-all"
            title="Editar com IA"
            aria-label="Editar com IA"
          >
            <Sparkles size={14} className="sm:hidden" />
            <Sparkles size={12} className="hidden sm:inline" />
            <span className="hidden sm:inline">Editar com IA</span>
          </button>
          <button
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:h-auto sm:w-auto sm:px-3 sm:py-1.5 text-fg-secondary border border-border-app hover:bg-surface-hover rounded-bpmn text-xs font-semibold transition-all"
            title="Tela cheia"
            aria-label="Tela cheia"
          >
            <Maximize2 size={14} className="sm:hidden" />
            <Maximize2 size={12} className="hidden sm:inline" />
            <span className="hidden sm:inline">Fullscreen</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showCode && (
          <div style={{ width: 380, flexShrink: 0 }} className="border-r border-border-app flex flex-col overflow-hidden bg-aila-black">
            <div className="px-3 py-1.5 bg-aila-graphite-900 text-aila-graphite-300 text-[10px] font-mono font-medium tracking-wide border-b border-aila-graphite-700 flex items-center justify-between gap-2">
              <span>graph.json</span>
              <button type="button" onClick={handleCopyGraphJson} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold text-aila-graphite-400 hover:bg-aila-graphite-700 hover:text-aila-cream transition-colors">
                {codeCopied ? <><Check size={11} className="text-aila-success" /> Copiado</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
            <pre className="flex-1 p-4 bg-aila-black text-aila-graphite-200 font-mono text-[11px] overflow-auto leading-relaxed">{JSON.stringify(proc.graph, null, 2)}</pre>
          </div>
        )}

        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <FlowCanvasWithOverlays
              initialNodes={nodes} initialEdges={edges} title={proc.title} slug={proc.slug}
              pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
              threads={threads} noteNodes={noteNodes} canvasMode={canvasMode}
              onCommentCanvasClick={handleCommentCanvasClick} onNoteCanvasClick={handleNoteCanvasClick}
              onNodeDragStop={handleNodeDragStop} onThreadUpdated={loadThreads}
              onDeleteThread={handleDeleteThread}
            />
          </ReactFlowProvider>

          {/* New comment thread input — positioned at click location */}
          {newThreadPrompt && (
            <div
              className="absolute z-30 bg-surface-elevated border border-border-app rounded-bpmn shadow-xl p-3 w-72"
              style={{
                left: Math.min(newThreadPrompt.screenX + 16, (typeof window !== 'undefined' ? window.innerWidth - 320 : 600)),
                top: Math.min(newThreadPrompt.screenY - 20, (typeof window !== 'undefined' ? window.innerHeight - 160 : 400)),
              }}
            >
              <p className="text-[11px] font-semibold text-fg-primary mb-2">Novo comentario</p>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateThread(); }} className="flex gap-2">
                <input type="text" value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} placeholder="Escreva seu comentario..." autoFocus className="flex-1 px-3 py-2 text-xs border border-border-app rounded-bpmn bg-surface-elevated text-fg-primary placeholder:text-fg-tertiary focus:outline-none focus:ring-2 focus:ring-aila-violet/30" />
                <button type="submit" disabled={!newThreadContent.trim()} className="px-3 py-2 bg-fg-primary text-surface rounded-bpmn hover:opacity-90 disabled:opacity-50">Enviar</button>
              </form>
              <button type="button" onClick={() => setNewThreadPrompt(null)} className="text-[10px] text-fg-tertiary hover:text-fg-primary mt-1">Cancelar</button>
            </div>
          )}
        </div>

        {showComments && (
          <CommentsPanel
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
            onThreadUpdated={loadThreads}
          />
        )}
      </div>

      {editWithAIOpen && (
        <EditWithAIDialog
          processId={processId}
          currentGraph={proc.graph}
          tenantId={proc.tenantId}
          onClose={() => setEditWithAIOpen(false)}
          onApply={handleApplyAIEdit}
        />
      )}
    </div>
  );
}
