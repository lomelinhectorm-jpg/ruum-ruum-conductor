// lib/hooks/useNotificacionesConductor.ts
import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface NotificacionConductor {
  id: string
  titulo: string
  cuerpo: string
  leida: boolean
  created_at: string
  viaje_id: string | null
}

// Centraliza la query + suscripción realtime a la tabla "notificaciones"
// para que tanto la campana del header como la tarjeta del panel
// muestren exactamente la misma información sin duplicar la lógica.
//
// OJO: supabase.channel(nombre) devuelve el MISMO canal si dos
// instancias usan el mismo nombre — y si la primera ya hizo
// .subscribe(), la segunda no puede agregarle más .on() (provoca
// "cannot add postgres_changes callbacks ... after subscribe()").
// Como el bell del header y la tarjeta del panel usan este hook al
// mismo tiempo con el mismo conductorId, cada instancia necesita su
// propio canal — por eso el nombre incluye un useId() único por
// instancia del hook, no solo el conductorId.
export function useNotificacionesConductor(conductorId: string | null) {
  const [notificaciones, setNotificaciones] = useState<NotificacionConductor[]>([])
  const instanceId = useId()

  // cargar() solo trae datos y los devuelve — el setState vive en quien
  // la llama, para evitar el lint react-hooks/set-state-in-effect.
  const cargar = useCallback(async (id: string): Promise<NotificacionConductor[]> => {
    const { data } = await supabase.from('notificaciones')
      .select('id,titulo,cuerpo,leida,created_at,viaje_id')
      .eq('destinatario_tipo', 'conductor')
      .eq('destinatario_id', id)
      .order('created_at', { ascending: false })
      .limit(30)
    return (data as NotificacionConductor[]) ?? []
  }, [])

  useEffect(() => {
    if (!conductorId) return
    let activo = true
    cargar(conductorId).then(data => { if (activo) setNotificaciones(data) })
    const channel = supabase.channel(`notificaciones-conductor-${conductorId}-${instanceId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `destinatario_id=eq.${conductorId}` }, () => {
        cargar(conductorId).then(data => { if (activo) setNotificaciones(data) })
      })
      .subscribe()
    return () => { activo = false; void supabase.removeChannel(channel) }
  }, [conductorId, cargar, instanceId])

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

  return { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas }
}