"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Car,
  Check,
  ChevronRight,
  FileText,
  Fuel,
  Gauge,
  Headphones,
  Home,
  Landmark,
  MapPin,
  Settings,
  SlidersHorizontal,
  Star,
  User,
  Wallet,
  X
} from "lucide-react";

type View = "panel" | "viajes" | "ganancias" | "configuracion";
type TripTab = "solicitados" | "aceptados";
type TripOfferState = "available" | "accepted" | "rejected";

const navItems = [
  { id: "panel" as const, label: "Panel", icon: Home },
  { id: "viajes" as const, label: "Viajes", icon: Car },
  { id: "ganancias" as const, label: "Ganancias", icon: Wallet },
  { id: "configuracion" as const, label: "Perfil", icon: User }
];

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DriverApp() {
  const [activeView, setActiveView] = useState<View>("panel");
  const [available, setAvailable] = useState(true);
  const [tripTab, setTripTab] = useState<TripTab>("solicitados");
  const [tripOfferState, setTripOfferState] = useState<TripOfferState>("available");
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const showView = (view: View) => {
    setActiveView(view);
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const acceptTrip = () => {
    if (window.confirm("¿Confirmas que aceptas este viaje por $450.00?")) {
      setTripOfferState("accepted");
    }
  };

  const rejectTrip = () => {
    if (window.confirm("¿Estás seguro de rechazar esta oferta?")) {
      setTripOfferState("rejected");
    }
  };

  const goToAcceptedTrips = () => {
    showView("viajes");
    setTripTab("aceptados");
  };

  const submitEvidence = () => {
    setEvidenceModalOpen(false);
    window.alert(
      "Evidencia inicial cargada exitosamente.\n\nEl estatus del viaje ha cambiado a 'Traslado en curso'. El cliente ha sido notificado."
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-0 md:p-4">
      <div className="mobile-mockup flex flex-col">
        <Header onOpenSettings={() => showView("configuracion")} />

        <main ref={mainRef} className="no-scrollbar relative flex-1 overflow-y-auto bg-slate-50">
          {activeView === "panel" && (
            <PanelView available={available} onAvailabilityChange={setAvailable} />
          )}

          {activeView === "viajes" && (
            <TripsView
              activeTab={tripTab}
              onTabChange={setTripTab}
              tripOfferState={tripOfferState}
              onAcceptTrip={acceptTrip}
              onRejectTrip={rejectTrip}
              onGoToAcceptedTrips={goToAcceptedTrips}
              onOpenEvidence={() => setEvidenceModalOpen(true)}
            />
          )}

          {activeView === "ganancias" && <EarningsView />}

          {activeView === "configuracion" && <SettingsView onBack={() => showView("panel")} />}
        </main>

        <BottomNavigation activeView={activeView} onChange={showView} />

        {evidenceModalOpen && (
          <EvidenceModal onClose={() => setEvidenceModalOpen(false)} onSubmit={submitEvidence} />
        )}
      </div>
    </div>
  );
}

function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex-shrink-0 bg-slate-900 px-5 pb-4 pt-12 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold">
            R
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Ruum Ruum</h1>
            <p className="text-[10px] tracking-wider text-slate-400">CONDUCTOR</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Abrir configuración"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-slate-700"
        >
          <Settings className="h-5 w-5 text-slate-300" />
        </button>
      </div>
    </header>
  );
}

function PanelView({
  available,
  onAvailabilityChange
}: {
  available: boolean;
  onAvailabilityChange: (available: boolean) => void;
}) {
  return (
    <section className="fade-in p-5 pb-24">
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Hola, Carlos</h2>
            <p className="text-sm text-slate-500">Que tengas un excelente día de trabajo.</p>
          </div>
          <StatusBadge available={available} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3">
          <span className="text-sm font-semibold text-slate-700">Recibir nuevos viajes</span>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={available}
              onChange={(event) => onAvailabilityChange(event.target.checked)}
            />
            <span className="h-6 w-12 rounded-full bg-slate-300 transition-colors peer-checked:bg-green-500" />
            <span className="absolute left-0.5 h-5 w-5 rounded-full border-2 border-slate-300 bg-white transition-transform peer-checked:translate-x-6 peer-checked:border-green-500" />
          </label>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-bold text-slate-700">Resumen de esta semana</h3>
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-blue-600 p-4 text-white shadow-md">
          <p className="mb-1 text-xs text-blue-100">Tus viajes</p>
          <p className="text-2xl font-bold">8</p>
          <p className="mt-1 text-[10px] text-blue-200">3 completados, 5 pendientes</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 text-xs text-slate-500">Ganancia estimada</p>
          <p className="text-2xl font-bold text-slate-800">$3,450</p>
          <p className="mt-1 text-[10px] text-slate-400">Antes de gastos</p>
        </div>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Wallet className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-green-800">Tu próximo depósito</p>
          <p className="text-sm text-green-700">
            Viernes 20 de Junio • <span className="font-bold">$3,120.00</span>
          </p>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-bold text-slate-700">Avisos importantes</h3>
      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Documento por vencer</p>
          <p className="mt-1 text-xs text-amber-700">
            Tu licencia de conducir vence en 15 días. Actualízala en Configuración.
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ available }: { available: boolean }) {
  return (
    <span
      className={classNames(
        "fade-in inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        available ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600"
      )}
    >
      <span
        className={classNames(
          "h-2 w-2 rounded-full",
          available ? "animate-pulse bg-green-500" : "bg-slate-500"
        )}
      />
      {available ? "Disponible" : "No disponible"}
    </span>
  );
}

function TripsView({
  activeTab,
  onTabChange,
  tripOfferState,
  onAcceptTrip,
  onRejectTrip,
  onGoToAcceptedTrips,
  onOpenEvidence
}: {
  activeTab: TripTab;
  onTabChange: (tab: TripTab) => void;
  tripOfferState: TripOfferState;
  onAcceptTrip: () => void;
  onRejectTrip: () => void;
  onGoToAcceptedTrips: () => void;
  onOpenEvidence: () => void;
}) {
  return (
    <section className="fade-in p-5 pb-24">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Tus viajes</h2>

      <div className="mb-5 flex gap-2 rounded-lg bg-slate-100 p-1">
        <TripTabButton active={activeTab === "solicitados"} onClick={() => onTabChange("solicitados")}>
          Solicitados
        </TripTabButton>
        <TripTabButton active={activeTab === "aceptados"} onClick={() => onTabChange("aceptados")}>
          Aceptados
        </TripTabButton>
      </div>

      {activeTab === "solicitados" ? (
        <div className="space-y-4">
          {tripOfferState === "available" && (
            <AvailableTripCard onAcceptTrip={onAcceptTrip} onRejectTrip={onRejectTrip} />
          )}

          {tripOfferState === "accepted" && (
            <div className="fade-in rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">¡Viaje Aceptado!</h3>
              <p className="mt-1 text-sm text-slate-500">
                Dirígete al origen para cargar la evidencia.
              </p>
              <button
                type="button"
                onClick={onGoToAcceptedTrips}
                className="mt-4 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Ir a mis viajes aceptados
              </button>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-4 opacity-70 shadow-sm">
            <div className="mb-3 flex items-start justify-between">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                EXPIRADO
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800">Taller Norte → Agencia Sur</p>
            <p className="mt-1 text-xs text-slate-500">Toyota Hilux • $520.00</p>
          </div>

          {tripOfferState === "rejected" && (
            <p className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
              La oferta fue rechazada.
            </p>
          )}
        </div>
      ) : (
        <AcceptedTrips onOpenEvidence={onOpenEvidence} />
      )}
    </section>
  );
}

function TripTabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex-1 rounded-md py-2 text-sm font-semibold transition-all",
        active ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
      )}
    >
      {children}
    </button>
  );
}

function AvailableTripCard({
  onAcceptTrip,
  onRejectTrip
}: {
  onAcceptTrip: () => void;
  onRejectTrip: () => void;
}) {
  return (
    <div className="fade-in rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
          NUEVA OFERTA
        </span>
        <span className="text-xs text-slate-400">Hace 2 min</span>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="flex flex-col items-center pt-1">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <div className="my-1 h-8 w-0.5 bg-slate-200" />
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-500">Origen</p>
          <p className="text-sm font-semibold leading-tight text-slate-800">Agencia Centro, CDMX</p>
          <p className="mt-2 text-xs text-slate-500">Destino</p>
          <p className="text-sm font-semibold leading-tight text-slate-800">
            Domicilio Cliente, Coyoacán
          </p>
        </div>
      </div>

      <div className="mb-4 space-y-2 border-t border-slate-100 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Vehículo:</span>
          <span className="font-medium text-slate-800">Nissan Versa (Automático)</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tipo:</span>
          <span className="font-medium text-slate-800">Traslado Personal</span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-bold text-slate-700">Tu ganancia estimada:</span>
          <span className="text-xl font-bold text-green-600">$450.00</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onRejectTrip}
          className="rounded-lg border border-slate-300 py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={onAcceptTrip}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 font-semibold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          <Check className="h-4 w-4" />
          Aceptar Viaje
        </button>
      </div>
    </div>
  );
}

function AcceptedTrips({ onOpenEvidence }: { onOpenEvidence: () => void }) {
  return (
    <div className="space-y-4">
      <div className="fade-in rounded-r-xl border-l-4 border-blue-500 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between">
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">
            EN CAMINO AL ORIGEN
          </span>
          <span className="text-xs text-slate-400">#TR-8840</span>
        </div>
        <p className="mb-1 text-sm font-bold text-slate-800">Agencia Centro → Domicilio Cliente</p>
        <p className="mb-4 text-xs text-slate-500">Nissan Versa • ABC-123</p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenEvidence}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-3 font-semibold text-white transition-colors hover:bg-slate-800"
          >
            <Camera className="h-4 w-4" />
            Cargar Evidencia Inicial
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <MapPin className="h-4 w-4" />
            Ver ruta en mapa
          </button>
        </div>
      </div>
    </div>
  );
}

function EarningsView() {
  return (
    <section className="fade-in p-5 pb-24">
      <h2 className="mb-4 text-xl font-bold text-slate-800">Mis ganancias</h2>

      <div className="mb-6 rounded-xl bg-slate-900 p-5 text-white shadow-lg">
        <p className="mb-1 text-sm text-slate-400">Saldo disponible para depósito</p>
        <h3 className="mb-4 text-3xl font-bold">$3,120.00</h3>
        <div className="grid grid-cols-3 gap-2 border-t border-slate-700 pt-4 text-center">
          <div>
            <p className="text-xs text-slate-400">Generado</p>
            <p className="text-sm font-semibold">$3,450</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Gastos</p>
            <p className="text-sm font-semibold text-red-400">-$180</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Ajustes</p>
            <p className="text-sm font-semibold text-amber-400">-$150</p>
          </div>
        </div>
      </div>

      <h3 className="mb-3 text-sm font-bold text-slate-700">Actividad reciente</h3>
      <div className="space-y-3">
        <ActivityItem route="Taller → Agencia" tripId="#TR-8838" date="12 Jun" amount="$420.00" status="Pagado" />
        <ActivityItem
          route="Domicilio → Lote"
          tripId="#TR-8835"
          date="11 Jun"
          amount="$550.00"
          status="Pendiente"
          pending
        />
      </div>
    </section>
  );
}

function ActivityItem({
  tripId,
  date,
  route,
  amount,
  status,
  pending = false
}: {
  tripId: string;
  date: string;
  route: string;
  amount: string;
  status: string;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-800">Viaje {tripId}</p>
        <p className="text-xs text-slate-500">
          {date} • {route}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-800">{amount}</p>
        <span
          className={classNames(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            pending ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
          )}
        >
          {status}
        </span>
      </div>
    </div>
  );
}

function SettingsView({ onBack }: { onBack: () => void }) {
  return (
    <section className="fade-in p-5 pb-24">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={onBack} className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Configuración</h2>
      </div>

      <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <div
          aria-label="Avatar de Carlos Méndez"
          className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-xl font-bold text-white shadow-sm"
        >
          CM
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Carlos Méndez</h3>
          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
              CERTIFICADO
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              4.9
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <SettingsItem
          icon={FileText}
          iconClassName="bg-blue-50 text-blue-600"
          label="Mis documentos"
          hint="1 requiere atención"
        />
        <SettingsItem icon={SlidersHorizontal} label="Preferencias de viaje" />
        <SettingsItem icon={Landmark} label="Datos bancarios" />
        <SettingsItem icon={Headphones} label="Soporte y Ayuda" />
      </div>

      <button
        type="button"
        className="mt-8 w-full rounded-xl border border-red-100 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
      >
        Cerrar sesión
      </button>
    </section>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  hint,
  iconClassName = "bg-slate-100 text-slate-600"
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  iconClassName?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className={classNames("flex h-8 w-8 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-left">
          <span className="block text-sm font-medium text-slate-700">{label}</span>
          {hint && <span className="text-[10px] text-amber-600">{hint}</span>}
        </div>
      </div>
      <ChevronRight className="h-3 w-3 text-slate-400" />
    </button>
  );
}

function BottomNavigation({
  activeView,
  onChange
}: {
  activeView: View;
  onChange: (view: View) => void;
}) {
  return (
    <nav className="z-20 flex flex-shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
      {navItems.map(({ id, label, icon: Icon }) => {
        const active = activeView === id;

        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={classNames(
              "flex w-16 flex-col items-center gap-1 transition-all hover:text-blue-600",
              active ? "text-blue-600" : "text-slate-400"
            )}
          >
            <Icon className={classNames("h-5 w-5 transition-transform duration-200", active && "-translate-y-0.5")} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function EvidenceModal({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="fade-in w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Evidencia Inicial</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Toma fotos claras del vehículo antes de iniciar el traslado.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <EvidenceSlot icon={Camera} label="Vista Frontal" />
          <EvidenceSlot icon={Camera} label="Vista Lateral" />
          <EvidenceSlot icon={Gauge} label="Kilometraje" />
          <EvidenceSlot icon={Fuel} label="Combustible" />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Observaciones (opcional)
          </label>
          <textarea
            className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            placeholder="Ej: Rayón leve en puerta trasera..."
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-md transition-colors hover:bg-blue-700"
        >
          Confirmar y Iniciar Traslado
        </button>
      </div>
    </div>
  );
}

function EvidenceSlot({
  icon: Icon,
  label
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 transition-colors hover:border-blue-400 hover:bg-slate-50"
    >
      <Icon className="mb-2 h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
