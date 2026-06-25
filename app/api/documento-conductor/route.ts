import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_FILE_BYTES = 3 * 1024 * 1024
const MIME_PERMITIDOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
const TIPOS_DOCUMENTO: Record<string, string> = {
  Licencia: 'Licencia de conducir',
  'INE / Pasaporte': 'Identificación oficial',
  'Comprobante domicilio': 'Comprobante de domicilio',
  'Constancia fiscal': 'Constancia de situación fiscal',
  'Foto perfil': 'Fotografía de perfil',
  Otro: 'Otro documento',
}
const NOMBRES_PERMITIDOS = new Set([
  'licencia-frente', 'licencia-reverso', 'ine-frente',
  'comprobante-domicilio', 'constancia-fiscal', 'otro-documento',
  'foto-perfil',
])
const SLOTS_LICENCIA = new Set(['licencia-frente', 'licencia-reverso'])

function response(error: string, status: number) {
  return NextResponse.json({ error }, { status })
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return response('Configuración incompleta.', 500)
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return response('No autenticado.', 401)
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user } } = await admin.auth.getUser(token)
  if (!user) return response('Sesión inválida.', 401)
  const { data: conductor } = await admin.from('conductores').select('id').eq('auth_id', user.id).maybeSingle()
  if (!conductor) return response('Perfil de conductor no encontrado.', 404)
  const pathSolicitado = new URL(request.url).searchParams.get('path')
  const query = admin.from('documentos')
    .select('id, slot, tipo_doc, folio, fecha_vencimiento, estatus, motivo_rechazo, version, archivo_url, created_at')
    .eq('entidad_tipo', 'Conductor').eq('entidad_id', conductor.id)
  const { data: documentos, error: docsError } = pathSolicitado
    ? await query.eq('archivo_url', pathSolicitado).limit(1)
    : await query.order('created_at', { ascending: false })
  if (docsError) return response(docsError.message, 500)
  if (pathSolicitado && !documentos?.length) return response('Documento no encontrado.', 404)
  const firmados = await Promise.all((documentos ?? []).map(async doc => {
    const { data } = await admin.storage.from('documentos').createSignedUrl(doc.archivo_url, 3600)
    return { ...doc, signed_url: data?.signedUrl ?? null }
  }))
  return NextResponse.json(pathSolicitado ? { url: firmados[0]?.signed_url ?? null } : { documentos: firmados })
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return response('Configuración incompleta.', 500)

  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return response('No autenticado.', 401)

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) return response('Sesión inválida.', 401)

  const { data: conductor } = await admin
    .from('conductores')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!conductor) return response('Perfil de conductor no encontrado.', 404)

  const form = await request.formData().catch(() => null)
  if (!form) return response('No se pudo leer el documento.', 400)
  const file = form.get('file') as File | null
  const nombreArchivo = String(form.get('nombreArchivo') ?? '')
  const tipoDoc = String(form.get('tipoDoc') ?? '')
  const folio = String(form.get('folio') ?? '') || null
  const vigencia = String(form.get('vigencia') ?? '') || null

  if (!file || file.size === 0) return response('Archivo requerido.', 400)
  if (file.size > MAX_FILE_BYTES) return response('El archivo excede el límite de 3 MB.', 413)
  if (!MIME_PERMITIDOS[file.type]) return response('Formato no permitido. Usa JPG, PNG, WEBP o PDF.', 415)
  const tipoDocDb = TIPOS_DOCUMENTO[tipoDoc]
  if (!NOMBRES_PERMITIDOS.has(nombreArchivo) || !tipoDocDb) return response('Tipo de documento inválido.', 400)
  if (SLOTS_LICENCIA.has(nombreArchivo) && (!folio || !vigencia)) {
    return response('La licencia requiere folio y vigencia.', 400)
  }

  const { data: ultimo } = await admin.from('documentos')
    .select('id, version')
    .eq('entidad_tipo', 'Conductor')
    .eq('entidad_id', conductor.id)
    .eq('slot', nombreArchivo)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  const version = Number(ultimo?.version ?? 0) + 1
  const ext = MIME_PERMITIDOS[file.type]
  const path = `conductores/${user.id}/${nombreArchivo}-v${version}.${ext}`
  const { error: storageError } = await admin.storage.from('documentos').upload(
    path,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type || 'application/octet-stream', upsert: true }
  )
  if (storageError) return response('No se pudo almacenar el documento.', 500)

  const payload = {
    slot: nombreArchivo,
    tipo_doc: tipoDocDb,
    entidad_tipo: 'Conductor',
    entidad_id: conductor.id,
    folio,
    fecha_vencimiento: vigencia,
    estatus: 'En revisión',
    version,
    reemplaza_documento_id: ultimo?.id ?? null,
    archivo_url: path,
  }
  const { error: dbError } = await admin.from('documentos').insert(payload)
  if (dbError) {
    console.error('Error registrando documento:', dbError)
    return response(`El archivo se guardó, pero no pudo registrarse: ${dbError.message}`, 500)
  }

  await admin.rpc('evaluar_certificacion_conductor', { p_conductor_id: conductor.id })
  await admin.from('timeline_operativo').insert({
    entidad_tipo: 'conductor',
    entidad_id: conductor.id,
    conductor_id: conductor.id,
    actor_id: conductor.id,
    actor_tipo: 'conductor',
    evento: `Documento enviado: ${nombreArchivo}`,
    estado_nuevo: 'En revisión',
    metadata: { slot: nombreArchivo, version, tipo_doc: tipoDocDb },
  })

  return NextResponse.json({ ok: true, path })
}
