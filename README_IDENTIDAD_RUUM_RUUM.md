# Identidad visual aplicada — Ruum Ruum Conductor

Este paquete aplica la propuesta visual de Ruum Ruum by MoviliaX a la aplicación de conductor, ahora integrando el **Design System Técnico** (componentes RR reutilizables) sobre la app real conectada a Supabase.

## Qué se aplicó

- **`lib/design-system/`** y **`components/rr/`**: tokens, utilidades (`cn`, `formatMoney`) y componentes `RRButton`, `RRCard`, `RRBadge`, `RRStatCard`, `RREvidenceGallery` copiados desde el paquete "Design System Técnico" y adaptados al alias `@/*` de este proyecto (sin carpeta `src/`).
- **`app/page.tsx`**: las pantallas operativas (Panel, Viajes, Ganancias, Perfil/Configuración y el modal de Evidencia) ahora usan los componentes RR en vez de JSX con colores hardcodeados repetidos. La lógica de negocio, los hooks, las llamadas a Supabase y el flujo de onboarding/registro **no se modificaron**.
- **`app/globals.css`**: se añadieron las variables y utilidades del Design System Técnico (`rr-app-shell`, `rr-fade-in`, `rr-safe-bottom`) y se corrigió un bug donde el contenedor usaba la clase `mobile-mockup`, que no existía en el CSS (solo existía `.rr-mobile-shell`). Ahora ambas clases son válidas.
- **`tailwind.config.ts`**: se fusionó la paleta legacy (`rr.blue`, `rr.navy`...) con la paleta extendida del Design System Técnico (`rr.primary`, `rr.secondary`, `rr.success`, etc.), además de los nuevos radios (`rrSm`, `rrMd`, `rrLg`, `rrHero`) y sombras (`rrCard`, `rrFloating`, `rrModal`).

## Paleta aplicada

- Azul Ruum: `#1565FF`
- Azul oscuro: `#0A1F44`
- Verde evidencia: `#00C853`
- Naranja acción: `#FF6D00`
- Fondo claro: `#F8FAFC`
- Texto principal: `#111827`

## Importante

El flujo de onboarding (Bienvenida, Registro, Login, Documentos, Términos) conserva su estructura original porque incluye validaciones y formularios extensos; sus inputs ya heredan los tokens de color vía el helper `inputCls`. La conexión con Supabase sigue activa: configura `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en un archivo `.env.local` antes de ejecutar `npm run dev`.

