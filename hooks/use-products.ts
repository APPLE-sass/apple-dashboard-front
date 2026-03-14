import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pdvApi, accesoriosApi, subAccesoriosApi } from '@/lib/api';
import type {
  PuntoDeVentaInput,
  AccesorioFilters,
  AccesorioInput,
  SubAccesorioFilters,
  SubAccesorioInput,
} from '@/lib/types';


// ─── Puntos de Venta ─────────────────────────────────────────────────────────

export function usePuntosDeVenta() {
  return useQuery({
    queryKey: ['pdv'],
    queryFn: () => pdvApi.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreatePdv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PuntoDeVentaInput) => pdvApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pdv'] }); },
  });
}

export function useUpdatePdv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PuntoDeVentaInput> }) =>
      pdvApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pdv'] }); },
  });
}

export function useDeletePdv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pdvApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pdv'] }); },
  });
}

// ─── Accesorios de marca ─────────────────────────────────────────────────────

export function useAccesorios(filters: AccesorioFilters = {}) {
  return useQuery({
    queryKey: ['accesorios', filters],
    queryFn: () => accesoriosApi.getAll(filters),
    staleTime: 1000 * 60,
  });
}

export function useCreateAccesorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AccesorioInput) => accesoriosApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accesorios'] }); },
  });
}

export function useUpdateAccesorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AccesorioInput> }) =>
      accesoriosApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accesorios'] }); },
  });
}

export function useDeleteAccesorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accesoriosApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['accesorios'] }); },
  });
}

// Keep old name as alias for backwards compatibility
export const useDeactivateAccesorio = useDeleteAccesorio;

// ─── Sub-accesorios genéricos ─────────────────────────────────────────────────

export function useSubAccesorios(filters: SubAccesorioFilters = {}) {
  return useQuery({
    queryKey: ['sub-accesorios', filters],
    queryFn: () => subAccesoriosApi.getAll(filters),
    staleTime: 1000 * 60,
  });
}

export function useCreateSubAccesorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubAccesorioInput) => subAccesoriosApi.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sub-accesorios'] }); },
  });
}

export function useUpdateSubAccesorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubAccesorioInput> }) =>
      subAccesoriosApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sub-accesorios'] }); },
  });
}

export function useDeleteSubAccesorio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subAccesoriosApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sub-accesorios'] }); },
  });
}
