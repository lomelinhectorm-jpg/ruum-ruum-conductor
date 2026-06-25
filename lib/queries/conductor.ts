// lib/queries/conductor.ts — conductor-ruum

import { supabase } from '@/lib/supabase'
import type { EstatusViaje } from '@/lib/supabase'
import type { DisponibilidadConductor } from '@/lib/constants/estados'

// ── AUTH ────────────────────────────────────────────────────

export async function loginConductorOTP(telefono: string) {
  const numero = '+52' + telefono.replace(/\D/g, '')
  const { data, error } = await supabase.auth.signInWithOtp({ phone: numero })
  if (error) throw error
  return data
}

export async function verificarOTPConductor(telefono: string, token: string) {
  const numero = '+52' + telefono.replace(/\D/g, '')
  const { data, error } = await supabase.auth.verifyOtp({
    phone: numero, token, type: 'sms',
  })
  if (error) throw error
  return data
}

// ── PERFIL ──────────────────────────────────────────────────

// Recibe el auth_id ya resuelto por el caller (normalmente desde el
// listener de onAuthStateChange) en vez de volver a llamar a
// supabase.auth.getUser() aquí dentro. Esto es deliberado: identificar
// al conductor correcto es responsabilidad del cliente, que ya validó
// la sesión real antes de pedir el perfil — re-derivarlo aquí podría
// mostrarle a un conductor el panel de otro si hay una sesión obsoleta.
// maybeSingle() (no single()) porque una cuenta recién registrada o
// "Pendiente de validación" puede no tener fila aún, y eso no debe
// lanzar una excepción.
export async function getMiPerfilConductor(authId: string) {
  const { data, error } = await supabase
    .from('conductores')
    .select(`
      id, nombre, apellido, email, telefono, curp, foto_url,
      domicilio_calle, domicilio_numero, domicilio_colonia, domicilio_cp,
      municipio, estado_geo, disponibilidad, certificacion, certificacion_estado,
      certificacion_motivo, certificacion_actualizada_at, fecha_certificacion,
      suspendido_hasta, motivo_suspension, calificacion,
      viajes_realizados, ganancias_total, cuenta_banco, cuenta_clabe, cuenta_titular
    `)
    .eq('auth_id', authId)
    .maybeSingle()

  if (error) throw error
  return data
}

export type CamposPerfilConductor = Partial<{
  nombre: string
  apellido: string
  telefono: string
  curp: string | null
  foto_url: string | null
  domicilio_calle: string | null
  domicilio_numero: string | null
  domicilio_colonia: string | null
  domicilio_cp: string | null
  municipio: string | null
  estado_geo: string | null
  cuenta_banco: string | null
  cuenta_clabe: string | null
  cuenta_titular: string | null
}>

export async function actualizarPerfilConductor(conductorId: string, datos: CamposPerfilConductor) {
  const { data, error } = await supabase
    .from('conductores')
    .update(datos)
    .eq('id', conductorId)
    .select(`
      id, nombre, apellido, email, telefono, curp, foto_url,
      domicilio_calle, domicilio_numero, domicilio_colonia, domicilio_cp,
      municipio, estado_geo, disponibilidad, certificacion, certificacion_estado,
      certificacion_motivo, certificacion_actualizada_at, fecha_certificacion,
      suspendido_hasta, motivo_suspension, calificacion,
      viajes_realizados, ganancias_total, cuenta_banco, cuenta_clabe, cuenta_titular
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateDisponibilidad(
  conductorId: string,
  disponibilidad: DisponibilidadConductor | 'En viaje' | 'Pausado'
) {
  const { data, error } = await supabase
    .from('conductores')
    .update({ disponibilidad })
    .eq('id', conductorId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── VIAJES ──────────────────────────────────────────────────

export async function getMisOfertasConductor(conductorId: string) {
  const { data, error } = await supabase
    .from('ofertas_viaje')
    .select(`
      id, viaje_id, conductor_id, status, pago_estimado, distancia_estimada_km,
      tiempo_estimado_min, expira_at, motivo_rechazo, accepted_at, rejected_at, created_at,
      viajes(
        id, folio, status, fecha_programada, hora_programada, created_at, updated_at,
        origen_calle, origen_numero, origen_colonia, origen_estado, origen_contacto, origen_telefono,
        destino_calle, destino_numero, destino_colonia, destino_estado, destino_contacto, destino_telefono,
        referencias, instrucciones, pago_conductor, gastos_autorizados, ajustes,
        tipos_servicio(nombre, descripcion),
        vehiculos(marca, modelo, anio, vin, placas, transmision, observaciones),
        usuarios(nombre, apellido),
        empresas(nombre_comercial),
        evidencias(id)
      )
    `)
    .eq('conductor_id', conductorId)
    .eq('status', 'Enviada')
    .order('expira_at', { ascending: true })

  if (error) throw error
  return data
}

// Una sola query con todos los viajes no cerrados del conductor. El
// split entre "solicitados" (Conductor asignado) y "aceptados" (en
// curso) se hace en el cliente con .filter() — así es como ya opera
// el componente real, que muestra ambos grupos como pestañas de una
// misma lista cargada una vez. (El diseño original de esta función
// hacía dos queries separadas devolviendo {solicitados, aceptados}
// pre-divididos; no se usaba en ningún lado y no coincidía con cómo
// el componente realmente arma sus pestañas, así que se reemplazó.)
export async function getMisViajesConductor(conductorId: string) {
  const { data, error } = await supabase
    .from('viajes')
    .select(`
      id, folio, status, fecha_programada, hora_programada, created_at, updated_at,
      origen_calle, origen_numero, origen_colonia, origen_estado, origen_contacto, origen_telefono,
      destino_calle, destino_numero, destino_colonia, destino_estado, destino_contacto, destino_telefono,
      referencias, instrucciones, pago_conductor, gastos_autorizados, ajustes,
      tipos_servicio(nombre, descripcion),
      vehiculos(marca, modelo, anio, vin, placas, transmision, observaciones),
      usuarios(nombre, apellido),
      empresas(nombre_comercial),
      evidencias(
        id, km_inicial, km_final, combustible_inicial, combustible_final,
        foto_frente_i, foto_piloto_i, foto_copiloto_i, foto_trasera_i, foto_tablero_i,
        foto_frente_f, foto_piloto_f, foto_copiloto_f, foto_trasera_f, foto_tablero_f
      )
    `)
    .eq('conductor_id', conductorId)
    .order('fecha_programada', { ascending: false, nullsFirst: false })

  if (error) throw error
  return data
}

export async function aceptarViaje(viajeId: string, conductorId: string, conductorNombre: string, ofertaId?: string | null) {
  const { data, error } = await supabase.rpc('aceptar_viaje_conductor', {
    p_viaje_id: viajeId,
    p_oferta_id: ofertaId ?? null,
    p_conductor_id: conductorId,
    p_actor_nombre: conductorNombre,
  })

  if (error) throw error
  return data
}

export async function rechazarOfertaViaje(ofertaId: string, motivo: string | null, conductorNombre: string) {
  const { data, error } = await supabase.rpc('rechazar_oferta_viaje', {
    p_oferta_id: ofertaId,
    p_motivo: motivo,
    p_actor_nombre: conductorNombre,
  })
  if (error) throw error
  return data
}

export async function rechazarViaje(viajeId: string, conductorNombre: string, motivo: string | null = null) {
  const { data, error } = await supabase.rpc('rechazar_oferta_viaje', {
    p_viaje_id: viajeId,
    p_motivo: motivo,
    p_actor_nombre: conductorNombre,
  })
  if (error) throw error
  return data
}

// Antes hacía un .update({ status }) directo: cualquier conductor con una
// fila de viajes accesible podía mandar cualquier status, sin validar que
// la transición tuviera sentido desde el estado actual. Ahora pasa por
// avanzar_estado_viaje_conductor (ver
// docs/sql/estados_viaje_transiciones_seguras.sql), que verifica que el
// viaje sea de este conductor y que la transición esté permitida según
// estados_viaje.siguientes para el estado actual.
export async function cambiarStatusViaje(
  viajeId: string,
  conductorId: string,
  status: EstatusViaje,
  conductorNombre: string,
  evento: string
) {
  const { data, error } = await supabase.rpc('avanzar_estado_viaje_conductor', {
    p_viaje_id: viajeId,
    p_conductor_id: conductorId,
    p_actor_nombre: conductorNombre,
    p_nuevo_estado: status,
    p_evento: evento,
  })

  if (error) throw error
  return data
}

export async function cerrarViajeConductor(
  viajeId: string,
  conductorId: string,
  conductorNombre: string
) {
  const { data, error } = await supabase.rpc('cerrar_viaje_conductor', {
    p_viaje_id: viajeId,
    p_conductor_id: conductorId,
    p_actor_nombre: conductorNombre,
  })

  if (error) throw error
  return data
}

// ── EVIDENCIA ───────────────────────────────────────────────

export async function subirEvidencia(payload: {
  viaje_id: string
  conductor_id: string
  conductor_nombre: string
  km_inicial?: number
  km_final?: number
  combustible_inicial?: string
  combustible_final?: string
  llaves_recibidas?: number
  llaves_entregadas?: number
  danos_iniciales?: string
  danos_finales?: string
  // paths dentro del bucket evidencias-viaje, llave = frente|piloto|copiloto|trasera|tablero
  fotos: Record<string, string>
  tipo: 'inicial' | 'final'
}) {
  const inicial = payload.tipo === 'inicial'
  const { data, error } = await supabase.rpc('guardar_evidencia_conductor', {
    p_viaje_id: payload.viaje_id,
    p_conductor_id: payload.conductor_id,
    p_tipo: payload.tipo,
    p_actor_nombre: payload.conductor_nombre,
    p_km: inicial ? payload.km_inicial ?? null : payload.km_final ?? null,
    p_combustible: inicial ? payload.combustible_inicial ?? null : payload.combustible_final ?? null,
    p_danos: inicial ? payload.danos_iniciales ?? null : payload.danos_finales ?? null,
    p_llaves: inicial ? payload.llaves_recibidas ?? null : payload.llaves_entregadas ?? null,
    p_foto_frente: payload.fotos.frente ?? null,
    p_foto_piloto: payload.fotos.piloto ?? null,
    p_foto_copiloto: payload.fotos.copiloto ?? null,
    p_foto_trasera: payload.fotos.trasera ?? null,
    p_foto_tablero: payload.fotos.tablero ?? null,
  })

  if (error) throw error
  return data
}

// ── GANANCIAS ────────────────────────────────────────────────

export async function getMisGanancias(conductorId: string) {
  const { data, error } = await supabase
    .from('pagos_conductores')
    .select('*')
    .eq('conductor_id', conductorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getMisGastos(conductorId: string) {
  const { data, error } = await supabase
    .from('gastos')
    .select('id, viaje_id, concepto, monto, estatus, created_at, viajes(folio)')
    .eq('conductor_id', conductorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ── DOCUMENTOS ─────────────────────────────────────────────

export async function getDocumentosConductor(conductorId: string) {
  void conductorId
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')
  const res = await fetch('/api/documento-conductor', { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) throw new Error('No se pudieron cargar los documentos.')
  const data = await res.json() as { documentos: Record<string, unknown>[] }
  return data.documentos
}

export async function getUrlDocumentoConductor(path: string) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')
  const res = await fetch(`/api/documento-conductor?path=${encodeURIComponent(path)}`, { headers: { Authorization: `Bearer ${session.access_token}` } })
  if (!res.ok) throw new Error('No se pudo abrir el documento.')
  const data = await res.json() as { url: string | null }
  return data.url
}

export async function subirDocumentoConductor(
  file: File,
  slot: 'licencia-frente' | 'licencia-reverso' | 'ine-frente' | 'comprobante-domicilio' | 'constancia-fiscal' | 'otro-documento' | 'foto-perfil',
  tipoDoc: string,
  folio = '',
  vigencia = '',
) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('nombreArchivo', slot)
  formData.append('tipoDoc', tipoDoc)
  formData.append('folio', folio)
  formData.append('vigencia', vigencia)

  const res = await fetch('/api/documento-conductor', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: formData,
  })
  if (!res.ok) {
    const detalle = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(detalle?.error ?? 'No se pudo subir el documento.')
  }
  return res.json() as Promise<{ ok: true; path: string }>
}

// ── PREFERENCIAS Y SOPORTE ─────────────────────────────────

export async function guardarPreferenciasConductor(preferencias: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sesión no válida.')
  const { data, error } = await supabase.auth.updateUser({
    data: { ...user.user_metadata, preferencias_conductor: preferencias },
  })
  if (error) throw error
  return data
}

export async function crearIncidenciaConductor(datos: { viajeId: string | null; tipo: string; descripcion: string }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')
  const res = await fetch('/api/crear-incidencia', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(datos),
  })
  if (!res.ok) {
    const detalle = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(detalle?.error ?? 'No se pudo registrar la incidencia.')
  }
  return res.json() as Promise<{ ok: true; id: string }>
}

export async function eliminarCuentaConductor() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Sesión no válida.')
  const res = await fetch('/api/eliminar-cuenta', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) {
    const detalle = await res.json().catch(() => null) as { error?: string } | null
    throw new Error(detalle?.error ?? 'No se pudo eliminar la cuenta.')
  }
  await supabase.auth.signOut()
}

// ── REALTIME ────────────────────────────────────────────────

export function suscribirViajesAsignados(conductorId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`conductor-viajes-${conductorId}`)
    .on(
      'postgres_changes',
      {
        event: '*', schema: 'public', table: 'viajes',
        filter: `conductor_id=eq.${conductorId}`,
      },
      callback
    )
    .subscribe()
}
