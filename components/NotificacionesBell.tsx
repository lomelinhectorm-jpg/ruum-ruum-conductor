'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Notificacion {
  id: string
  titulo: string
  cuerpo: string
  leida: boolean
  created_at: string
  viaje_id: string | null
}

export default function NotificacionesBell({ conductorId }: { conductorId: string | null }) {
  const [abierto, setAbierto] = useState(false)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const ref = useRef<HTMLDivElement>(null)

  // cargar() solo trae datos y los devuelve — el setState vive en el
  // .then() de quien la llama. Llamarla directo en el efecto y dejar que
  // ELLA haga el setState dispara react-hooks/set-state-in-effect.
  const cargar = useCallback(async (id: string): Promise<Notificacion[]> => {
    const { data } = await supabase.from('notificaciones')
      .select('id,titulo,cuerpo,leida,created_at,viaje_id')
      .eq('destinatario_tipo', 'conductor')
      .eq('destinatario_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
    return (data as Notificacion[]) ?? []
  }, [])

  useEffect(() => {
    if (!conductorId) return
    let activo = true
    cargar(conductorId).then(data => { if (activo) setNotificaciones(data) })
    const channel = supabase.channel(`notificaciones-conductor-${conductorId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `destinatario_id=eq.${conductorId}` }, () => {
        cargar(conductorId).then(data => { if (activo) setNotificaciones(data) })
      })
      .subscribe()
    return () => { activo = false; void supabase.removeChannel(channel) }
  }, [conductorId, cargar])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const marcarLeida = async (id: string) => {
    await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }

  const marcarTodasLeidas = async () => {
    if (!conductorId) return
    const sinLeer = notificaciones.filter(n => !n.leida)
    if (sinLeer.length === 0) return
    await supabase.from('notificaciones').update({ leida: true }).eq('destinatario_id', conductorId).in('id', sinLeer.map(n => n.id))
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }

  const noLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setAbierto(a => !a)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/15">
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>
      {abierto && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white text-rr-black border border-slate-200 rounded-rrMd shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 sticky top-0 bg-white">
            <p className="text-sm font-bold">Notificaciones</p>
            {noLeidas > 0 && (
              <button onClick={marcarTodasLeidas} className="text-xs text-rr-primary hover:underline">Marcar todas leídas</button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs italic">Sin notificaciones.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notificaciones.map(n => (
                <li key={n.id} onClick={() => !n.leida && marcarLeida(n.id)}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-slate-50 transition-colors ${!n.leida ? 'bg-rr-primary/5' : ''}`}>
                  <p className="font-semibold">{n.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.cuerpo}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{new Date(n.created_at).toLocaleString('es-MX')}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
