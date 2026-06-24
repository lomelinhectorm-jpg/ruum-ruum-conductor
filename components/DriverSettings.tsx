'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft, Bell, Building2, Camera, Car, ChevronDown, ChevronRight,
  CircleHelp, CreditCard, FileText, Headphones, History, LockKeyhole,
  LogOut, MapPin, Save, ShieldCheck, Trash2, Upload, User, Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  actualizarPerfilConductor, eliminarCuentaConductor, getDocumentosConductor,
  getUrlDocumentoConductor, guardarPreferenciasConductor, subirDocumentoConductor,
} from '@/lib/queries/conductor'
import { formatMoney } from '@/lib/design-system/utils'
import { RRBadge, RRButton, RRCard } from '@/components/rr'

type Perfil = {
  id: string; nombre: string; apellido: string; email: string; telefono: string
  curp?: string | null; foto_url?: string | null
  domicilio_calle?: string | null; domicilio_numero?: string | null
  domicilio_colonia?: string | null; domicilio_cp?: string | null
  municipio?: string | null; estado_geo?: string | null
  cuenta_banco?: string | null; cuenta_clabe?: string | null; cuenta_titular?: string | null
  certificacion?: string; calificacion: number; viajes_realizados: number
}

type Viaje = {
  id: string; folio: string | null; status: string; fecha_programada: string | null
  origen_calle: string | null; destino_calle: string | null; pago_conductor: number
  tipos_servicio?: { nombre: string; descripcion: string | null } | null
}

type Documento = {
  id: string; tipo_doc: string; folio: string | null; fecha_vencimiento: string | null
  estatus: string; archivo_url: string; created_at: string
}

type Seccion = 'menu' | 'cuenta' | 'banco' | 'documentos' | 'preferencias' | 'historial' | 'soporte' | 'seguridad'

const input = 'w-full rounded-xl border border-rr-gray200 bg-white px-3 py-2.5 text-sm text-rr-black outline-none focus:ring-2 focus:ring-rr-primary'

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <div className="mb-5 flex items-center gap-3"><button onClick={onBack} className="rounded-full p-2 text-rr-gray500 hover:bg-rr-gray100"><ArrowLeft className="h-5 w-5" /></button><h2 className="text-xl font-bold text-rr-black">{title}</h2></div>
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-rr-gray500">{children}</label>
}

function CuentaEditor({ conductor, onBack, onSaved }: { conductor: Perfil; onBack: () => void; onSaved: (p: Perfil) => void }) {
  const [form, setForm] = useState({
    nombre: conductor.nombre, apellido: conductor.apellido, telefono: conductor.telefono, curp: conductor.curp ?? '',
    calle: conductor.domicilio_calle ?? '', numero: conductor.domicilio_numero ?? '', colonia: conductor.domicilio_colonia ?? '',
    cp: conductor.domicilio_cp ?? '', municipio: conductor.municipio ?? '', estado: conductor.estado_geo ?? '',
  })
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!conductor.foto_url) return
    getUrlDocumentoConductor(conductor.foto_url).then(setAvatar).catch(() => undefined)
  }, [conductor.foto_url])

  const guardar = async () => {
    setGuardando(true); setMensaje('')
    try {
      const actualizado = await actualizarPerfilConductor(conductor.id, {
        nombre: form.nombre.trim().toUpperCase(), apellido: form.apellido.trim().toUpperCase(),
        telefono: form.telefono.trim(), curp: form.curp.trim().toUpperCase() || null,
        domicilio_calle: form.calle.trim().toUpperCase() || null, domicilio_numero: form.numero.trim().toUpperCase() || null,
        domicilio_colonia: form.colonia.trim().toUpperCase() || null, domicilio_cp: form.cp.trim() || null,
        municipio: form.municipio.trim().toUpperCase() || null, estado_geo: form.estado.trim().toUpperCase() || null,
      })
      onSaved(actualizado as Perfil); setMensaje('Datos actualizados correctamente.')
    } catch (e) { setMensaje(e instanceof Error ? e.message : 'No se pudo guardar.') }
    setGuardando(false)
  }

  const subirFoto = async (file: File) => {
    setMensaje('Subiendo fotografía...')
    try {
      const r = await subirDocumentoConductor(file, 'foto-perfil', 'Foto perfil')
      const actualizado = await actualizarPerfilConductor(conductor.id, { foto_url: r.path })
      onSaved(actualizado as Perfil)
      setAvatar(URL.createObjectURL(file)); setMensaje('Fotografía actualizada.')
    } catch (e) { setMensaje(e instanceof Error ? e.message : 'No se pudo subir la fotografía.') }
  }

  const set = (key: keyof typeof form, value: string) => setForm(f => ({ ...f, [key]: value }))
  return <>
    <SubHeader title="Datos de cuenta" onBack={onBack} />
    <RRCard className="mb-4 p-4">
      <div className="mb-5 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-rr-primary text-xl font-black text-rr-secondary">
          {/* La URL es firmada/temporal y no puede pasar por el optimizador remoto de Next. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {avatar ? <img src={avatar} alt="Foto de perfil" className="h-full w-full object-cover" /> : `${conductor.nombre[0]}${conductor.apellido[0]}`}
        </div>
        <div><button onClick={() => avatarRef.current?.click()} className="flex items-center gap-2 text-sm font-semibold text-rr-black"><Camera className="h-4 w-4" /> Cambiar fotografía</button><p className="mt-1 text-xs text-rr-gray500">JPG o PNG, máximo 3 MB</p></div>
        <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && subirFoto(e.target.files[0])} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nombre</Label><input className={input} value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
        <div><Label>Apellidos</Label><input className={input} value={form.apellido} onChange={e => set('apellido', e.target.value)} /></div>
        <div className="col-span-2"><Label>Correo</Label><input className={`${input} bg-rr-gray100`} value={conductor.email} disabled /><p className="mt-1 text-[11px] text-rr-gray500">El correo de acceso se protege por seguridad.</p></div>
        <div><Label>Teléfono</Label><input className={input} value={form.telefono} onChange={e => set('telefono', e.target.value)} /></div>
        <div><Label>CURP</Label><input className={input} maxLength={18} value={form.curp} onChange={e => set('curp', e.target.value)} /></div>
        <div><Label>País</Label><input className={`${input} bg-rr-gray100`} value="México" disabled /></div>
        <div><Label>Estado</Label><input className={input} value={form.estado} onChange={e => set('estado', e.target.value)} /></div>
        <div className="col-span-2"><Label>Calle</Label><input className={input} value={form.calle} onChange={e => set('calle', e.target.value)} /></div>
        <div><Label>Número</Label><input className={input} value={form.numero} onChange={e => set('numero', e.target.value)} /></div>
        <div><Label>Colonia</Label><input className={input} value={form.colonia} onChange={e => set('colonia', e.target.value)} /></div>
        <div><Label>Código postal</Label><input className={input} maxLength={5} value={form.cp} onChange={e => set('cp', e.target.value.replace(/\D/g, ''))} /></div>
        <div><Label>Municipio</Label><input className={input} value={form.municipio} onChange={e => set('municipio', e.target.value)} /></div>
      </div>
      {mensaje && <p className="mt-3 text-xs font-medium text-rr-gray700">{mensaje}</p>}
      <RRButton className="mt-4" fullWidth onClick={guardar} disabled={guardando}><Save className="h-4 w-4" />{guardando ? 'Guardando...' : 'Guardar cambios'}</RRButton>
    </RRCard>
  </>
}

function BancoEditor({ conductor, onBack, onSaved }: { conductor: Perfil; onBack: () => void; onSaved: (p: Perfil) => void }) {
  const [form, setForm] = useState({ banco: conductor.cuenta_banco ?? '', clabe: conductor.cuenta_clabe ?? '', titular: conductor.cuenta_titular ?? '' })
  const [editando, setEditando] = useState(!conductor.cuenta_clabe)
  const [mensaje, setMensaje] = useState('')
  const guardar = async () => {
    if (form.clabe && form.clabe.length !== 18) { setMensaje('La CLABE debe contener 18 dígitos.'); return }
    try {
      const actualizado = await actualizarPerfilConductor(conductor.id, { cuenta_banco: form.banco || null, cuenta_clabe: form.clabe || null, cuenta_titular: form.titular || null })
      onSaved(actualizado as Perfil); setEditando(false); setMensaje('Cuenta bancaria actualizada.')
    } catch (e) { setMensaje(e instanceof Error ? e.message : 'No se pudo guardar.') }
  }
  const oculta = form.clabe ? `•••• •••• •••• ${form.clabe.slice(-4)}` : 'Sin CLABE registrada'
  return <><SubHeader title="Cuenta bancaria" onBack={onBack} /><RRCard className="p-4">
    {!editando ? <div className="space-y-3"><div className="rounded-xl bg-rr-secondary p-4 text-white"><p className="text-xs text-white/60">Cuenta para depósitos</p><p className="mt-2 font-bold">{form.banco || 'Banco no indicado'}</p><p className="mt-1 tracking-wider">{oculta}</p><p className="mt-3 text-xs text-white/60">{form.titular || conductor.nombre + ' ' + conductor.apellido}</p></div><RRButton fullWidth variant="secondary" onClick={() => setEditando(true)}>Validar y editar</RRButton></div> : <div className="space-y-3"><div><Label>Banco</Label><input className={input} value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value.toUpperCase() }))} /></div><div><Label>CLABE interbancaria</Label><input className={input} maxLength={18} value={form.clabe} onChange={e => setForm(f => ({ ...f, clabe: e.target.value.replace(/\D/g, '') }))} /></div><div><Label>Titular</Label><input className={input} value={form.titular} onChange={e => setForm(f => ({ ...f, titular: e.target.value.toUpperCase() }))} /></div><p className="text-xs text-rr-gray500">Por seguridad, confirma que los datos corresponden a una cuenta a tu nombre.</p><RRButton fullWidth onClick={guardar}>Guardar cuenta</RRButton></div>}
    {mensaje && <p className="mt-3 text-xs text-rr-gray700">{mensaje}</p>}
  </RRCard></>
}

const slots = [
  { slot: 'licencia-frente', tipo: 'Licencia', label: 'Licencia de conducir' },
  { slot: 'ine-frente', tipo: 'INE / Pasaporte', label: 'Identificación oficial' },
  { slot: 'comprobante-domicilio', tipo: 'Comprobante domicilio', label: 'Comprobante de domicilio' },
  { slot: 'constancia-fiscal', tipo: 'Constancia fiscal', label: 'Constancia de situación fiscal' },
  { slot: 'otro-documento', tipo: 'Otro', label: 'Otro documento requerido' },
] as const

function DocumentosEditor({ conductorId, onBack }: { conductorId: string; onBack: () => void }) {
  const [docs, setDocs] = useState<Documento[]>([])
  const [subiendo, setSubiendo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const cargar = useCallback(() => getDocumentosConductor(conductorId).then(d => setDocs(d as Documento[])).catch(e => setMensaje(e.message)), [conductorId])
  useEffect(() => { void cargar() }, [cargar])
  const buscar = (slot: string, tipo: string) => docs.find(d => d.archivo_url.includes(`/${slot}.`) || d.tipo_doc.toLowerCase().includes(tipo.toLowerCase().split(' ')[0]))
  const subir = async (file: File, cfg: typeof slots[number]) => {
    setSubiendo(cfg.slot); setMensaje('')
    try { await subirDocumentoConductor(file, cfg.slot, cfg.tipo); await cargar(); setMensaje(`${cfg.label} enviado a revisión.`) }
    catch (e) { setMensaje(e instanceof Error ? e.message : 'No se pudo subir.') }
    setSubiendo('')
  }
  const ver = async (doc: Documento) => { const url = await getUrlDocumentoConductor(doc.archivo_url); if (url) window.open(url, '_blank', 'noopener,noreferrer') }
  return <><SubHeader title="Tus documentos" onBack={onBack} /><div className="space-y-3">{slots.map(cfg => { const doc = buscar(cfg.slot, cfg.tipo); return <RRCard key={cfg.slot} className="p-4"><div className="flex items-start gap-3"><div className="rounded-lg bg-rr-gray100 p-2"><FileText className="h-5 w-5 text-rr-gray700" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-rr-black">{cfg.label}</p>{doc ? <><div className="mt-1 flex flex-wrap items-center gap-2"><RRBadge variant={doc.estatus === 'Aprobado' ? 'success' : doc.estatus === 'Rechazado' || doc.estatus === 'Vencido' ? 'danger' : 'pending'}>{doc.estatus}</RRBadge>{doc.fecha_vencimiento && <span className="text-xs text-rr-gray500">Vence {doc.fecha_vencimiento}</span>}</div><button onClick={() => ver(doc)} className="mt-2 text-xs font-semibold text-rr-gray700 underline">Ver archivo</button></> : <p className="mt-1 text-xs text-rr-gray500">Pendiente de carga</p>}</div><label className="cursor-pointer rounded-lg bg-rr-secondary px-3 py-2 text-xs font-semibold text-white"><Upload className="mr-1 inline h-3 w-3" />{subiendo === cfg.slot ? 'Subiendo' : doc ? 'Actualizar' : 'Subir'}<input type="file" accept="image/*,.pdf" className="hidden" disabled={Boolean(subiendo)} onChange={e => e.target.files?.[0] && subir(e.target.files[0], cfg)} /></label></div></RRCard> })}</div>{mensaje && <p className="mt-4 text-xs font-medium text-rr-gray700">{mensaje}</p>}</>
}

type Preferencias = {
  push: boolean; noMolestar: boolean; desde: string; hasta: string
  nuevosViajes: boolean; pagos: boolean; documentos: boolean; administrativas: boolean
  locales: boolean; foraneos: boolean; nocturnos: boolean; empresariales: boolean; personales: boolean
  capacidad: string; vehiculos: string; manual: boolean; automatica: boolean
}
const prefsDefault: Preferencias = { push: true, noMolestar: false, desde: '22:00', hasta: '07:00', nuevosViajes: true, pagos: true, documentos: true, administrativas: true, locales: true, foraneos: true, nocturnos: false, empresariales: true, personales: true, capacidad: '1', vehiculos: 'Todos', manual: true, automatica: true }

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 py-2 text-sm text-rr-gray700"><span>{label}</span><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="h-5 w-5 accent-rr-primary" /></label>
}

function PreferenciasEditor({ onBack }: { onBack: () => void }) {
  const [prefs, setPrefs] = useState<Preferencias>(prefsDefault)
  const [mensaje, setMensaje] = useState('')
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { const saved = data.user?.user_metadata?.preferencias_conductor as Partial<Preferencias> | undefined; if (saved) setPrefs(p => ({ ...p, ...saved })) }) }, [])
  const set = <K extends keyof Preferencias>(k: K, value: Preferencias[K]) => setPrefs(p => ({ ...p, [k]: value }))
  const guardar = async () => { try { await guardarPreferenciasConductor(prefs); setMensaje('Preferencias guardadas.') } catch (e) { setMensaje(e instanceof Error ? e.message : 'No se pudo guardar.') } }
  const probar = async () => { if (!('Notification' in window)) return setMensaje('Este dispositivo no admite notificaciones.'); const permiso = await Notification.requestPermission(); if (permiso === 'granted') new Notification('Ruum Ruum', { body: 'Tus notificaciones están funcionando correctamente.' }); setMensaje(permiso === 'granted' ? 'Notificación de prueba enviada.' : 'Permiso de notificaciones no concedido.') }
  return <><SubHeader title="Preferencias" onBack={onBack} /><RRCard className="mb-4 p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><Bell className="h-4 w-4" />Notificaciones</h3><Toggle label="Notificaciones push" checked={prefs.push} onChange={v => set('push', v)} /><Toggle label="Modo no molestar" checked={prefs.noMolestar} onChange={v => set('noMolestar', v)} />{prefs.noMolestar && <div className="grid grid-cols-2 gap-3 py-2"><div><Label>Desde</Label><input type="time" className={input} value={prefs.desde} onChange={e => set('desde', e.target.value)} /></div><div><Label>Hasta</Label><input type="time" className={input} value={prefs.hasta} onChange={e => set('hasta', e.target.value)} /></div></div>}<Toggle label="Nuevos viajes" checked={prefs.nuevosViajes} onChange={v => set('nuevosViajes', v)} /><Toggle label="Pagos" checked={prefs.pagos} onChange={v => set('pagos', v)} /><Toggle label="Documentos" checked={prefs.documentos} onChange={v => set('documentos', v)} /><Toggle label="Avisos administrativos" checked={prefs.administrativas} onChange={v => set('administrativas', v)} /><RRButton variant="secondary" fullWidth className="mt-2" onClick={probar}>Probar notificación</RRButton></RRCard><RRCard className="p-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold"><Car className="h-4 w-4" />Preferencias de viaje</h3><Toggle label="Viajes locales" checked={prefs.locales} onChange={v => set('locales', v)} /><Toggle label="Viajes foráneos" checked={prefs.foraneos} onChange={v => set('foraneos', v)} /><Toggle label="Viajes nocturnos" checked={prefs.nocturnos} onChange={v => set('nocturnos', v)} /><Toggle label="Viajes empresariales" checked={prefs.empresariales} onChange={v => set('empresariales', v)} /><Toggle label="Viajes personales" checked={prefs.personales} onChange={v => set('personales', v)} /><div className="mt-2 grid grid-cols-2 gap-3"><div><Label>Capacidad</Label><select className={input} value={prefs.capacidad} onChange={e => set('capacidad', e.target.value)}><option value="1">1 unidad</option><option value="2">2 unidades</option><option value="3+">3 o más</option></select></div><div><Label>Vehículos</Label><select className={input} value={prefs.vehiculos} onChange={e => set('vehiculos', e.target.value)}><option>Todos</option><option>Automóviles</option><option>SUV</option><option>Pick-up</option><option>Comercial</option></select></div></div><Toggle label="Transmisión estándar/manual" checked={prefs.manual} onChange={v => set('manual', v)} /><Toggle label="Transmisión automática" checked={prefs.automatica} onChange={v => set('automatica', v)} /></RRCard>{mensaje && <p className="mt-3 text-xs font-medium text-rr-gray700">{mensaje}</p>}<RRButton fullWidth className="mt-4" onClick={guardar}><Save className="h-4 w-4" />Guardar preferencias</RRButton></>
}

function Historial({ viajes, onBack }: { viajes: Viaje[]; onBack: () => void }) {
  const [estatus, setEstatus] = useState('Todos'); const [buscar, setBuscar] = useState(''); const [desde, setDesde] = useState('')
  const filtrados = useMemo(() => viajes.filter(v => (estatus === 'Todos' || v.status === estatus) && (!desde || (v.fecha_programada ?? '') >= desde) && (!buscar || `${v.origen_calle} ${v.destino_calle} ${v.folio}`.toLowerCase().includes(buscar.toLowerCase()))), [viajes, estatus, buscar, desde])
  return <><SubHeader title="Historial de viajes" onBack={onBack} /><RRCard className="mb-4 grid grid-cols-2 gap-2 p-3"><input className={`${input} col-span-2`} placeholder="Origen, destino o folio" value={buscar} onChange={e => setBuscar(e.target.value)} /><select className={input} value={estatus} onChange={e => setEstatus(e.target.value)}><option>Todos</option><option>Finalizado</option><option>Cancelado</option><option>En revisión por incidencia</option></select><input type="date" className={input} value={desde} onChange={e => setDesde(e.target.value)} /></RRCard><div className="space-y-3">{filtrados.length ? filtrados.map(v => <RRCard key={v.id} className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-bold text-rr-black">{v.origen_calle || 'Origen'} → {v.destino_calle || 'Destino'}</p><p className="mt-1 text-xs text-rr-gray500">{v.fecha_programada || 'Sin fecha'} · {v.folio || v.id.slice(0, 8)}</p><p className="mt-1 text-xs text-rr-gray500">{v.tipos_servicio?.nombre || 'Traslado de vehículo'}</p></div><div className="text-right"><RRBadge variant={v.status === 'Finalizado' ? 'success' : v.status === 'Cancelado' ? 'danger' : 'neutral'}>{v.status}</RRBadge><p className="mt-2 text-sm font-bold text-rr-success">{formatMoney(v.pago_conductor)}</p></div></div></RRCard>) : <RRCard className="p-8 text-center text-sm text-rr-gray500">No encontramos viajes con esos filtros.</RRCard>}</div></>
}

const faqs = [
  ['¿Cuándo recibo mis pagos?', 'Los depósitos se programan por semana. Consulta la fecha y el desglose en Mis ganancias.'],
  ['¿Cómo acepto un viaje?', 'Activa tu disponibilidad y abre Viajes solicitados. Revisa los datos antes de aceptar.'],
  ['¿Qué evidencia debo cargar?', 'Fotografías del vehículo, tablero, kilometraje, combustible, llaves y daños visibles al recoger y entregar.'],
  ['¿Qué hago si ocurre un problema?', 'Usa Reportar incidencia desde el viaje o desde esta sección para avisar al equipo operativo.'],
]
function Soporte({ onBack, onLogout, onDelete }: { onBack: () => void; onLogout: () => void; onDelete: () => void }) {
  const [abierta, setAbierta] = useState<number | null>(null)
  return <><SubHeader title="Ayuda y soporte" onBack={onBack} /><RRCard className="mb-4 overflow-hidden p-0"><div className="p-4"><h3 className="flex items-center gap-2 text-sm font-bold"><CircleHelp className="h-4 w-4" />Preguntas frecuentes</h3></div>{faqs.map(([q, a], i) => <button key={q} onClick={() => setAbierta(abierta === i ? null : i)} className="w-full border-t border-rr-gray100 p-4 text-left"><div className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{q}</span><ChevronDown className={`h-4 w-4 transition-transform ${abierta === i ? 'rotate-180' : ''}`} /></div>{abierta === i && <p className="mt-2 text-xs leading-relaxed text-rr-gray500">{a}</p>}</button>)}</RRCard><RRCard className="mb-4 p-4"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Headphones className="h-4 w-4" />Contacto</h3><a href="mailto:soporte@moviliax.com?subject=Soporte%20Ruum%20Ruum%20Conductor" className="block rounded-xl bg-rr-secondary p-3 text-center text-sm font-semibold text-white">Contactar a soporte</a><p className="mt-2 text-center text-xs text-rr-gray500">Incluye tu folio de viaje si el problema está relacionado con un traslado.</p></RRCard><button onClick={onLogout} className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rr-gray200 bg-white py-3 text-sm font-semibold text-rr-gray700"><LogOut className="h-4 w-4" />Cerrar sesión</button><button onClick={onDelete} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600"><Trash2 className="h-4 w-4" />Eliminar cuenta</button></>
}

function Seguridad({ onBack }: { onBack: () => void }) {
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [mensaje, setMensaje] = useState('')
  const guardar = async () => { if (p1.length < 8 || !/[A-Za-z]/.test(p1) || !/\d/.test(p1)) return setMensaje('Usa al menos 8 caracteres, una letra y un número.'); if (p1 !== p2) return setMensaje('Las contraseñas no coinciden.'); const { error } = await supabase.auth.updateUser({ password: p1 }); setMensaje(error ? error.message : 'Contraseña actualizada.'); if (!error) { setP1(''); setP2('') } }
  return <><SubHeader title="Seguridad" onBack={onBack} /><RRCard className="space-y-3 p-4"><div><Label>Nueva contraseña</Label><input type="password" className={input} value={p1} onChange={e => setP1(e.target.value)} /></div><div><Label>Confirmar contraseña</Label><input type="password" className={input} value={p2} onChange={e => setP2(e.target.value)} /></div>{mensaje && <p className="text-xs text-rr-gray700">{mensaje}</p>}<RRButton fullWidth onClick={guardar}>Cambiar contraseña</RRButton></RRCard></>
}

export default function DriverSettings({ conductor, viajes, onBack, onProfileUpdated }: { conductor: Perfil | null; viajes: Viaje[]; onBack: () => void; onProfileUpdated: (p: Perfil) => void }) {
  const [seccion, setSeccion] = useState<Seccion>('menu')
  if (!conductor) return <section className="p-5"><p className="text-sm text-rr-gray500">Cargando perfil...</p></section>
  const logout = async () => { await supabase.auth.signOut() }
  const eliminar = async () => { if (!window.confirm('Esta acción eliminará tu acceso. No puede deshacerse. ¿Deseas continuar?')) return; const validacion = window.prompt('Para confirmar, escribe ELIMINAR'); if (validacion !== 'ELIMINAR') return; try { await eliminarCuentaConductor() } catch (e) { alert(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.') } }
  if (seccion === 'cuenta') return <section className="rr-fade-in p-5 pb-24"><CuentaEditor conductor={conductor} onBack={() => setSeccion('menu')} onSaved={onProfileUpdated} /></section>
  if (seccion === 'banco') return <section className="rr-fade-in p-5 pb-24"><BancoEditor conductor={conductor} onBack={() => setSeccion('menu')} onSaved={onProfileUpdated} /></section>
  if (seccion === 'documentos') return <section className="rr-fade-in p-5 pb-24"><DocumentosEditor conductorId={conductor.id} onBack={() => setSeccion('menu')} /></section>
  if (seccion === 'preferencias') return <section className="rr-fade-in p-5 pb-24"><PreferenciasEditor onBack={() => setSeccion('menu')} /></section>
  if (seccion === 'historial') return <section className="rr-fade-in p-5 pb-24"><Historial viajes={viajes} onBack={() => setSeccion('menu')} /></section>
  if (seccion === 'soporte') return <section className="rr-fade-in p-5 pb-24"><Soporte onBack={() => setSeccion('menu')} onLogout={logout} onDelete={eliminar} /></section>
  if (seccion === 'seguridad') return <section className="rr-fade-in p-5 pb-24"><Seguridad onBack={() => setSeccion('menu')} /></section>
  const items = [
    { id: 'cuenta' as const, icon: User, label: 'Cuenta y perfil', sub: 'Datos personales y dirección' },
    { id: 'banco' as const, icon: Wallet, label: 'Cuenta bancaria', sub: conductor.cuenta_clabe ? `CLABE •••• ${conductor.cuenta_clabe.slice(-4)}` : 'Agrega una cuenta para depósitos' },
    { id: 'documentos' as const, icon: FileText, label: 'Tus documentos', sub: 'Consulta, carga y actualiza' },
    { id: 'historial' as const, icon: History, label: 'Historial de viajes', sub: `${viajes.length} viajes registrados` },
    { id: 'preferencias' as const, icon: Bell, label: 'Preferencias', sub: 'Notificaciones y tipos de viaje' },
    { id: 'seguridad' as const, icon: LockKeyhole, label: 'Seguridad', sub: 'Cambiar contraseña' },
    { id: 'soporte' as const, icon: Headphones, label: 'Soporte', sub: 'Ayuda, contacto y cuenta' },
  ]
  return <section className="rr-fade-in p-5 pb-24"><div className="mb-5 flex items-center gap-3"><button onClick={onBack} className="text-sm text-rr-gray500">← Volver</button><h2 className="text-xl font-bold text-rr-black">Configuración</h2></div><RRCard className="mb-5 p-5"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-rr-primary text-xl font-black text-rr-secondary">{conductor.nombre[0]}{conductor.apellido[0]}</div><div><h3 className="font-bold text-rr-black">{conductor.nombre} {conductor.apellido}</h3><p className="text-sm text-rr-gray500">{conductor.email}</p><div className="mt-1 flex items-center gap-2"><RRBadge variant="success"><ShieldCheck className="h-3 w-3" />{conductor.certificacion || 'Conductor'}</RRBadge><span className="text-xs text-rr-gray500">★ {conductor.calificacion.toFixed(1)}</span></div></div></div></RRCard><div className="space-y-2">{items.map(item => <button key={item.id} onClick={() => setSeccion(item.id)} className="w-full"><RRCard className="flex items-center gap-3 p-4 text-left"><div className="rounded-lg bg-rr-gray100 p-2.5"><item.icon className="h-5 w-5 text-rr-gray700" /></div><div className="flex-1"><p className="text-sm font-semibold text-rr-black">{item.label}</p><p className="text-xs text-rr-gray500">{item.sub}</p></div><ChevronRight className="h-4 w-4 text-rr-gray300" /></RRCard></button>)}</div></section>
}
