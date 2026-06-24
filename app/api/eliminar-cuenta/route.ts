import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function DELETE(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) return NextResponse.json({ error: 'Configuración incompleta.' }, { status: 500 })
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'No autenticado.' }, { status: 401 })
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: auth } = await admin.auth.getUser(token)
  if (!auth.user) return NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 })

  const { data: conductor } = await admin.from('conductores').select('id').eq('auth_id', auth.user.id).maybeSingle()
  if (!conductor) return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 })
  const { count } = await admin.from('viajes').select('id', { count: 'exact', head: true })
    .eq('conductor_id', conductor.id)
    .not('status', 'in', '("Finalizado","Cancelado")')
  if ((count ?? 0) > 0) return NextResponse.json({ error: 'No puedes eliminar la cuenta mientras tengas viajes activos.' }, { status: 409 })

  const { error: profileError } = await admin.from('conductores').update({
    disponibilidad: 'No disponible',
    certificacion: 'Cuenta eliminada',
    email: `eliminado+${auth.user.id}@ruumruum.invalid`,
    telefono: '',
    cuenta_banco: null,
    cuenta_clabe: null,
    cuenta_titular: null,
  }).eq('id', conductor.id)
  if (profileError) return NextResponse.json({ error: 'No fue posible anonimizar los datos de la cuenta.' }, { status: 500 })
  const { error } = await admin.auth.admin.deleteUser(auth.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
