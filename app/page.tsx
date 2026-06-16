"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AlertCircle, Camera, Car, Check, ChevronRight,
  FileText, Fuel, Gauge, Home, Landmark, MapPin,
  Settings, Star, User, Wallet, X, Loader
} from "lucide-react";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type View = "panel" | "viajes" | "ganancias" | "configuracion";
type TripTab = "solicitados" | "aceptados";

interface ConductorPerfil {
  id: string
  nombre: string
  apellido: string
  telefono: string
  disponibilidad: string
  calificacion: number
  viajes_realizados: number
  ganancias_total: number
}

interface ViajeDB {
  id: string
  folio: string | null
  status: string
  fecha_programada: string | null
  hora_programada: string | null
  origen_calle: string | null
  origen_colonia: string | null
  origen_estado: string | null
  origen_contacto: string | null
  origen_telefono: string | null
  destino_calle: string | null
  destino_colonia: string | null
  destino_estado: string | null
  destino_contacto: string | null
  destino_telefono: string | null
  instrucciones: string | null
  pago_conductor: number
  gastos_autorizados: number
  vehiculos: { marca: string; modelo: string; placas: string; transmision: string | null } | null
  usuarios: { nombre: string; apellido: string } | null
}

interface PagoResumen {
  id: string
  periodo: string
  viajes_revisados: number
  ganancias: number
  gastos_autorizados: number
  ajustes: number
  deposito_esperado: number
  estatus: string
  fecha_pago: string | null
}

const navItems = [
  { id: "panel" as View,         label: "Panel",     icon: Home },
  { id: "viajes" as View,        label: "Viajes",    icon: Car },
  { id: "ganancias" as View,     label: "Ganancias", icon: Wallet },
  { id: "configuracion" as View, label: "Config.",   icon: Settings },
];

function cx(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header({ onOpenSettings, conductor }: {
  onOpenSettings: () => void
  conductor: ConductorPerfil | null
}) {
  return (
    <header className="flex items-center justify-between bg-slate-900 px-5 py-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-sm font-black text-white">R</span>
        </div>
        <div>
          <p className="text-xs font-bold text-white leading-tight">Ruum Ruum</p>
          <p className="text-[10px] text-slate-400 leading-tight">Conductor</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {conductor && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-white">{conductor.calificacion.toFixed(1)}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600"
        >
          <User className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ disponibilidad }: { disponibilidad: string }) {
  const activo = disponibilidad === "Disponible"
  return (
    <span className={cx(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
      activo ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
    )}>
      <span className={cx("h-2 w-2 rounded-full", activo ? "animate-pulse bg-green-500" : "bg-slate-400")} />
      {disponibilidad}
    </span>
  );
}

// ─── PANEL VIEW ───────────────────────────────────────────────────────────────
function PanelView({
  conductor, viajes, onDisponibilidadChange, cargando
}: {
  conductor: ConductorPerfil | null
  viajes: ViajeDB[]
  onDisponibilidadChange: (disponibilidad: string) => void
  cargando: boolean
}) {
  const disponible = conductor?.disponibilidad === "Disponible"
  const viajeActivo = viajes.find(v =>
    ["Conductor en camino","Recolección en proceso","Evidencia inicial pendiente",
     "Traslado en curso","Entrega en proceso"].includes(v.status)
  )
  const viajesCompletados = viajes.filter(v => v.status === "Finalizado").length
  const gananciasSemana = viajes
    .filter(v => v.status !== "Cancelado")
    .reduce((s, v) => s + (v.pago_conductor ?? 0), 0)

  return (
    <section className="fade-in p-5 pb-24">
      {/* Perfil y disponibilidad */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            {cargando
              ? <div className="h-5 w-32 animate-pulse bg-slate-100 rounded mb-1" />
              : <h2 className="text-lg font-bold text-slate-800">
                  Hola, {conductor?.nombre ?? "Conductor"}
                </h2>
            }
            <p className="text-sm text-slate-500">Que tengas un excelente día de trabajo.</p>
          </div>
          {conductor && <StatusBadge disponibilidad={conductor.disponibilidad} />}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
          <span className="text-sm font-semibold text-slate-700">Recibir nuevos viajes</span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={disponible}
              onChange={e => onDisponibilidadChange(e.target.checked ? "Disponible" : "No disponible")}
            />
            <span className="h-6 w-12 rounded-full bg-slate-300 transition-colors peer-checked:bg-green-500" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full border-2 border-slate-300 bg-white transition-transform peer-checked:translate-x-6 peer-checked:border-green-500" />
          </label>
        </div>
      </div>

      {/* Resumen */}
      <h3 className="mb-3 text-sm font-bold text-slate-700">Resumen de esta semana</h3>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-blue-600 p-4 text-white shadow-md">
          <p className="mb-1 text-xs text-blue-100">Tus viajes</p>
          {cargando
            ? <div className="h-8 w-12 animate-pulse bg-blue-500 rounded" />
            : <p className="text-2xl font-bold">{viajes.length}</p>
          }
          <p className="mt-1 text-[10px] text-blue-200">
            {viajesCompletados} completados
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-slate-500">Ganancia estimada</p>
          {cargando
            ? <div className="h-8 w-20 animate-pulse bg-slate-100 rounded" />
            : <p className="text-2xl font-bold text-slate-800">${gananciasSemana.toLocaleString()}</p>
          }
          <p className="mt-1 text-[10px] text-slate-400">Antes de gastos</p>
        </div>
      </div>

      {/* Viaje activo */}
      {viajeActivo && (
        <div className="mb-5 rounded-xl border-l-4 border-blue-500 bg-white p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
              {viajeActivo.status.toUpperCase()}
            </span>
            <span className="text-xs text-slate-400">{viajeActivo.folio}</span>
          </div>
          <p className="text-sm font-bold text-slate-800 mb-1">
            {viajeActivo.origen_calle} → {viajeActivo.destino_calle}
          </p>
          {viajeActivo.vehiculos && (
            <p className="text-xs text-slate-500">
              {viajeActivo.vehiculos.marca} {viajeActivo.vehiculos.modelo} · {viajeActivo.vehiculos.placas}
            </p>
          )}
          <p className="text-sm font-bold text-green-600 mt-2">
            ${viajeActivo.pago_conductor.toLocaleString()}
          </p>
        </div>
      )}

      {/* Docs por vencer */}
      <h3 className="mb-3 text-sm font-bold text-slate-700">Avisos importantes</h3>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Mantén tus documentos al día</p>
          <p className="mt-1 text-xs text-amber-700">
            Verifica tus documentos en Configuración para operar sin interrupciones.
          </p>
        </div>
      </div>
    </section>
  );
}

// ─── VIAJES VIEW ──────────────────────────────────────────────────────────────
function VijesView({
  conductor, viajes, onAceptar, onCambiarStatus, cargando
}: {
  conductor: ConductorPerfil | null
  viajes: ViajeDB[]
  onAceptar: (viajeId: string) => Promise<void>
  onCambiarStatus: (viajeId: string, status: string, evento: string) => Promise<void>
  cargando: boolean
}) {
  const [activeTab, setActiveTab] = useState<TripTab>("solicitados")
  const [aceptando, setAceptando] = useState<string | null>(null)
  const [evidenceViaje, setEvidenceViaje] = useState<ViajeDB | null>(null)

  const solicitados = viajes.filter(v => v.status === "Conductor asignado")
  const aceptados = viajes.filter(v =>
    ["Conductor en camino","Recolección en proceso","Evidencia inicial pendiente",
     "Traslado en curso","Entrega en proceso","Evidencia final pendiente"].includes(v.status)
  )

  const handleAceptar = async (viaje: ViajeDB) => {
    setAceptando(viaje.id)
    await onAceptar(viaje.id)
    setAceptando(null)
    setActiveTab("aceptados")
  }

  const handleRechazar = async (viaje: ViajeDB) => {
    if (!window.confirm("¿Estás seguro de rechazar esta oferta?")) return
    await onCambiarStatus(viaje.id, "Pendiente de asignación", "Conductor rechazó el viaje")
  }

  return (
    <section className="fade-in p-5 pb-24">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Tus viajes</h2>

      <div className="mb-5 flex gap-2 rounded-lg bg-slate-100 p-1">
        {(["solicitados","aceptados"] as TripTab[]).map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)}
            className={cx("flex-1 rounded-md py-2 text-sm font-semibold transition-all",
              activeTab === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
            )}>
            {tab === "solicitados" ? `Solicitados (${solicitados.length})` : `Aceptados (${aceptados.length})`}
          </button>
        ))}
      </div>

      {cargando && (
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader className="h-5 w-5 animate-spin" />
          <span className="text-sm">Cargando viajes...</span>
        </div>
      )}

      {/* SOLICITADOS */}
      {!cargando && activeTab === "solicitados" && (
        <div className="space-y-4">
          {solicitados.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Car className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay viajes disponibles en este momento.</p>
              <p className="text-xs text-slate-300 mt-1">Activa tu disponibilidad para recibir ofertas.</p>
            </div>
          ) : (
            solicitados.map(viaje => (
              <div key={viaje.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                    NUEVA OFERTA
                  </span>
                  <span className="text-xs text-slate-400">{viaje.folio}</span>
                </div>

                <div className="mb-4 flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    <div className="my-1 h-8 w-0.5 bg-slate-200" />
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">Origen</p>
                    <p className="text-sm font-semibold leading-tight text-slate-800 truncate">
                      {[viaje.origen_calle, viaje.origen_colonia].filter(Boolean).join(', ')}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">Destino</p>
                    <p className="text-sm font-semibold leading-tight text-slate-800 truncate">
                      {[viaje.destino_calle, viaje.destino_colonia].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="mb-4 space-y-2 border-t border-slate-100 pt-3">
                  {viaje.vehiculos && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Vehículo:</span>
                      <span className="font-medium text-slate-800">
                        {viaje.vehiculos.marca} {viaje.vehiculos.modelo} · {viaje.vehiculos.transmision ?? ''}
                      </span>
                    </div>
                  )}
                  {viaje.fecha_programada && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Fecha:</span>
                      <span className="font-medium text-slate-800">
                        {viaje.fecha_programada} {viaje.hora_programada ? `· ${viaje.hora_programada.slice(0,5)}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-slate-700">Tu ganancia estimada:</span>
                    <span className="text-xl font-bold text-green-600">${viaje.pago_conductor.toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => handleRechazar(viaje)}
                    className="rounded-lg border border-slate-300 py-3 font-semibold text-slate-600 hover:bg-slate-50">
                    Rechazar
                  </button>
                  <button type="button" onClick={() => handleAceptar(viaje)}
                    disabled={aceptando === viaje.id}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                    {aceptando === viaje.id
                      ? <Loader className="h-4 w-4 animate-spin" />
                      : <Check className="h-4 w-4" />
                    }
                    Aceptar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ACEPTADOS */}
      {!cargando && activeTab === "aceptados" && (
        <div className="space-y-4">
          {aceptados.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <Check className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No tienes viajes aceptados activos.</p>
            </div>
          ) : (
            aceptados.map(viaje => (
              <div key={viaje.id} className="rounded-xl border-l-4 border-blue-500 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
                    {viaje.status.toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400">{viaje.folio}</span>
                </div>

                <p className="mb-1 text-sm font-bold text-slate-800">
                  {viaje.origen_calle} → {viaje.destino_calle}
                </p>
                {viaje.vehiculos && (
                  <p className="mb-1 text-xs text-slate-500">
                    {viaje.vehiculos.marca} {viaje.vehiculos.modelo} · {viaje.vehiculos.placas}
                  </p>
                )}
                {viaje.origen_contacto && (
                  <p className="text-xs text-slate-500 mb-1">Contacto: {viaje.origen_contacto} {viaje.origen_telefono && `· ${viaje.origen_telefono}`}</p>
                )}
                {viaje.instrucciones && (
                  <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2">{viaje.instrucciones}</p>
                )}

                <p className="text-sm font-bold text-green-600 mt-2">${viaje.pago_conductor.toLocaleString()}</p>

                <div className="mt-3 space-y-2">
                  {/* Botones según el status */}
                  {viaje.status === "Conductor en camino" && (
                    <button type="button"
                      onClick={() => onCambiarStatus(viaje.id, "Recolección en proceso", "Llegada al origen")}
                      className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">
                      ✓ Confirmé llegada al origen
                    </button>
                  )}
                  {viaje.status === "Recolección en proceso" && (
                    <button type="button"
                      onClick={() => setEvidenceViaje(viaje)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">
                      <Camera className="h-4 w-4" /> Cargar Evidencia Inicial
                    </button>
                  )}
                  {viaje.status === "Evidencia inicial pendiente" && (
                    <button type="button"
                      onClick={() => onCambiarStatus(viaje.id, "Traslado en curso", "Traslado iniciado")}
                      className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
                      🚗 Iniciar traslado
                    </button>
                  )}
                  {viaje.status === "Traslado en curso" && (
                    <button type="button"
                      onClick={() => onCambiarStatus(viaje.id, "Entrega en proceso", "Llegada al destino")}
                      className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">
                      ✓ Llegué al destino
                    </button>
                  )}
                  {viaje.status === "Entrega en proceso" && (
                    <button type="button"
                      onClick={() => setEvidenceViaje(viaje)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800">
                      <Camera className="h-4 w-4" /> Cargar Evidencia Final
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de evidencia */}
      {evidenceViaje && (
        <EvidenceModal
          viaje={evidenceViaje}
          onClose={() => setEvidenceViaje(null)}
          onSubmit={async (datos) => {
            const tipo = evidenceViaje.status === "Recolección en proceso" ? "inicial" : "final"
            await sb.from("evidencias").upsert({
              viaje_id: evidenceViaje.id,
              km_inicial: tipo === "inicial" ? datos.km : undefined,
              km_final: tipo === "final" ? datos.km : undefined,
              combustible_inicial: tipo === "inicial" ? datos.combustible : undefined,
              combustible_final: tipo === "final" ? datos.combustible : undefined,
              danos_iniciales: tipo === "inicial" ? datos.danos : undefined,
              danos_finales: tipo === "final" ? datos.danos : undefined,
              estatus: "En revisión",
            }, { onConflict: "viaje_id" })

            const nuevoStatus = tipo === "inicial" ? "Evidencia inicial pendiente" : "Evidencia final pendiente"
            const evento = tipo === "inicial" ? "Evidencia inicial cargada" : "Evidencia final cargada"
            await onCambiarStatus(evidenceViaje.id, nuevoStatus, evento)
            setEvidenceViaje(null)
          }}
        />
      )}
    </section>
  );
}

// ─── GANANCIAS VIEW ───────────────────────────────────────────────────────────
function GananciasView({ conductor, pagos, cargando }: {
  conductor: ConductorPerfil | null
  pagos: PagoResumen[]
  cargando: boolean
}) {
  const pagoEstilo: Record<string, string> = {
    Pagado: "text-green-600",
    Pendiente: "text-amber-600",
    "En revisión": "text-blue-600",
    Rechazado: "text-red-600",
  }

  return (
    <section className="fade-in p-5 pb-24">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Mis ganancias</h2>

      <div className="mb-6 rounded-xl bg-slate-900 p-5 text-white shadow-lg">
        <p className="mb-1 text-sm text-slate-400">Ganancias totales acumuladas</p>
        {cargando
          ? <div className="h-9 w-32 animate-pulse bg-slate-700 rounded mb-4" />
          : <h3 className="mb-4 text-3xl font-bold">${(conductor?.ganancias_total ?? 0).toLocaleString()}</h3>
        }
        <div className="grid grid-cols-2 gap-2 border-t border-slate-700 pt-4 text-center">
          <div>
            <p className="text-xs text-slate-400">Viajes realizados</p>
            <p className="text-sm font-semibold">{conductor?.viajes_realizados ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Calificación</p>
            <p className="text-sm font-semibold text-amber-400">★ {conductor?.calificacion?.toFixed(1) ?? '—'}</p>
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-bold text-slate-700">Historial de pagos</h3>
      {cargando ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-xl" />)}
        </div>
      ) : pagos.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">Sin registros de pago aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pagos.map(pago => (
            <div key={pago.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-slate-800">{pago.periodo}</p>
                <p className="text-xs text-slate-500">{pago.viajes_revisados} viajes · {pago.fecha_pago ?? 'Pendiente'}</p>
              </div>
              <div className="text-right">
                <p className="text-base font-bold text-slate-800">${pago.deposito_esperado.toLocaleString()}</p>
                <p className={`text-xs font-semibold ${pagoEstilo[pago.estatus] ?? 'text-slate-500'}`}>{pago.estatus}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── SETTINGS VIEW ────────────────────────────────────────────────────────────
function SettingsView({ conductor, onBack }: {
  conductor: ConductorPerfil | null
  onBack: () => void
}) {
  return (
    <section className="fade-in p-5 pb-24">
      <div className="mb-5 flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-800">
          ← Volver
        </button>
        <h2 className="text-xl font-bold text-slate-800">Mi perfil</h2>
      </div>

      {conductor && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold">
            {conductor.nombre[0]}{conductor.apellido[0]}
          </div>
          <h3 className="text-lg font-bold text-slate-800">{conductor.nombre} {conductor.apellido}</h3>
          <p className="text-sm text-slate-500">{conductor.telefono}</p>
          <div className="flex justify-center gap-4 mt-3">
            <div className="text-center">
              <p className="text-lg font-bold text-slate-800">{conductor.viajes_realizados}</p>
              <p className="text-xs text-slate-400">Viajes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-500">★ {conductor.calificacion.toFixed(1)}</p>
              <p className="text-xs text-slate-400">Calificación</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {[
          { icon: FileText, label: "Mis documentos", sub: "Licencia, INE, CSF" },
          { icon: Landmark, label: "Cuenta bancaria", sub: "CLABE y banco" },
          { icon: MapPin, label: "Mi ubicación", sub: "Municipio y estado" },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <item.icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-400">{item.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── EVIDENCE MODAL ───────────────────────────────────────────────────────────
function EvidenceModal({ viaje, onClose, onSubmit }: {
  viaje: ViajeDB
  onClose: () => void
  onSubmit: (datos: { km: number; combustible: string; danos: string }) => Promise<void>
}) {
  const [km, setKm] = useState("")
  const [combustible, setCombustible] = useState("1/2")
  const [danos, setDanos] = useState("")
  const [enviando, setEnviando] = useState(false)
  const tipo = viaje.status === "Recolección en proceso" ? "inicial" : "final"

  const slots = ["Frente", "Lado piloto", "Copiloto", "Trasera", "Tablero"]

  const handleSubmit = async () => {
    setEnviando(true)
    await onSubmit({ km: parseInt(km) || 0, combustible, danos })
    setEnviando(false)
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-slate-200 p-4">
        <button type="button" onClick={onClose}>
          <X className="h-5 w-5 text-slate-500" />
        </button>
        <h3 className="font-bold text-slate-800">
          Evidencia {tipo === "inicial" ? "Inicial" : "Final"} · {viaje.folio}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Fotos */}
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2">📷 Fotografías (5 ángulos)</p>
          <div className="grid grid-cols-5 gap-2">
            {slots.map(slot => (
              <div key={slot} className="aspect-square rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100">
                <Camera className="h-5 w-5 text-slate-300 mb-1" />
                <p className="text-[9px] text-slate-400 text-center leading-tight">{slot}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1">Toca cada ángulo para cargar la foto</p>
        </div>

        {/* Kilometraje */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Kilometraje {tipo === "inicial" ? "inicial" : "final"}
          </label>
          <input type="number" value={km} onChange={e => setKm(e.target.value)}
            placeholder="45820"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Combustible */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Nivel de combustible</label>
          <div className="grid grid-cols-5 gap-2">
            {["Vacío","1/4","1/2","3/4","Lleno"].map(n => (
              <button key={n} type="button" onClick={() => setCombustible(n)}
                className={cx("py-2 rounded-lg text-xs font-semibold border transition-colors",
                  combustible === n ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-300"
                )}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Daños */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Daños visibles</label>
          <textarea value={danos} onChange={e => setDanos(e.target.value)}
            placeholder="Sin daños. / Describir cualquier daño preexistente..."
            rows={3}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="border-t border-slate-200 p-4">
        <button type="button" onClick={handleSubmit} disabled={enviando}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white hover:bg-blue-700 disabled:opacity-60">
          {enviando ? <Loader className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {enviando ? "Guardando..." : `Confirmar evidencia ${tipo}`}
        </button>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────
function BottomNavigation({ activeView, onChange }: {
  activeView: View
  onChange: (v: View) => void
}) {
  return (
    <nav className="flex flex-shrink-0 border-t border-slate-200 bg-white">
      {navItems.map(({ id, label, icon: Icon }) => {
        const active = activeView === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)}
            className={cx("flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
              active ? "text-blue-600" : "text-slate-500 hover:text-slate-700"
            )}>
            <Icon className={cx("h-5 w-5", active && "fill-blue-100")} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function DriverApp() {
  const [activeView, setActiveView] = useState<View>("panel");
  const [conductor, setConductor] = useState<ConductorPerfil | null>(null);
  const [viajes, setViajes] = useState<ViajeDB[]>([]);
  const [pagos, setPagos] = useState<PagoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  // ── CARGAR CONDUCTOR (por auth o primer registro para dev) ──
  const cargarConductor = useCallback(async () => {
    // En desarrollo: carga el primer conductor activo
    // En producción: usar sb.auth.getUser() y filtrar por auth_id
    const { data } = await sb
      .from("conductores")
      .select("id, nombre, apellido, telefono, disponibilidad, calificacion, viajes_realizados, ganancias_total")
      .eq("certificacion", "Activo")
      .limit(1)
      .single()

    if (data) setConductor(data as ConductorPerfil)
  }, [])

  const cargarViajes = useCallback(async () => {
    if (!conductor) return
    const { data } = await sb
      .from("viajes")
      .select(`
        id, folio, status, fecha_programada, hora_programada,
        origen_calle, origen_colonia, origen_estado, origen_contacto, origen_telefono,
        destino_calle, destino_colonia, destino_estado, destino_contacto, destino_telefono,
        instrucciones, pago_conductor, gastos_autorizados,
        vehiculos(marca, modelo, placas, transmision),
        usuarios(nombre, apellido)
      `)
      .eq("conductor_id", conductor.id)
      .not("status", "in", '("Finalizado","Cancelado")')
      .order("created_at", { ascending: false })

    if (data) setViajes(data as unknown as ViajeDB[])
  }, [conductor])

  const cargarPagos = useCallback(async () => {
    if (!conductor) return
    const { data } = await sb
      .from("pagos_conductores")
      .select("*")
      .eq("conductor_id", conductor.id)
      .order("created_at", { ascending: false })

    if (data) setPagos(data as PagoResumen[])
  }, [conductor])

  useEffect(() => {
    cargarConductor()
  }, [cargarConductor])

  useEffect(() => {
    if (conductor) {
      Promise.all([cargarViajes(), cargarPagos()]).then(() => setCargando(false))

      // Realtime: escuchar viajes asignados a este conductor
      const channel = sb
        .channel(`conductor-viajes-${conductor.id}`)
        .on("postgres_changes", {
          event: "*", schema: "public", table: "viajes",
          filter: `conductor_id=eq.${conductor.id}`,
        }, () => cargarViajes())
        .subscribe()

      return () => { sb.removeChannel(channel) }
    }
  }, [conductor, cargarViajes, cargarPagos])

  const showView = (view: View) => {
    setActiveView(view)
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDisponibilidadChange = async (disponibilidad: string) => {
    if (!conductor) return
    await sb.from("conductores").update({ disponibilidad }).eq("id", conductor.id)
    setConductor(prev => prev ? { ...prev, disponibilidad } : null)
  }

  const handleAceptar = async (viajeId: string) => {
    await sb.from("viajes").update({ status: "Conductor en camino" }).eq("id", viajeId)
    await sb.from("timeline_viaje").insert({
      viaje_id: viajeId,
      evento: "Conductor aceptó el viaje",
      actor: conductor ? `${conductor.nombre} ${conductor.apellido}` : "Conductor",
      actor_tipo: "conductor",
    })
    await cargarViajes()
  }

  const handleCambiarStatus = async (viajeId: string, status: string, evento: string) => {
    await sb.from("viajes").update({ status }).eq("id", viajeId)
    await sb.from("timeline_viaje").insert({
      viaje_id: viajeId, evento,
      actor: conductor ? `${conductor.nombre} ${conductor.apellido}` : "Conductor",
      actor_tipo: "conductor",
    })
    await cargarViajes()
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-0 md:p-4">
      <div className="mobile-mockup flex flex-col relative">
        <Header onOpenSettings={() => showView("configuracion")} conductor={conductor} />

        <main ref={mainRef} className="no-scrollbar relative flex-1 overflow-y-auto bg-slate-50">
          {activeView === "panel" && (
            <PanelView
              conductor={conductor}
              viajes={viajes}
              onDisponibilidadChange={handleDisponibilidadChange}
              cargando={cargando}
            />
          )}
          {activeView === "viajes" && (
            <VijesView
              conductor={conductor}
              viajes={viajes}
              onAceptar={handleAceptar}
              onCambiarStatus={handleCambiarStatus}
              cargando={cargando}
            />
          )}
          {activeView === "ganancias" && (
            <GananciasView conductor={conductor} pagos={pagos} cargando={cargando} />
          )}
          {activeView === "configuracion" && (
            <SettingsView conductor={conductor} onBack={() => showView("panel")} />
          )}
        </main>

        <BottomNavigation activeView={activeView} onChange={showView} />
      </div>
    </div>
  );
}