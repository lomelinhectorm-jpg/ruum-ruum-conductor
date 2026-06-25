import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TIPOS_INCIDENCIA, getConfigIncidencia } from '@/lib/constants/incidencias'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function response(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) return response('Configuración incompleta.', 500)
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return response('No autenticado.', 401)
  const body = await request.json().catch(() => null) as { viajeId?: string | null; tipo?: string; descripcion?: string } | null
  if (!body?.tipo || !TIPOS_INCIDENCIA.includes(body.tipo as typeof TIPOS_INCIDENCIA[number])) return response('Tipo de incidencia inválido.')
  if (!body.descripcion?.trim() || body.descripcion.trim().length < 10) return response('Describe la incidencia con al menos 10 caracteres.')

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: auth } = await admin.auth.getUser(token)
  if (!auth.user) return response('Sesión inválida.', 401)
  const { data: conductor } = await admin.from('conductores').select('id').eq('auth_id', auth.user.id).maybeSingle()
  if (!conductor) return response('Perfil de conductor no encontrado.', 404)

  const config = getConfigIncidencia(body.tipo)
  let viajeId: string | null = null
  let usuarioId: string | null = null
  if (body.viajeId) {
    const { data: viaje } = await admin.from('viajes').select('id, conductor_id, usuario_id').eq('id', body.viajeId).maybeSingle()
    if (!viaje || viaje.conductor_id !== conductor.id) return response('El viaje indicado no pertenece al conductor.', 403)
    viajeId = viaje.id
    usuarioId = viaje.usuario_id
  }

  const { data, error } = await admin.from('incidencias').insert({
    viaje_id: viajeId,
    usuario_id: usuarioId,
    conductor_id: conductor.id,
    tipo: body.tipo,
    descripcion: body.descripcion.trim(),
    estatus: 'Nueva',
    prioridad: config.prioridad,
    bloquea_viaje: config.bloqueaViaje,
    requiere_respuesta_operaciones: config.bloqueaViaje || ['Crítica'].includes(config.prioridad),
    metadata: { requiere_fotos: config.requiereFotos, sla_horas: config.slaHoras, origen: 'conductor_app' },
    responsable_interno: '—',
  }).select('id').single()
  if (error) return response(`No se pudo registrar la incidencia: ${error.message}`, 500)

  if (viajeId && config.bloqueaViaje) {
    await admin.from('viajes').update({ status: 'En revisión por incidencia' }).eq('id', viajeId)
    await admin.from('timeline_viaje').insert({
      viaje_id: viajeId,
      evento: `Incidencia bloqueante: ${body.tipo}`,
      actor: 'Sistema',
      actor_tipo: 'sistema',
    })
  }

  await admin.from('timeline_operativo').insert({
    entidad_tipo: 'incidencia',
    entidad_id: data.id,
    viaje_id: viajeId,
    conductor_id: conductor.id,
    actor_id: conductor.id,
    actor_tipo: 'conductor',
    evento: `Incidencia creada: ${body.tipo}`,
    estado_nuevo: 'Nueva',
    metadata: { prioridad: config.prioridad, bloquea_viaje: config.bloqueaViaje },
  })

  return NextResponse.json({ ok: true, id: data.id })
}
