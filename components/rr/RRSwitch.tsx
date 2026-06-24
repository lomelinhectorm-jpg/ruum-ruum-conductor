import { cn } from "@/lib/design-system/utils";

interface RRSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

// Toggle binario (si/no) con apariencia de switch. Pensado para
// reemplazar selectores de múltiples botones cuando el estado real
// que se puede controlar desde la UI es solo encendido/apagado.
export function RRSwitch({ checked, onChange, disabled, label, className }: RRSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-rr-primary focus:ring-offset-2",
        checked ? "bg-rr-success" : "bg-rr-gray300",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow-rrCard transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}