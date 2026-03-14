// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  role: 'ADMIN' | 'VENDEDOR';
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}


// Punto de Venta
export interface PuntoDeVenta {
  id: string;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  isActive: boolean;
}

export interface PuntoDeVentaInput {
  nombre: string;
  direccion?: string;
  ciudad?: string;
}

// Accesorios de marca
export interface AccesorioColor {
  id: string;
  color: string;
}

export interface AccesorioImagen {
  id: string;
  url: string;
  orden: number;
}

export interface Accesorio {
  id: string;
  nombre: string;
  modelo: string;
  tipo: string;
  descripcion?: string;
  cantidad: number;
  isActive: boolean;
  puntoDeVentaId: string;
  puntoDeVenta?: PuntoDeVenta;
  colores: AccesorioColor[];
  imagenes: AccesorioImagen[];
}

export interface AccesorioInput {
  nombre: string;
  modelo: string;
  tipo: string;
  descripcion?: string;
  cantidad: number;
  puntoDeVentaId: string;
  colores: string[];
  imagenes: string[];
}

export interface AccesorioFilters {
  puntoDeVentaId?: string;
  tipo?: string;
  nombre?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAccesorios {
  items: Accesorio[];
  meta: PaginationMeta;
}

// Sub-accesorios genéricos
export interface SubAccesorio {
  id: string;
  nombre: string;
  tipo: string;
  descripcion?: string;
  cantidad: number;
  isActive: boolean;
  puntoDeVentaId: string;
  puntoDeVenta?: PuntoDeVenta;
  colores: AccesorioColor[];
  imagenes: AccesorioImagen[];
}

export interface SubAccesorioInput {
  nombre: string;
  tipo: string;
  descripcion?: string;
  cantidad: number;
  puntoDeVentaId: string;
  colores: string[];
  imagenes: string[];
}

export interface SubAccesorioFilters {
  puntoDeVentaId?: string;
  tipo?: string;
  nombre?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSubAccesorios {
  items: SubAccesorio[];
  meta: PaginationMeta;
}

