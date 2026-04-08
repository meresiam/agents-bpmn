import { ProcessGraphJson } from '@/lib/types';

/**
 * Departamento de Marketing — Maturi (Mórris Litvak)
 * Notação BPMN 2.0
 *
 * 3 Pools:
 *   producao    — Gestor de Marketing | Copywriter | Designer | Sistema
 *   performance — Gestor de Tráfego | Sistema
 *   publicacao  — Social Media | Sistema
 *
 * Automações n8n:
 *   M1 [marketing]copy-finalizada->mover-design
 *   M2 [marketing]design-em-aprovacao->enviar-whatsapp
 *   M3 [marketing]design-finalizado->mover-publicacao
 *   M4 [marketing]campanha-otimizacao->criar-task
 *   M5 [marketing]otimizacao-finalizada->liberar-campanha
 *   M6 [marketing]relatorio-semanal->gerar-metricas
 *   M7 [marketing]publicacao-agendada->executar-disparo
 *   M8 [marketing]post-publicado->registrar-laboratorio
 *
 * Stack: ClickUp · n8n · Zappfy · Brevo · Google Drive · OpenAI GPT
 * Produtos: Club · PGI · Octus PRO
 */
export const MATURI_MARKETING_GRAPH: ProcessGraphJson = {
  version: 1,
  layout: 'LR',
  pools: [
    {
      id: 'producao',
      pool: 'Produção de Conteúdo — Maturi',
      lanes: ['Gestor de Marketing', 'Copywriter', 'Designer', 'Sistema'],
    },
    {
      id: 'performance',
      pool: 'Performance & Growth — Maturi',
      lanes: ['Gestor de Tráfego', 'Sistema'],
    },
    {
      id: 'publicacao',
      pool: 'Publicação — Maturi',
      lanes: ['Social Media', 'Sistema'],
    },
  ],
  nodes: [
    // ═══════════════════════════════════════════════════════════════════════
    //  POOL: PRODUÇÃO DE CONTEÚDO
    //  Copywriting → Design → Passagem de bastão para Publicação
    // ═══════════════════════════════════════════════════════════════════════

    // ─── Início ─────────────────────────────────────────────────────────
    {
      id: 'prod_Start',
      kind: 'startEnd',
      label: 'Nova demanda de conteúdo',
      lane: 'Gestor de Marketing',
      poolId: 'producao',
      bpmn: { event: 'start' },
    },
    {
      id: 'prod_Briefing',
      kind: 'activity',
      label: 'Criar briefing da demanda\nTipo · Objetivo · Tom de Voz\nPrazo · Data de Publicação\nMarcar todos os envolvidos',
      lane: 'Gestor de Marketing',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },

    // ─── Copywriting ────────────────────────────────────────────────────
    {
      id: 'prod_Redigir',
      kind: 'activity',
      label: 'Redigir texto\n(legenda · copy · roteiro · email)\n[Status: Em Andamento]',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_RevisaoCopy',
      kind: 'activity',
      label: 'Revisar texto internamente\n(clareza · correção · alinhamento)\n[Status: Em Revisão]',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_GW_RevCopy',
      kind: 'decision',
      label: 'Revisão\naprovada?',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'prod_AlterarCopy',
      kind: 'activity',
      label: 'Ajustar texto\n[Status: Em Alteração & Ajustes]',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_AprovacaoCopy',
      kind: 'activity',
      label: 'Validar texto com decisor\n(cliente ou gestor)\n[Status: Em Aprovação]',
      lane: 'Gestor de Marketing',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_GW_AprCopy',
      kind: 'decision',
      label: 'Texto\naprovado?',
      lane: 'Gestor de Marketing',
      poolId: 'producao',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'prod_FinalizarCopy',
      kind: 'activity',
      label: 'Copy finalizada\n[Status: Finalizado]',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_GW_DestinoAposCopy',
      kind: 'decision',
      label: 'Precisa de\ndesign?',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'prod_End_SoCopy',
      kind: 'startEnd',
      label: 'Entrega apenas textual',
      lane: 'Copywriter',
      poolId: 'producao',
      bpmn: { event: 'end' },
    },

    // ─── Automação M1: Passagem de bastão Copy → Design ─────────────────
    {
      id: 'prod_Auto_MoverDesign',
      kind: 'automation',
      label: '[n8n M1]\nStatus → Finalizado (Copywriting)\nMover task → Processo de Design\nTrocar responsável → Designer\nNotificar via ClickUp',
      lane: 'Sistema',
      poolId: 'producao',
      bpmn: { task: 'serviceTask' },
    },

    // ─── Design ─────────────────────────────────────────────────────────
    {
      id: 'prod_CriarPeca',
      kind: 'activity',
      label: 'Criar peça visual\n(arte · carrossel · banner · infográfico)\n[Status: Em Andamento]',
      lane: 'Designer',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_RevisaoDesign',
      kind: 'activity',
      label: 'Revisar peça internamente\nAnexar no campo Peça Final\n[Status: Em Revisão]',
      lane: 'Designer',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_GW_RevDesign',
      kind: 'decision',
      label: 'Revisão\naprovada?',
      lane: 'Designer',
      poolId: 'producao',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'prod_AlterarDesign',
      kind: 'activity',
      label: 'Ajustar peça\n[Status: Em Alteração & Ajustes]',
      lane: 'Designer',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'prod_AprovacaoDesign',
      kind: 'activity',
      label: 'Enviar para aprovação externa\n[Status: Em Aprovação]',
      lane: 'Gestor de Marketing',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },

    // ─── Automação M2: Enviar peça para aprovação via WhatsApp ──────────
    {
      id: 'prod_Auto_EnviarWPP',
      kind: 'automation',
      label: '[n8n M2]\nStatus → Em Aprovação (Design)\nEnviar peça final via WhatsApp\n(Zappfy) para aprovação',
      lane: 'Sistema',
      poolId: 'producao',
      bpmn: { task: 'serviceTask' },
    },
    {
      id: 'prod_GW_AprDesign',
      kind: 'decision',
      label: 'Design\naprovado?',
      lane: 'Gestor de Marketing',
      poolId: 'producao',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'prod_FinalizarDesign',
      kind: 'activity',
      label: 'Design finalizado\n[Status: Finalizado]',
      lane: 'Designer',
      poolId: 'producao',
      bpmn: { task: 'userTask' },
    },

    // ─── Automação M3: Passagem de bastão Design → Publicação ───────────
    {
      id: 'prod_Auto_MoverPub',
      kind: 'automation',
      label: '[n8n M3]\nStatus → Finalizado (Design)\nMover task → Agendamento & Publicação\nTrocar responsável → Social Media\nNotificar via ClickUp',
      lane: 'Sistema',
      poolId: 'producao',
      bpmn: { task: 'serviceTask' },
    },
    {
      id: 'prod_End',
      kind: 'startEnd',
      label: 'Conteúdo enviado para publicação',
      lane: 'Sistema',
      poolId: 'producao',
      bpmn: { event: 'end' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  POOL: PERFORMANCE & GROWTH
    //  Gestão de Campanhas → Ciclo de Otimização → Relatório Semanal
    // ═══════════════════════════════════════════════════════════════════════

    // ─── Campanha: Cadastro → Veiculação ────────────────────────────────
    {
      id: 'perf_Start',
      kind: 'startEnd',
      label: 'Nova campanha de tráfego',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { event: 'start' },
    },
    {
      id: 'perf_Cadastrar',
      kind: 'activity',
      label: 'Cadastrar campanha\nInvestimento diário · Objetivo · Plataforma\nData início/fim\n[Status: Para Fazer]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_Planejar',
      kind: 'activity',
      label: 'Planejar e configurar campanha\nna plataforma de anúncios\nSelecionar públicos · Criativos · Budget\n[Status: Em Andamento]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_Submeter',
      kind: 'activity',
      label: 'Submeter para análise\nda plataforma de anúncios\n[Status: Em Análise]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_GW_Aprovada',
      kind: 'decision',
      label: 'Aprovada pela\nplataforma?',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'perf_Ajustar',
      kind: 'activity',
      label: 'Ajustar campanha\nconforme rejeição da plataforma',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_Veiculacao',
      kind: 'activity',
      label: 'Campanha ativa\n[Status: Em Veiculação]\nMonitorar indicadores',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },

    // ─── Ciclo de Otimização (Automação M4 + M5) ────────────────────────
    {
      id: 'perf_GW_Ciclo',
      kind: 'decision',
      label: 'Próximo evento?',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'perf_Auto_MoverOtimizacao',
      kind: 'automation',
      label: '[n8n M4]\nData de otimização atingida\nMover campanha → Em Otimização\nCriar task no Processo de Otimização\n(dependência: blocked)',
      lane: 'Sistema',
      poolId: 'performance',
      bpmn: { task: 'serviceTask' },
    },
    {
      id: 'perf_Otimizar',
      kind: 'activity',
      label: 'Executar otimização\n1. Anexar print dos indicadores\n2. Comentar o que foi feito\n   (ou motivo de não alterar)\n[Status: Em Otimização]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_Auto_LiberarCampanha',
      kind: 'automation',
      label: '[n8n M5]\nTask de otimização finalizada\nRemover bloqueio da campanha\nVoltar → Em Veiculação\nRegistrar data próxima otimização',
      lane: 'Sistema',
      poolId: 'performance',
      bpmn: { task: 'serviceTask' },
    },

    // ─── Relatório Semanal (Automação M6) ───────────────────────────────
    {
      id: 'perf_Auto_RelatorioSemanal',
      kind: 'automation',
      label: '[n8n M6 — Schedule Semanal]\nColetar métricas de todas as campanhas\nem veiculação via API\nGerar relatório consolidado\nEnviar via WhatsApp (Zappfy)\n+ Postar comentário no ClickUp',
      lane: 'Sistema',
      poolId: 'performance',
      bpmn: { task: 'serviceTask' },
    },
    {
      id: 'perf_End_Relatorio',
      kind: 'startEnd',
      label: 'Relatório semanal enviado',
      lane: 'Sistema',
      poolId: 'performance',
      bpmn: { event: 'end' },
    },

    // ─── Pausar / Encerrar ──────────────────────────────────────────────
    {
      id: 'perf_Pausar',
      kind: 'activity',
      label: 'Pausar campanha\n[Status: Pausada]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_GW_Retomar',
      kind: 'decision',
      label: 'Retomar?',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'perf_Finalizar',
      kind: 'activity',
      label: 'Encerrar campanha\nConsolidar resultados\n[Status: Finalizada]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_End',
      kind: 'startEnd',
      label: 'Campanha encerrada',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { event: 'end' },
    },

    // ─── Gestão de Públicos ─────────────────────────────────────────────
    {
      id: 'perf_StartPublico',
      kind: 'startEnd',
      label: 'Novo público identificado',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { event: 'start' },
    },
    {
      id: 'perf_CadastrarPublico',
      kind: 'activity',
      label: 'Cadastrar público\nAção · Plataforma · Segmentação\n[Status: Para Fazer]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_AtivarPublico',
      kind: 'activity',
      label: 'Público em uso nas campanhas\n[Status: Ativo]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_AvaliarPublico',
      kind: 'activity',
      label: 'Avaliar desempenho do público\n(Ruim · Médio · Bom · Excelente)',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_GW_ManterPublico',
      kind: 'decision',
      label: 'Manter\nativo?',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { gateway: 'exclusive' },
    },
    {
      id: 'perf_EncerrarPublico',
      kind: 'activity',
      label: 'Encerrar público\n[Status: Encerrado]',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'perf_End_Publico',
      kind: 'startEnd',
      label: 'Público encerrado',
      lane: 'Gestor de Tráfego',
      poolId: 'performance',
      bpmn: { event: 'end' },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  POOL: PUBLICAÇÃO
    //  Agendamento & Postagens + Disparos (Email / WhatsApp)
    // ═══════════════════════════════════════════════════════════════════════

    // ─── Receber conteúdo ───────────────────────────────────────────────
    {
      id: 'pub_Start',
      kind: 'startEnd',
      label: 'Conteúdo recebido',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { event: 'start' },
    },
    {
      id: 'pub_GW_TipoPublicacao',
      kind: 'decision',
      label: 'Tipo de\npublicação?',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { gateway: 'exclusive' },
    },

    // ─── Branch: Agendamento de Post (Redes Sociais) ────────────────────
    {
      id: 'pub_PrepararPost',
      kind: 'activity',
      label: 'Preparar publicação\nAdaptar formato por canal\nDefinir data/hora\n[Status: Em Andamento]',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'pub_AgendarPost',
      kind: 'activity',
      label: 'Agendar publicação\nPreencher due date = data/hora\n[Status: Agendado]',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'pub_PublicarPost',
      kind: 'activity',
      label: 'Executar publicação\nno canal definido\n[Status: Publicado]',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { task: 'userTask' },
    },

    // ─── Automação M8: Post publicado → Laboratório ─────────────────────
    {
      id: 'pub_Auto_RegistrarLab',
      kind: 'automation',
      label: '[n8n M8]\nStatus → Publicado\nCriar task no Laboratório\n(Análise de Postagens)\nPreencher: link · data · tipo',
      lane: 'Sistema',
      poolId: 'publicacao',
      bpmn: { task: 'serviceTask' },
    },
    {
      id: 'pub_End_Post',
      kind: 'startEnd',
      label: 'Post publicado',
      lane: 'Sistema',
      poolId: 'publicacao',
      bpmn: { event: 'end' },
    },

    // ─── Branch: Disparos (Email / WhatsApp / Newsletter) ───────────────
    {
      id: 'pub_PrepararDisparo',
      kind: 'activity',
      label: 'Preparar disparo\nConteúdo · Lista de destinatários\nCanal: Email (Brevo) ou WPP (Zappfy)\n[Status: Em Andamento]',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { task: 'userTask' },
    },
    {
      id: 'pub_AgendarDisparo',
      kind: 'activity',
      label: 'Agendar disparo\nPreencher due date = data/hora\n[Status: Agendado]',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { task: 'userTask' },
    },

    // ─── Automação M7: Disparo agendado → Executar ──────────────────────
    {
      id: 'pub_Auto_ExecutarDisparo',
      kind: 'automation',
      label: '[n8n M7]\nDue date atingido + Status Agendado\nDisparar via Brevo (email)\nou Zappfy (WhatsApp)\nAtualizar → Publicado',
      lane: 'Sistema',
      poolId: 'publicacao',
      bpmn: { task: 'serviceTask' },
    },
    {
      id: 'pub_End_Disparo',
      kind: 'startEnd',
      label: 'Disparo executado',
      lane: 'Sistema',
      poolId: 'publicacao',
      bpmn: { event: 'end' },
    },

    // ─── Descartado ─────────────────────────────────────────────────────
    {
      id: 'pub_End_Descartado',
      kind: 'startEnd',
      label: 'Descartado',
      lane: 'Social Media',
      poolId: 'publicacao',
      bpmn: { event: 'end' },
    },
  ],
  edges: [
    // ═══════════════════════════════════════════════════════════════════════
    //  POOL: PRODUÇÃO DE CONTEÚDO
    // ═══════════════════════════════════════════════════════════════════════

    // Início → Briefing → Copywriting
    { from: 'prod_Start', to: 'prod_Briefing' },
    { from: 'prod_Briefing', to: 'prod_Redigir' },

    // Copywriting: redação → revisão → aprovação
    { from: 'prod_Redigir', to: 'prod_RevisaoCopy' },
    { from: 'prod_RevisaoCopy', to: 'prod_GW_RevCopy' },
    { from: 'prod_GW_RevCopy', to: 'prod_AprovacaoCopy', label: 'Sim' },
    { from: 'prod_GW_RevCopy', to: 'prod_AlterarCopy', label: 'Não' },
    { from: 'prod_AlterarCopy', to: 'prod_RevisaoCopy' },
    { from: 'prod_AprovacaoCopy', to: 'prod_GW_AprCopy' },
    { from: 'prod_GW_AprCopy', to: 'prod_FinalizarCopy', label: 'Sim' },
    { from: 'prod_GW_AprCopy', to: 'prod_AlterarCopy', label: 'Não' },

    // Copy finalizada → precisa de design?
    { from: 'prod_FinalizarCopy', to: 'prod_GW_DestinoAposCopy' },
    { from: 'prod_GW_DestinoAposCopy', to: 'prod_Auto_MoverDesign', label: 'Sim' },
    { from: 'prod_GW_DestinoAposCopy', to: 'prod_End_SoCopy', label: 'Não' },

    // Automação M1: mover para Design
    { from: 'prod_Auto_MoverDesign', to: 'prod_CriarPeca' },

    // Design: criação → revisão → aprovação
    { from: 'prod_CriarPeca', to: 'prod_RevisaoDesign' },
    { from: 'prod_RevisaoDesign', to: 'prod_GW_RevDesign' },
    { from: 'prod_GW_RevDesign', to: 'prod_AprovacaoDesign', label: 'Sim' },
    { from: 'prod_GW_RevDesign', to: 'prod_AlterarDesign', label: 'Não' },
    { from: 'prod_AlterarDesign', to: 'prod_RevisaoDesign' },

    // Automação M2: enviar peça para WhatsApp
    { from: 'prod_AprovacaoDesign', to: 'prod_Auto_EnviarWPP' },
    { from: 'prod_Auto_EnviarWPP', to: 'prod_GW_AprDesign' },

    // Aprovação do design
    { from: 'prod_GW_AprDesign', to: 'prod_FinalizarDesign', label: 'Sim' },
    { from: 'prod_GW_AprDesign', to: 'prod_AlterarDesign', label: 'Não' },

    // Automação M3: mover para Publicação
    { from: 'prod_FinalizarDesign', to: 'prod_Auto_MoverPub' },
    { from: 'prod_Auto_MoverPub', to: 'prod_End' },

    // ═══════════════════════════════════════════════════════════════════════
    //  POOL: PERFORMANCE & GROWTH
    // ═══════════════════════════════════════════════════════════════════════

    // ─── Campanha: cadastro → veiculação ────────────────────────────────
    { from: 'perf_Start', to: 'perf_Cadastrar' },
    { from: 'perf_Cadastrar', to: 'perf_Planejar' },
    { from: 'perf_Planejar', to: 'perf_Submeter' },
    { from: 'perf_Submeter', to: 'perf_GW_Aprovada' },
    { from: 'perf_GW_Aprovada', to: 'perf_Veiculacao', label: 'Sim' },
    { from: 'perf_GW_Aprovada', to: 'perf_Ajustar', label: 'Não' },
    { from: 'perf_Ajustar', to: 'perf_Submeter' },

    // ─── Ciclo: veiculação → decisão ────────────────────────────────────
    { from: 'perf_Veiculacao', to: 'perf_GW_Ciclo' },
    { from: 'perf_GW_Ciclo', to: 'perf_Auto_MoverOtimizacao', label: 'Otimização devida' },
    { from: 'perf_GW_Ciclo', to: 'perf_Pausar', label: 'Pausar' },
    { from: 'perf_GW_Ciclo', to: 'perf_Finalizar', label: 'Encerrar' },

    // ─── Otimização (M4 → M5) ──────────────────────────────────────────
    { from: 'perf_Auto_MoverOtimizacao', to: 'perf_Otimizar' },
    { from: 'perf_Otimizar', to: 'perf_Auto_LiberarCampanha' },
    { from: 'perf_Auto_LiberarCampanha', to: 'perf_Veiculacao' },

    // ─── Relatório semanal (M6) ─────────────────────────────────────────
    { from: 'perf_Veiculacao', to: 'perf_Auto_RelatorioSemanal' },
    { from: 'perf_Auto_RelatorioSemanal', to: 'perf_End_Relatorio' },

    // ─── Pausar / retomar / encerrar ────────────────────────────────────
    { from: 'perf_Pausar', to: 'perf_GW_Retomar' },
    { from: 'perf_GW_Retomar', to: 'perf_Veiculacao', label: 'Sim' },
    { from: 'perf_GW_Retomar', to: 'perf_Finalizar', label: 'Não' },
    { from: 'perf_Finalizar', to: 'perf_End' },

    // ─── Públicos ───────────────────────────────────────────────────────
    { from: 'perf_StartPublico', to: 'perf_CadastrarPublico' },
    { from: 'perf_CadastrarPublico', to: 'perf_AtivarPublico' },
    { from: 'perf_AtivarPublico', to: 'perf_AvaliarPublico' },
    { from: 'perf_AvaliarPublico', to: 'perf_GW_ManterPublico' },
    { from: 'perf_GW_ManterPublico', to: 'perf_AtivarPublico', label: 'Sim' },
    { from: 'perf_GW_ManterPublico', to: 'perf_EncerrarPublico', label: 'Não' },
    { from: 'perf_EncerrarPublico', to: 'perf_End_Publico' },

    // ═══════════════════════════════════════════════════════════════════════
    //  POOL: PUBLICAÇÃO
    // ═══════════════════════════════════════════════════════════════════════

    // Entrada → decisão de tipo
    { from: 'pub_Start', to: 'pub_GW_TipoPublicacao' },
    { from: 'pub_GW_TipoPublicacao', to: 'pub_PrepararPost', label: 'Post / Rede Social' },
    { from: 'pub_GW_TipoPublicacao', to: 'pub_PrepararDisparo', label: 'Disparo (Email/WPP)' },
    { from: 'pub_GW_TipoPublicacao', to: 'pub_End_Descartado', label: 'Cancelar' },

    // Branch: Post
    { from: 'pub_PrepararPost', to: 'pub_AgendarPost' },
    { from: 'pub_AgendarPost', to: 'pub_PublicarPost' },
    { from: 'pub_PublicarPost', to: 'pub_Auto_RegistrarLab' },
    { from: 'pub_Auto_RegistrarLab', to: 'pub_End_Post' },

    // Branch: Disparo
    { from: 'pub_PrepararDisparo', to: 'pub_AgendarDisparo' },
    { from: 'pub_AgendarDisparo', to: 'pub_Auto_ExecutarDisparo' },
    { from: 'pub_Auto_ExecutarDisparo', to: 'pub_End_Disparo' },

    // ═══════════════════════════════════════════════════════════════════════
    //  CROSS-POOL: Produção → Publicação
    // ═══════════════════════════════════════════════════════════════════════
    { from: 'prod_End', to: 'pub_Start' },
  ],
};
