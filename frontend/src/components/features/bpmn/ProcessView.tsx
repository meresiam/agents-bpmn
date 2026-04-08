'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code2, Workflow, Maximize2, Minimize2, Copy, Check, MessageCircle, Share2, StickyNote } from 'lucide-react';
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
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { graphToReactFlow } from '@/lib/parse-process-graph';
import { layoutProcessGraph } from '@/lib/layout';
import { BpmnNode, BpmnEdge, formatProcessGraphPoolLabel } from '@/lib/types';
import { getProcess, ProcessDetail } from '@/services/process.service';
import { getThreads, createThread, CommentThread } from '@/services/comment.service';
import { getNotes, createNote, updateNote, deleteNote, StickyNote as StickyNoteType } from '@/services/sticky-note.service';
import { useAuth } from '@/contexts/auth.context';
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
  onNoteDragStop,
  onThreadUpdated,
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
  onNoteDragStop: NodeDragHandler;
  onThreadUpdated: () => void;
}) {
  const edgesWithStyle = useMemo(() => withBpmnEdgeStyle(initialEdges), [initialEdges]);
  const allNodes = useMemo(() => [...initialNodes, ...noteNodes] as any[], [initialNodes, noteNodes]);
  const [nodes, , onNodesChange] = useNodesState(allNodes as BpmnNode[]);
  const [edges, , onEdgesChange] = useEdgesState(edgesWithStyle);
  const flowRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useReactFlow();

  const handlePaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (canvasMode !== 'note') return;
      const rect = flowRef.current?.getBoundingClientRect();
      if (!rect) return;
      const flowPos = reactFlowInstance.project({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      onNoteCanvasClick(flowPos.x, flowPos.y);
    },
    [canvasMode, onNoteCanvasClick, reactFlowInstance],
  );

  const modeClass = canvasMode === 'note' ? 'cursor-copy-mode' : canvasMode === 'comment' ? 'cursor-crosshair-mode' : '';

  return (
    <div ref={flowRef} className={`relative ${modeClass}`} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNoteDragStop}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        className="bg-zinc-100"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={0.55} color={diagramInline.dot} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={diagramInline.minimapNode} maskColor="rgb(244 244 245 / 0.65)" className="!bg-white/90" />

        <Panel position="top-left">
          <div className="flex flex-col gap-2 items-start max-w-md">
            <div className="bg-white/95 backdrop-blur-sm border border-zinc-200 rounded-bpmn px-4 py-2.5 shadow-md w-full">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.12em] block">{slug}</span>
              {pool && (
                <p className="text-[10px] text-zinc-800 mt-1 leading-snug border-l-[3px] border-zinc-600 pl-2.5 mb-1">
                  Pool: {pool}
                </p>
              )}
              <h2 className="text-sm font-semibold text-zinc-900 tracking-tight">{title}</h2>
            </div>
            <BpmnLegend align="left" />
          </div>
        </Panel>

        <Panel position="top-right">
          <ExportButton flowRef={flowRef} filename={`${slug}-${title}`.replace(/\s+/g, '-').toLowerCase()} />
        </Panel>
      </ReactFlow>

      {/* Comment pins layer */}
      <CommentPins
        threads={threads}
        commentMode={canvasMode === 'comment'}
        onCanvasClick={onCommentCanvasClick}
        onThreadUpdated={onThreadUpdated}
      />

      {/* Mode indicator */}
      {canvasMode !== 'default' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-zinc-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-medium flex items-center gap-2">
          {canvasMode === 'comment' ? (
            <><MessageCircle size={14} /> Clique para comentar</>
          ) : (
            <><StickyNote size={14} /> Clique para adicionar nota</>
          )}
          <kbd className="px-1.5 py-0.5 bg-zinc-700 rounded text-[10px] font-mono ml-1">ESC</kbd>
        </div>
      )}

      <LaserPointerLayer containerRef={flowRef} />
    </div>
  );
}

export default function ProcessView() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const processId = params.id as string;

  const [proc, setProc] = useState<ProcessDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [canvasMode, setCanvasMode] = useState<CanvasMode>('default');
  const [codeCopied, setCodeCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

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
        setCanvasMode((prev) => prev === 'note' ? 'default' : 'note');
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

  // Note canvas click
  const handleNoteCanvasClick = useCallback(async (x: number, y: number) => {
    if (!processId) return;
    try {
      await createNote(processId, { content: 'Nova nota', x, y });
      loadNotes();
      setCanvasMode('default');
    } catch { /* silently fail */ }
  }, [processId, loadNotes]);

  // Handle sticky note update (content edit from node)
  const handleNoteUpdate = useCallback(async (noteId: string, content: string) => {
    await updateNote(noteId, { content });
    loadNotes();
  }, [loadNotes]);

  // Handle sticky note delete from node
  const handleNoteDelete = useCallback(async (noteId: string) => {
    await deleteNote(noteId);
    loadNotes();
  }, [loadNotes]);

  // Handle sticky note drag stop — save new position
  const handleNoteDragStop: NodeDragHandler = useCallback((_event, node) => {
    if (node.type !== 'stickyNote') return;
    const noteId = (node.data as StickyNoteNodeData).noteId;
    updateNote(noteId, { x: node.position.x, y: node.position.y }).then(loadNotes);
  }, [loadNotes]);

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
        onDelete: handleNoteDelete,
      },
    }));
  }, [stickyNotes, handleNoteUpdate, handleNoteDelete]);

  const handleCopyGraphJson = useCallback(() => {
    if (!proc) return;
    void navigator.clipboard.writeText(JSON.stringify(proc.graph, null, 2));
    setCodeCopied(true);
    window.setTimeout(() => setCodeCopied(false), 2000);
  }, [proc]);

  const { nodes, edges } = useMemo(() => {
    if (!proc) return { nodes: [], edges: [] };
    const { nodes: raw, edges: rawEdges } = graphToReactFlow(proc.graph);
    return layoutProcessGraph(proc.graph, raw, rawEdges);
  }, [proc]);

  const unresolvedCount = threads.filter((t) => !t.resolved).length;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (error || !proc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-100">
        <div className="text-center">
          <Workflow size={48} className="mx-auto mb-4 text-zinc-300" />
          <h1 className="text-xl font-bold text-zinc-800 mb-2">Processo nao encontrado</h1>
          <p className="text-sm text-zinc-500 mb-6">O processo solicitado nao existe ou voce nao tem acesso.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-bpmn hover:bg-zinc-800 transition-colors shadow-sm">
            <ArrowLeft size={14} /> Voltar ao inicio
          </Link>
        </div>
      </div>
    );
  }

  if (fullscreen) {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <div className="absolute top-4 left-4 z-20">
          <button onClick={() => setFullscreen(false)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-bpmn text-xs font-medium text-zinc-800 hover:bg-zinc-100 transition-all shadow-sm">
            <Minimize2 size={12} /> Sair
          </button>
        </div>
        <ReactFlowProvider>
          <FlowCanvasWithOverlays
            initialNodes={nodes} initialEdges={edges} title={proc.title} slug={proc.slug}
            pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
            threads={threads} noteNodes={noteNodes} canvasMode={canvasMode}
            onCommentCanvasClick={handleCommentCanvasClick} onNoteCanvasClick={handleNoteCanvasClick}
            onNoteDragStop={handleNoteDragStop} onThreadUpdated={loadThreads}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-zinc-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-zinc-400 hover:text-zinc-700 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.08em]">{proc.slug}</span>
            <h1 className="text-sm font-semibold text-zinc-900 tracking-tight">{proc.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleShare} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${shareCopied ? 'bg-green-50 text-green-700 border-green-200' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}>
            {shareCopied ? <><Check size={12} /> Link copiado!</> : <><Share2 size={12} /> Compartilhar</>}
          </button>
          <button
            onClick={() => setCanvasMode((prev) => prev === 'comment' ? 'default' : 'comment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              canvasMode === 'comment' ? 'bg-zinc-900 text-white border-zinc-900' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
            title="Atalho: C"
          >
            <MessageCircle size={12} />
            {unresolvedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${canvasMode === 'comment' ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'}`}>{unresolvedCount}</span>
            )}
          </button>
          <button
            onClick={() => setCanvasMode((prev) => prev === 'note' ? 'default' : 'note')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${
              canvasMode === 'note' ? 'bg-yellow-400 text-yellow-900 border-yellow-500' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'
            }`}
            title="Atalho: N"
          >
            <StickyNote size={12} />
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${showComments ? 'bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}
          >
            Drawer
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-bpmn text-xs font-semibold border transition-all ${showCode ? 'bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm' : 'text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}
          >
            <Code2 size={12} /> Codigo
          </button>
          <button onClick={() => setFullscreen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 border border-zinc-200 hover:bg-zinc-100 rounded-bpmn text-xs font-semibold transition-all">
            <Maximize2 size={12} /> Fullscreen
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {showCode && (
          <div style={{ width: 380, flexShrink: 0 }} className="border-r border-zinc-200 flex flex-col overflow-hidden bg-zinc-950">
            <div className="px-3 py-1.5 bg-zinc-900 text-zinc-500 text-[10px] font-mono font-medium tracking-wide border-b border-zinc-800 flex items-center justify-between gap-2">
              <span>graph.json</span>
              <button type="button" onClick={handleCopyGraphJson} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-sans font-semibold text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
                {codeCopied ? <><Check size={11} className="text-green-500" /> Copiado</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
            <pre className="flex-1 p-4 bg-zinc-950 text-zinc-300 font-mono text-[11px] overflow-auto leading-relaxed">{JSON.stringify(proc.graph, null, 2)}</pre>
          </div>
        )}

        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <FlowCanvasWithOverlays
              initialNodes={nodes} initialEdges={edges} title={proc.title} slug={proc.slug}
              pool={formatProcessGraphPoolLabel(proc.graph) ?? proc.graph.pool}
              threads={threads} noteNodes={noteNodes} canvasMode={canvasMode}
              onCommentCanvasClick={handleCommentCanvasClick} onNoteCanvasClick={handleNoteCanvasClick}
              onNoteDragStop={handleNoteDragStop} onThreadUpdated={loadThreads}
            />
          </ReactFlowProvider>

          {/* New comment thread input — positioned at click location */}
          {newThreadPrompt && (
            <div
              className="absolute z-30 bg-white border border-zinc-200 rounded-bpmn shadow-xl p-3 w-72"
              style={{
                left: Math.min(newThreadPrompt.screenX + 16, (typeof window !== 'undefined' ? window.innerWidth - 320 : 600)),
                top: Math.min(newThreadPrompt.screenY - 20, (typeof window !== 'undefined' ? window.innerHeight - 160 : 400)),
              }}
            >
              <p className="text-[11px] font-semibold text-zinc-700 mb-2">Novo comentario</p>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateThread(); }} className="flex gap-2">
                <input type="text" value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} placeholder="Escreva seu comentario..." autoFocus className="flex-1 px-3 py-2 text-xs border border-zinc-200 rounded-bpmn bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                <button type="submit" disabled={!newThreadContent.trim()} className="px-3 py-2 bg-zinc-900 text-white rounded-bpmn hover:bg-zinc-800 disabled:opacity-50">Enviar</button>
              </form>
              <button type="button" onClick={() => setNewThreadPrompt(null)} className="text-[10px] text-zinc-400 hover:text-zinc-700 mt-1">Cancelar</button>
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
    </div>
  );
}
