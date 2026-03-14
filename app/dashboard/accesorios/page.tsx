'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Trash2,
  Package,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAccesorios, usePuntosDeVenta, useDeactivateAccesorio } from '@/hooks/use-products';
import { AccesorioSheet } from '@/components/dashboard/accesorio-sheet';
import type { Accesorio, AccesorioFilters } from '@/lib/types';

const TIPOS = ['Funda', 'Templado', 'Malla', 'Cargador', 'Cable', 'Auricular', 'Soporte', 'Otro'];

function CantidadBadge({ cantidad }: { cantidad: number }) {
  const style =
    cantidad === 0
      ? { background: 'rgba(239,68,68,0.15)', color: '#f87171', borderColor: 'rgba(239,68,68,0.35)' }
      : cantidad <= 3
      ? { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.35)' }
      : { background: 'rgba(34,197,94,0.15)', color: '#4ade80', borderColor: 'rgba(34,197,94,0.35)' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
      style={style}
    >
      {cantidad} {cantidad === 1 ? 'ud.' : 'uds.'}
    </span>
  );
}

function TipoBadge({ tipo }: { tipo: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-muted-foreground border border-border">
      {tipo}
    </span>
  );
}

export default function AccesoriosPage() {
  const [filters, setFilters] = useState<AccesorioFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Accesorio | null>(null);
  const [deletingItem, setDeletingItem] = useState<Accesorio | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const { data: pdvData, isLoading: pdvLoading } = usePuntosDeVenta();
  const pdvList = useMemo(() => pdvData ?? [], [pdvData]);

  const queryFilters: AccesorioFilters = useMemo(() => ({
    ...filters,
    nombre: search || undefined,
  }), [filters, search]);

  const { data, isLoading } = useAccesorios(queryFilters);
  const deactivate = useDeactivateAccesorio();

  const selectedPdvName = useMemo(
    () => pdvList.find((p) => p.id === filters.puntoDeVentaId)?.nombre,
    [pdvList, filters.puntoDeVentaId]
  );

  const handleEdit = (item: Accesorio) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingItem(null);
  };

  const handleDeactivate = async () => {
    if (!deletingItem) return;
    try {
      await deactivate.mutateAsync(deletingItem.id);
      toast.success('Accesorio desactivado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desactivar');
    } finally {
      setDeletingItem(null);
    }
  };

  const updateFilter = <K extends keyof AccesorioFilters>(key: K, value: AccesorioFilters[K]) => {
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setSearch('');
  };

  const hasActiveFilters = !!(filters.puntoDeVentaId || filters.tipo || search);
  const meta = data?.meta;
  const items = data?.items ?? [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">Accesorios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestiona el inventario de accesorios por punto de venta
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Nuevo Accesorio
        </Button>
      </div>

      {/* PdV Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1 max-w-xs space-y-1">
          <Label className="text-xs text-muted-foreground">Punto de Venta</Label>
          <Select
            value={filters.puntoDeVentaId || 'all'}
            onValueChange={(v) => updateFilter('puntoDeVentaId', v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder={pdvLoading ? 'Cargando...' : 'Todos los PdV'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los puntos de venta</SelectItem>
              {pdvList.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search + filter toggle */}
        <div className="flex-1 flex items-end gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="pl-9 bg-secondary border-border"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 relative"
            onClick={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      {meta && (
        <p className="text-sm text-muted-foreground">
          {meta.total} {meta.total === 1 ? 'accesorio' : 'accesorios'}
          {selectedPdvName ? ` en ${selectedPdvName}` : ''}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Package className="h-12 w-12 opacity-30" />
          <p className="text-sm font-medium">Sin accesorios</p>
          <p className="text-xs">
            {hasActiveFilters ? 'Prueba cambiando los filtros' : 'Crea el primero con el botón de arriba'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <AccesorioCard
              key={item.id}
              item={item}
              onEdit={() => handleEdit(item)}
              onDeactivate={() => setDeletingItem(item)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Página {meta.page} de {meta.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!meta.hasPrevPage}
              onClick={() => updateFilter('page', (filters.page ?? 1) - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!meta.hasNextPage}
              onClick={() => updateFilter('page', (filters.page ?? 1) + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Filter Sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="right" className="w-80 bg-background border-l border-border">
          <SheetHeader className="pb-4">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={filters.tipo || 'all'}
                onValueChange={(v) => updateFilter('tipo', v === 'all' ? undefined : v)}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {TIPOS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" className="w-full" onClick={() => { clearFilters(); setFilterSheetOpen(false); }}>
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Create / Edit Sheet */}
      <AccesorioSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        accesorio={editingItem}
        pdvList={pdvList}
        defaultPdvId={filters.puntoDeVentaId}
      />

      {/* Deactivate Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(v) => !v && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desactivar accesorio</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará{' '}
              <span className="font-semibold text-foreground">
                {deletingItem?.nombre} {deletingItem?.modelo}
              </span>
              . Podrás reactivarlo desde el backend si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deactivate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Desactivar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Card Component ───────────────────────────────────────────────────────────

interface CardProps {
  item: Accesorio;
  onEdit: () => void;
  onDeactivate: () => void;
}

function AccesorioCard({ item, onEdit, onDeactivate }: CardProps) {
  const mainImage = item.imagenes.sort((a, b) => a.orden - b.orden)[0];

  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all hover:border-border/80 hover:shadow-lg hover:shadow-black/20">
      {/* Image */}
      <div className="relative h-44 bg-secondary overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage.url}
            alt={`${item.nombre} ${item.modelo}`}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9"
            onClick={onEdit}
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-9 w-9"
            onClick={onDeactivate}
            aria-label="Desactivar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {!item.isActive && (
          <div className="absolute top-2 left-2">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
              style={{ background: 'rgba(120,120,120,0.8)', color: '#fff', borderColor: 'transparent' }}
            >
              Inactivo
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-semibold text-foreground leading-tight">
            {item.nombre}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">{item.modelo}</p>
          {item.descripcion && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.descripcion}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TipoBadge tipo={item.tipo} />
          <CantidadBadge cantidad={item.cantidad} />
        </div>

        {/* Colors */}
        {item.colores.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.colores.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-secondary text-muted-foreground border border-border"
              >
                {c.color}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions (mobile — always visible) */}
      <div className="flex border-t border-border sm:hidden">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={onDeactivate}
          className="flex-1 py-2.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Desactivar
        </button>
      </div>
    </div>
  );
}
