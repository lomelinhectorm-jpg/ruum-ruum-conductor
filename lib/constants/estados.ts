export const CERTIFICACION_CONDUCTOR = [
  'Borrador',
  'Pendiente de documentos',
  'En revision',
  'Correccion requerida',
  'Certificado',
  'Suspendido',
  'Bloqueado',
] as const

export const DISPONIBILIDAD_CONDUCTOR = [
  'Disponible',
  'No disponible',
  'Ocupado',
  'Pausado por sistema',
] as const

export const ESTADOS_VIAJE = [
  'Solicitud recibida',
  'Pendiente de asignacion',
  'Oferta enviada',
  'Conductor asignado',
  'Aceptado',
  'En camino al origen',
  'En origen',
  'Inspeccion inicial',
  'Evidencia inicial pendiente',
  'Listo para traslado',
  'Traslado en curso',
  'En destino',
  'Inspeccion final',
  'Evidencia final pendiente',
  'Entrega pendiente',
  'Finalizado',
  'Cancelado',
  'En revision por incidencia',
] as const

export const OFERTA_STATUS = ['Enviada', 'Aceptada', 'Rechazada', 'Expirada', 'Cancelada'] as const

export const EVIDENCIA_STATUS = [
  'Pendiente',
  'En captura',
  'Completa',
  'Rechazada',
  'Complemento solicitado',
  'Validada',
] as const

export const INCIDENCIA_STATUS = [
  'Nueva',
  'En revision',
  'Requiere informacion',
  'En atencion',
  'Escalada',
  'Resuelta',
  'Cancelada',
] as const

export const PAGO_STATUS = [
  'Por calcular',
  'Calculado',
  'En revision',
  'Aprobado',
  'Programado',
  'Pagado',
  'Retenido',
  'Disputado',
  'Ajustado',
  'Cancelado',
] as const

export type CertificacionConductor = typeof CERTIFICACION_CONDUCTOR[number]
export type DisponibilidadConductor = typeof DISPONIBILIDAD_CONDUCTOR[number]
export type EstatusViaje =
  | typeof ESTADOS_VIAJE[number]
  | 'Pendiente de asignación'
  | 'Conductor en camino'
  | 'Recolección en proceso'
  | 'Entrega en proceso'
  | 'En revisión por incidencia'
export type OfertaStatus = typeof OFERTA_STATUS[number]
export type EvidenciaStatus = typeof EVIDENCIA_STATUS[number]
export type IncidenciaStatus = typeof INCIDENCIA_STATUS[number]
export type PagoStatus = typeof PAGO_STATUS[number]

export const VIAJE_STATUS_COMPAT: Record<string, EstatusViaje> = {
  'Pendiente de asignación': 'Pendiente de asignacion',
  'Conductor en camino': 'En camino al origen',
  'Recolección en proceso': 'En origen',
  'Entrega en proceso': 'En destino',
  'En revisión por incidencia': 'En revision por incidencia',
}

export function normalizarEstatusViaje(status: string | null | undefined): EstatusViaje | null {
  if (!status) return null
  return (VIAJE_STATUS_COMPAT[status] ?? status) as EstatusViaje
}

export function normalizarCertificacion(value: string | null | undefined): CertificacionConductor {
  if (value === 'Activo') return 'Certificado'
  if (value === 'Pendiente de validacion' || value === 'Pendiente de validación') return 'En revision'
  if (value === 'Documentacion incompleta' || value === 'Documentación incompleta') return 'Correccion requerida'
  if (CERTIFICACION_CONDUCTOR.includes(value as CertificacionConductor)) return value as CertificacionConductor
  return 'Pendiente de documentos'
}

export function conductorCertificado(value: string | null | undefined) {
  return normalizarCertificacion(value) === 'Certificado'
}

export function esOfertaPendiente(viaje: { status: string }) {
  return ['Oferta enviada', 'Conductor asignado'].includes(normalizarEstatusViaje(viaje.status) ?? '')
}

export function esViajeActivo(viaje: { status: string }) {
  return [
    'Aceptado',
    'En camino al origen',
    'En origen',
    'Inspeccion inicial',
    'Evidencia inicial pendiente',
    'Listo para traslado',
    'Traslado en curso',
    'En destino',
    'Inspeccion final',
    'Evidencia final pendiente',
    'Entrega pendiente',
    'En revision por incidencia',
  ].includes(normalizarEstatusViaje(viaje.status) ?? '')
}

export function puedeCargarEvidenciaInicial(viaje: { status: string }) {
  return ['En origen', 'Inspeccion inicial'].includes(normalizarEstatusViaje(viaje.status) ?? '')
}

export function puedeCargarEvidenciaFinal(viaje: { status: string }) {
  return ['En destino', 'Inspeccion final'].includes(normalizarEstatusViaje(viaje.status) ?? '')
}

export function puedeCerrarViaje(viaje: { status: string }) {
  return ['Evidencia final pendiente', 'Entrega pendiente'].includes(normalizarEstatusViaje(viaje.status) ?? '')
}

export type SiguienteAccionViaje = {
  label: string
  siguiente?: EstatusViaje
  evento?: string
  requiereGps?: boolean
  evidencia?: 'inicial' | 'final'
  cerrar?: boolean
}

export function getSiguienteAccionViaje(viaje: { status: string }): SiguienteAccionViaje | null {
  switch (normalizarEstatusViaje(viaje.status)) {
    case 'Aceptado':
    case 'Conductor asignado':
      return { label: 'Confirmar salida hacia origen', siguiente: 'En camino al origen', evento: 'Salida hacia origen' }
    case 'En camino al origen':
      return { label: 'Confirmar llegada al origen', siguiente: 'En origen', evento: 'Llegada al origen', requiereGps: true }
    case 'En origen':
      return { label: 'Iniciar inspeccion inicial', siguiente: 'Inspeccion inicial', evento: 'Inspeccion inicial iniciada' }
    case 'Inspeccion inicial':
      return { label: 'Cargar evidencia inicial', evidencia: 'inicial' }
    case 'Evidencia inicial pendiente':
    case 'Listo para traslado':
      return { label: 'Iniciar traslado', siguiente: 'Traslado en curso', evento: 'Traslado iniciado' }
    case 'Traslado en curso':
      return { label: 'Confirmar llegada al destino', siguiente: 'En destino', evento: 'Llegada al destino', requiereGps: true }
    case 'En destino':
      return { label: 'Iniciar inspeccion final', siguiente: 'Inspeccion final', evento: 'Inspeccion final iniciada' }
    case 'Inspeccion final':
      return { label: 'Cargar evidencia final', evidencia: 'final' }
    case 'Evidencia final pendiente':
    case 'Entrega pendiente':
      return { label: 'Cerrar viaje', cerrar: true }
    default:
      return null
  }
}
