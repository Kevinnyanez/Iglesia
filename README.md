# Biblia Comunidad (PWA)

Aplicación web progresiva para lectura bíblica y comunidad cristiana, construida con React, Vite, TypeScript y Tailwind CSS.

## Stack

- React + Vite + TypeScript
- TailwindCSS
- React Router
- TanStack Query
- Supabase (auth + data + realtime ready)
- Firebase Cloud Messaging (push notifications)
- vite-plugin-pwa

## Documentación

- [`docs/METAS.md`](docs/METAS.md) — Lógica de metas espirituales (crear, progreso, versículos guardados)
- [`docs/COMUNIDAD.md`](docs/COMUNIDAD.md) — Comunidades, roles, metas comunitarias, solicitudes

## Estructura

```text
src
  components
  context
  hooks
  layouts
  pages
  pwa
  services
  types
  utils
```

## Configuración de entorno

1. Copia `.env.example` a `.env`.
2. Completa las credenciales reales:
   - Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
   - API bíblica (`VITE_BIBLE_API_BASE_URL`, opcional `VITE_BIBLE_API_KEY`)
   - Firebase Cloud Messaging (`VITE_FIREBASE_*`)

## Scripts

- `npm run dev` - entorno local
- `npm run build` - build de producción
- `npm run preview` - previsualización de build
- `npm run lint` - análisis estático

## Rutas principales

- `/` feed principal
- `/login` y `/register`
- `/bible` explorador bíblico
- `/church` feed de iglesia
- `/global` feed global
- `/profile` perfil de usuario

## Notas de integración backend

- No hay datos mock; toda lectura/escritura depende de APIs reales.
- Los servicios están aislados en `src/services` para facilitar cambios de infraestructura.
- El service worker de Firebase está en `public/firebase-messaging-sw.js`.
- El PWA genera `sw.js` y soporta instalación, cache estática y cola de background sync para notificaciones.
