// lib/queries/conductor.ts — conductor-ruum

import { supabase } from '@/lib/supabase'

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

export async function getMiPerfilConductor() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('conductores')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  return data
}

export async function updateDisponibilidad(
  disponibilidad: 'Disponible' | 'No disponible' | 'En viaje' | 'Pausado'
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data, error } = await supabase
    .from('conductores')
    .update({ disponibilidad })
    .eq('auth_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ── VIAJES ──────────────────────────────────────────────────

export async function getMisViajesConductor() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { solicitados: [], aceptados: [] }

  const { data: conductor } = await supabase
    .from('conductores').select('id').eq('auth_id', user.id).single()
  if (!conductor) return { solicitados: [], aceptados: [] }

  const [{ data: asignados }, { data: activos }] = await Promise.all([
    // Viajes asignados aún no aceptados
    supabase.from('viajes').select(`
      id, folio, status, fecha_programada, hora_programada,
      origen_calle, origen_colonia, destino_calle, destino_colonia,
      pago_conductor,
      vehiculos(marca, modelo, placas, transmision)
    `)
      .eq('conductor_id', conductor.id)
      .eq('status', 'Conductor asignado')
      .order('created_at', { ascending: false }),

    // Viajes en curso o pendientes de acción del conductor
    supabase.from('viajes').select(`
      id, folio, status, fecha_programada, hora_programada,
      origen_calle, origen_numero, origen_colonia, origen_estado,
      origen_contacto, origen_telefono,
      destino_calle, destino_numero, destino_colonia, destino_estado,
      destino_contacto, destino_telefono,
      instrucciones, referencias, pago_conductor,
      vehiculos(marca, modelo, anio, color, placas, transmision),
      usuarios(nombre, apellido, telefono)
    `)
      .eq('conductor_id', conductor.id)
      .in('status', [
        'Conductor en camino','Recolección en proceso',
        'Evidencia inicial pendiente','Traslado en curso',
        'Entrega en proceso','Evidencia final pendiente',
      ])
      .order('updated_at', { ascending: false }),
  ])

  return { solicitados: asignados ?? [], aceptados: activos ?? [] }
}

export async function aceptarViaje(viajeId: string, conductorNombre: string) {
  const { data, error } = await supabase
    .from('viajes')
    .update({ status: 'Conductor en camino' })
    .eq('id', viajeId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('timeline_viaje').insert({
    viaje_id: viajeId,
    evento: 'Conductor aceptó el viaje',
    actor: conductorNombre,
    actor_tipo: 'conductor',
  })

  return data
}

export async function cambiarStatusViaje(
  viajeId: string,
  status: string,
  conductorNombre: string,
  evento: string
) {
  const { data, error } = await supabase
    .from('viajes')
    .update({ status })
    .eq('id', viajeId)
    .select()
    .single()

  if (error) throw error

  await supabase.from('timeline_viaje').insert({
    viaje_id: viajeId,
    evento,
    actor: conductorNombre,
    actor_tipo: 'conductor',
  })

  return data
}

// ── EVIDENCIA ───────────────────────────────────────────────

export async function subirEvidencia(payload: {
  viaje_id: string
  conductor_id: string
  km_inicial?: number
  km_final?: number
  combustible_inicial?: string
  combustible_final?: string
  llaves_recibidas?: number
  danos_iniciales?: string
  tipo: 'inicial' | 'final'
}) {
  const { tipo, ...rest } = payload

  // Verificar si ya existe evidencia para este viaje
  const { data: existente } = await supabase
    .from('evidencias')
    .select('id')
    .eq('viaje_id', payload.viaje_id)
    .single()

  if (existente) {
    // Actualizar existente
    const { data, error } = await supabase
      .from('evidencias')
      .update({
        ...rest,
        estatus: tipo === 'final' ? 'Completa' : 'En revisión',
      })
      .eq('id', existente.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    // Crear nueva
    const { data, error } = await supabase
      .from('evidencias')
      .insert({ ...rest, estatus: 'En revisión' })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ── GANANCIAS ────────────────────────────────────────────────

export async function getMisGanancias() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: conductor } = await supabase
    .from('conductores').select('id').eq('auth_id', user.id).single()
  if (!conductor) return []

  const { data, error } = await supabase
    .from('pagos_conductores')
    .select('*')
    .eq('conductor_id', conductor.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
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
