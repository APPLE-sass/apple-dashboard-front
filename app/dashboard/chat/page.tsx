'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare, Send, Search, SlidersHorizontal,
  ChevronRight, Phone, Instagram, Globe, X,
  ShoppingCart, Star, Clock, TrendingUp, Menu,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Canal = 'whatsapp' | 'instagram' | 'telegram' | 'web';
type EtapaCliente = 'prospecto' | 'oportunidad' | 'post_venta' | 'recompra' | 'inactivo';

interface Cliente {
  id: string;
  nombre: string;
  canal: Canal;
  etapa: EtapaCliente;
  avatar?: string;
  telefono?: string;
  ultimaInteraccion: Date;
  preferencias: string[];
  historialCompras: { producto: string; fecha: string; monto: number }[];
}

interface Mensaje {
  id: string;
  clienteId: string;
  contenido: string;
  origen: 'cliente' | 'agente' | 'bot';
  timestamp: Date;
  leido: boolean;
}

interface Conversacion {
  cliente: Cliente;
  mensajes: Mensaje[];
  noLeidos: number;
  oportunidadDetectada: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONVERSACIONES: Conversacion[] = [
  {
    noLeidos: 3,
    oportunidadDetectada: true,
    cliente: {
      id: '1',
      nombre: 'Marcos Delgado',
      canal: 'whatsapp',
      etapa: 'oportunidad',
      telefono: '+54 9 11 4521-0012',
      ultimaInteraccion: new Date(Date.now() - 1000 * 60 * 5),
      preferencias: ['iPhone', 'Accesorios premium', 'Colores oscuros'],
      historialCompras: [
        { producto: 'AirPods Pro', fecha: '2024-10-15', monto: 89000 },
        { producto: 'Cargador MagSafe', fecha: '2024-11-02', monto: 32000 },
      ],
    },
    mensajes: [
      { id: 'm1', clienteId: '1', contenido: 'Hola! Estan los iPhone 15 Pro en negro titanio?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 30), leido: true },
      { id: 'm2', clienteId: '1', contenido: 'Si! Tenemos stock en negro titanio en 128GB y 256GB', origen: 'agente', timestamp: new Date(Date.now() - 1000 * 60 * 28), leido: true },
      { id: 'm3', clienteId: '1', contenido: 'Cuanto sale el de 256GB?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 10), leido: true },
      { id: 'm4', clienteId: '1', contenido: 'Me interesa mucho, tienen cuotas?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 7), leido: false },
      { id: 'm5', clienteId: '1', contenido: 'Y viene con garantia oficial?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 5), leido: false },
      { id: 'm6', clienteId: '1', contenido: 'Ahi te mando precio actualizado', origen: 'bot', timestamp: new Date(Date.now() - 1000 * 60 * 4), leido: false },
    ],
  },
  {
    noLeidos: 1,
    oportunidadDetectada: false,
    cliente: {
      id: '2',
      nombre: 'Valentina Rios',
      canal: 'instagram',
      etapa: 'post_venta',
      telefono: '+54 9 351 7823-4456',
      ultimaInteraccion: new Date(Date.now() - 1000 * 60 * 45),
      preferencias: ['MacBook', 'Accesorios de trabajo'],
      historialCompras: [
        { producto: 'MacBook Air M2', fecha: '2024-09-20', monto: 450000 },
      ],
    },
    mensajes: [
      { id: 'm7', clienteId: '2', contenido: 'Buen dia! Compre la MacBook la semana pasada y tengo un problema con el cargador', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 60), leido: true },
      { id: 'm8', clienteId: '2', contenido: 'Hola Valentina! Claro te ayudamos. Cual es el problema que estas teniendo?', origen: 'agente', timestamp: new Date(Date.now() - 1000 * 60 * 55), leido: true },
      { id: 'm9', clienteId: '2', contenido: 'No carga rapido como al principio, tarda mucho mas', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 45), leido: false },
    ],
  },
  {
    noLeidos: 0,
    oportunidadDetectada: true,
    cliente: {
      id: '3',
      nombre: 'Bruno Castillo',
      canal: 'telegram',
      etapa: 'recompra',
      telefono: '+54 9 11 6634-9900',
      ultimaInteraccion: new Date(Date.now() - 1000 * 60 * 120),
      preferencias: ['iPad', 'Apple Watch', 'Accesorios gaming'],
      historialCompras: [
        { producto: 'iPad Pro 12.9"', fecha: '2024-06-10', monto: 380000 },
        { producto: 'Apple Pencil 2', fecha: '2024-06-10', monto: 75000 },
        { producto: 'Smart Folio', fecha: '2024-07-01', monto: 42000 },
      ],
    },
    mensajes: [
      { id: 'm10', clienteId: '3', contenido: 'Che ya salio el Apple Watch Ultra 2?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 130), leido: true },
      { id: 'm11', clienteId: '3', contenido: 'Si! Llego esta semana. Negro y titanio blanco.', origen: 'agente', timestamp: new Date(Date.now() - 1000 * 60 * 125), leido: true },
      { id: 'm12', clienteId: '3', contenido: 'Lo quiero. Me avisas cuando este en el local?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 120), leido: true },
    ],
  },
  {
    noLeidos: 0,
    oportunidadDetectada: false,
    cliente: {
      id: '4',
      nombre: 'Lucia Fernandez',
      canal: 'web',
      etapa: 'prospecto',
      ultimaInteraccion: new Date(Date.now() - 1000 * 60 * 60 * 3),
      preferencias: [],
      historialCompras: [],
    },
    mensajes: [
      { id: 'm13', clienteId: '4', contenido: 'Hola queria saber si tienen Apple TV 4K', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), leido: true },
      { id: 'm14', clienteId: '4', contenido: 'Hola Lucia! Si tenemos. Te cuento las opciones disponibles...', origen: 'agente', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), leido: true },
    ],
  },
  {
    noLeidos: 5,
    oportunidadDetectada: true,
    cliente: {
      id: '5',
      nombre: 'Santiago Morales',
      canal: 'whatsapp',
      etapa: 'oportunidad',
      telefono: '+54 9 11 2245-7788',
      ultimaInteraccion: new Date(Date.now() - 1000 * 60 * 2),
      preferencias: ['iPhone', 'Cambio de equipo', 'Financiacion'],
      historialCompras: [],
    },
    mensajes: [
      { id: 'm15', clienteId: '5', contenido: 'buenas tengo un iphone 12 y quiero pasarme al 15', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 20), leido: true },
      { id: 'm16', clienteId: '5', contenido: 'Perfecto Santiago! Hacemos permuta. Cuando podes venir al local?', origen: 'agente', timestamp: new Date(Date.now() - 1000 * 60 * 15), leido: true },
      { id: 'm17', clienteId: '5', contenido: 'mañana puedo', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 8), leido: false },
      { id: 'm18', clienteId: '5', contenido: 'y me conviene el 15 o el 15 pro?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 6), leido: false },
      { id: 'm19', clienteId: '5', contenido: 'depende del uso, para foto y video el pro vale la pena', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 4), leido: false },
      { id: 'm20', clienteId: '5', contenido: 'cuanto mas sale el pro?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 60 * 2), leido: false },
      { id: 'm21', clienteId: '5', contenido: 'tienen plan de financiacion?', origen: 'cliente', timestamp: new Date(Date.now() - 1000 * 30), leido: false },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CANAL_CONFIG: Record<Canal, { label: string; color: string; Icon: React.ElementType }> = {
  whatsapp:  { label: 'WhatsApp',  color: 'rgba(37,211,102,0.15)',  Icon: Phone },
  instagram: { label: 'Instagram', color: 'rgba(225,48,108,0.15)',  Icon: Instagram },
  telegram:  { label: 'Telegram',  color: 'rgba(36,161,222,0.15)',  Icon: MessageSquare },
  web:       { label: 'Web',       color: 'rgba(120,120,120,0.15)', Icon: Globe },
};

const ETAPA_CONFIG: Record<EtapaCliente, { label: string; bg: string; color: string; border: string }> = {
  prospecto:  { label: 'Prospecto',  bg: 'rgba(120,120,120,0.15)', color: '#a1a1aa', border: 'rgba(120,120,120,0.3)' },
  oportunidad:{ label: 'Oportunidad',bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  post_venta: { label: 'Post-Venta', bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  recompra:   { label: 'Recompra',   bg: 'rgba(34,197,94,0.15)',   color: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  inactivo:   { label: 'Inactivo',   bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)' },
};

function formatTime(date: Date): string {
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1)   return 'ahora';
  if (diffMin < 60)  return `${diffMin}m`;
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h`;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function getInitials(nombre: string): string {
  return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CanalBadge({ canal }: { canal: Canal }) {
  const cfg = CANAL_CONFIG[canal];
  const Icon = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border"
      style={{ background: cfg.color, color: 'var(--foreground)', borderColor: cfg.color }}
    >
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

function EtapaBadge({ etapa }: { etapa: EtapaCliente }) {
  const cfg = ETAPA_CONFIG[etapa];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
      style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
    >
      {cfg.label}
    </span>
  );
}

function Avatar({ nombre, className }: { nombre: string; className?: string }) {
  return (
    <div className={cn('rounded-full bg-accent flex items-center justify-center flex-shrink-0 font-medium text-foreground', className)}>
      {getInitials(nombre)}
    </div>
  );
}

// ─── Panel de detalle del cliente ─────────────────────────────────────────────

function ClientePanel({
  cliente,
  onClose,
  onTomarOportunidad,
}: {
  cliente: Cliente;
  onClose: () => void;
  onTomarOportunidad: () => void;
}) {
  const etapaCfg = ETAPA_CONFIG[cliente.etapa];
  return (
    <div className="w-72 flex-shrink-0 border-l border-border bg-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold">Detalle del cliente</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Perfil */}
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar nombre={cliente.nombre} className="h-16 w-16 text-xl" />
            <div>
              <p className="font-semibold">{cliente.nombre}</p>
              {cliente.telefono && (
                <p className="text-xs text-muted-foreground">{cliente.telefono}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <CanalBadge canal={cliente.canal} />
              <EtapaBadge etapa={cliente.etapa} />
            </div>
          </div>

          {/* Etapa */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Etapa actual</p>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary">
              <TrendingUp className="h-4 w-4" style={{ color: etapaCfg.color }} />
              <span className="text-sm font-medium" style={{ color: etapaCfg.color }}>
                {etapaCfg.label}
              </span>
            </div>
          </div>

          {/* Preferencias */}
          {cliente.preferencias.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferencias detectadas</p>
              <div className="flex flex-wrap gap-1.5">
                {cliente.preferencias.map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-md text-xs bg-secondary text-muted-foreground border border-border">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historial de compras */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Historial de compras ({cliente.historialCompras.length})
            </p>
            {cliente.historialCompras.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sin compras registradas</p>
            ) : (
              <div className="space-y-2">
                {cliente.historialCompras.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-secondary space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium leading-tight">{c.producto}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{c.fecha}</span>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                      ${c.monto.toLocaleString('es-AR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ultima interaccion */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ultima interaccion</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {cliente.ultimaInteraccion.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* CTA */}
      {(cliente.etapa === 'prospecto' || cliente.etapa === 'oportunidad') && (
        <div className="p-4 border-t border-border">
          <Button
            className="w-full gap-2 text-sm"
            onClick={onTomarOportunidad}
          >
            <ShoppingCart className="h-4 w-4" />
            Tomar como oportunidad
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export default function ChatPage() {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(MOCK_CONVERSACIONES);
  const [selectedId, setSelectedId] = useState<string>(MOCK_CONVERSACIONES[0].cliente.id);
  const [inputMsg, setInputMsg] = useState('');
  const [search, setSearch] = useState('');
  const [filterCanal, setFilterCanal] = useState<Canal | ''>('');
  const [filterEtapa, setFilterEtapa] = useState<EtapaCliente | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetail, setShowDetail] = useState(true);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = conversaciones.find(c => c.cliente.id === selectedId)!;
  const totalNoLeidos = conversaciones.reduce((acc, c) => acc + c.noLeidos, 0);

  const filtered = useMemo(() => {
    return conversaciones.filter(c => {
      const matchSearch = search === '' ||
        c.cliente.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.mensajes[c.mensajes.length - 1]?.contenido.toLowerCase().includes(search.toLowerCase());
      const matchCanal = filterCanal === '' || c.cliente.canal === filterCanal;
      const matchEtapa = filterEtapa === '' || c.cliente.etapa === filterEtapa;
      return matchSearch && matchCanal && matchEtapa;
    });
  }, [conversaciones, search, filterCanal, filterEtapa]);

  // Auto-scroll al ultimo mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, selected?.mensajes.length]);

  // Marcar como leidos al seleccionar
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileListOpen(false);
    setConversaciones(prev => prev.map(c =>
      c.cliente.id === id
        ? { ...c, noLeidos: 0, mensajes: c.mensajes.map(m => ({ ...m, leido: true })) }
        : c
    ));
  };

  const handleSend = () => {
    if (!inputMsg.trim()) return;
    const nuevo: Mensaje = {
      id: `m-${Date.now()}`,
      clienteId: selectedId,
      contenido: inputMsg.trim(),
      origen: 'agente',
      timestamp: new Date(),
      leido: true,
    };
    setConversaciones(prev => prev.map(c =>
      c.cliente.id === selectedId
        ? { ...c, mensajes: [...c.mensajes, nuevo] }
        : c
    ));
    setInputMsg('');
  };

  const handleTomarOportunidad = () => {
    setConversaciones(prev => prev.map(c =>
      c.cliente.id === selectedId
        ? { ...c, cliente: { ...c.cliente, etapa: 'oportunidad' }, oportunidadDetectada: true }
        : c
    ));
  };

  // ─── Panel de lista de conversaciones ──────────────────────────────────────

  const ListPanel = () => (
    <div className="flex flex-col h-full">
      {/* Header lista */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm">Conversaciones</h2>
            {totalNoLeidos > 0 && (
              <span
                className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-bold"
                style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
              >
                {totalNoLeidos}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowFilters(v => !v)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-secondary border-border"
          />
        </div>

        {/* Filtros */}
        {showFilters && (
          <div className="space-y-2">
            <select
              value={filterCanal}
              onChange={e => setFilterCanal(e.target.value as Canal | '')}
              className="w-full h-8 text-xs rounded-md bg-secondary border border-border text-foreground px-2"
            >
              <option value="">Todos los canales</option>
              {(Object.keys(CANAL_CONFIG) as Canal[]).map(c => (
                <option key={c} value={c}>{CANAL_CONFIG[c].label}</option>
              ))}
            </select>
            <select
              value={filterEtapa}
              onChange={e => setFilterEtapa(e.target.value as EtapaCliente | '')}
              className="w-full h-8 text-xs rounded-md bg-secondary border border-border text-foreground px-2"
            >
              <option value="">Todas las etapas</option>
              {(Object.keys(ETAPA_CONFIG) as EtapaCliente[]).map(e => (
                <option key={e} value={e}>{ETAPA_CONFIG[e].label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Sin resultados</div>
        ) : (
          filtered.map(conv => {
            const isActive = conv.cliente.id === selectedId;
            const lastMsg = conv.mensajes[conv.mensajes.length - 1];
            return (
              <button
                key={conv.cliente.id}
                onClick={() => handleSelect(conv.cliente.id)}
                className={cn(
                  'w-full px-4 py-3 flex items-start gap-3 text-left transition-colors border-b border-border',
                  isActive ? 'bg-accent' : 'hover:bg-secondary'
                )}
              >
                <Avatar nombre={conv.cliente.nombre} className="h-9 w-9 text-sm flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('text-sm truncate', conv.noLeidos > 0 ? 'font-semibold' : 'font-medium')}>
                      {conv.cliente.nombre}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground">
                        {formatTime(conv.cliente.ultimaInteraccion)}
                      </span>
                      {conv.noLeidos > 0 && (
                        <span
                          className="h-4 min-w-4 px-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center"
                          style={{ background: '#fbbf24', color: '#000' }}
                        >
                          {conv.noLeidos}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CanalBadge canal={conv.cliente.canal} />
                    <EtapaBadge etapa={conv.cliente.etapa} />
                    {conv.oportunidadDetectada && (
                      <Star className="h-3 w-3 flex-shrink-0" style={{ color: '#fbbf24' }} />
                    )}
                  </div>
                  {lastMsg && (
                    <p className="text-xs text-muted-foreground truncate">
                      {lastMsg.origen !== 'cliente' && (
                        <span className="mr-1">{lastMsg.origen === 'bot' ? '[Bot]' : 'Tu:'}</span>
                      )}
                      {lastMsg.contenido}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );

  // ─── Panel de mensajes ─────────────────────────────────────────────────────

  const ChatPanel = () => {
    if (!selected) return null;
    const { cliente, mensajes } = selected;

    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header chat */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-card flex-shrink-0">
          {/* Mobile: boton para abrir lista */}
          <button
            className="lg:hidden flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileListOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Avatar nombre={cliente.nombre} className="h-9 w-9 text-sm" />
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="font-semibold text-sm truncate">{cliente.nombre}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <CanalBadge canal={cliente.canal} />
              <EtapaBadge etapa={cliente.etapa} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => setShowDetail(v => !v)}
            title={showDetail ? 'Ocultar detalle' : 'Ver detalle'}
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', showDetail && 'rotate-180')} />
          </Button>
        </div>

        {/* Mensajes */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3 max-w-2xl mx-auto">
            {mensajes.map(msg => {
              const isOwn = msg.origen !== 'cliente';
              return (
                <div key={msg.id} className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
                  {!isOwn && (
                    <Avatar nombre={cliente.nombre} className="h-7 w-7 text-xs flex-shrink-0 mt-0.5" />
                  )}
                  <div className={cn('max-w-[72%] space-y-1', isOwn && 'items-end flex flex-col')}>
                    <div
                      className={cn(
                        'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-secondary text-foreground rounded-tl-sm',
                        msg.origen === 'bot' && 'opacity-70 border border-border'
                      )}
                    >
                      {msg.origen === 'bot' && (
                        <span className="block text-[10px] font-semibold text-muted-foreground mb-1">Bot</span>
                      )}
                      {msg.contenido}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">
                      {msg.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border bg-card flex-shrink-0">
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 max-w-2xl mx-auto"
          >
            <Input
              placeholder="Escribir respuesta..."
              value={inputMsg}
              onChange={e => setInputMsg(e.target.value)}
              className="flex-1 bg-secondary border-border"
              autoComplete="off"
            />
            <Button type="submit" size="icon" disabled={!inputMsg.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen overflow-hidden">

      {/* Lista — Desktop */}
      <div className="hidden lg:flex w-[300px] flex-shrink-0 flex-col border-r border-border bg-card overflow-hidden">
        <ListPanel />
      </div>

      {/* Lista — Mobile drawer */}
      <Sheet open={mobileListOpen} onOpenChange={setMobileListOpen}>
        <SheetContent side="left" className="p-0 w-[300px] bg-card border-r border-border">
          <ListPanel />
        </SheetContent>
      </Sheet>

      {/* Chat panel */}
      <ChatPanel />

      {/* Detalle cliente — Desktop */}
      {showDetail && selected && (
        <div className="hidden lg:flex">
          <ClientePanel
            cliente={selected.cliente}
            onClose={() => setShowDetail(false)}
            onTomarOportunidad={handleTomarOportunidad}
          />
        </div>
      )}
    </div>
  );
}
