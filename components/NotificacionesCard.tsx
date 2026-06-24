'use client'

import { Bell } from 'lucide-react'
import { RRCard } from './rr/RRCard'
import { cn } from '@/lib/design-system/utils'
import { useNotificacionesConductor } from '@/lib/hooks/useNotificacionesConductor'

// Reemplaza la antigua tarjeta estática "Avisos importantes": ahora
// despliega las notificaciones reales del conductor (las mismas que
// se ven en la campana del header), permitiendo marcarlas como leídas
// directamente desde el panel.
export default function NotificacionesCard({ conductorId }: { conductorId: string | null }) {
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas } = useNotificacionesConductor(conductorId)

  return (
    <RRCard className="p-4">
      {notificaciones.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Bell className="h-6 w-6 text-rr-gray300" />
          <p className="text-xs text-rr-gray500">Sin notificaciones por ahora.</p>
        </div>
      ) : (
        <>
          {noLeidas > 0 && (
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-rr-trace">{noLeidas} sin leer</span>
              <button type="button" onClick={marcarTodasLeidas} className="text-xs font-semibold text-rr-gray500 hover:text-rr-black hover:underline">
                Marcar todas leídas
              </button>
            </div>
          )}
          <ul className="divide-y divide-rr-gray100">
            {notificaciones.slice(0, 8).map(n => (
              <li key={n.id} onClick={() => !n.leida && marcarLeida(n.id)}
                className={cn("cursor-pointer rounded-rrSm px-1 py-2.5 transition-colors hover:bg-rr-gray100", !n.leida && "bg-rr-primary/5")}>
                <p className="text-sm font-semibold text-rr-black">{n.titulo}</p>
                <p className="mt-0.5 text-xs text-rr-gray500">{n.cuerpo}</p>
                <p className="mt-1 text-[11px] text-rr-gray300">{new Date(n.created_at).toLocaleString('es-MX')}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </RRCard>
  )
}