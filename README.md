# React + Vite

## Estructura base

El código de aplicación vive en `src/`, organizado por responsabilidad:

- `components/`: componentes reutilizables de interfaz.
- `constants/`: valores constantes de la aplicación.
- `config/`: configuración derivada de variables de entorno.
- `dtos/`: objetos para solicitudes y respuestas de la API.
- `hooks/`: hooks reutilizables.
- `layouts/`: estructuras compartidas de páginas.
- `pages/`: componentes asociados a rutas.
- `routes/`: definición y configuración de rutas.
- `services/`: integraciones externas y cliente HTTP.
- `utils/`: funciones auxiliares puras.

## Variables de entorno

Copia `.env.example` como `.env` para configurar el entorno local. Los archivos
`.env` y los archivos de credenciales están excluidos por `.gitignore`.
Las variables expuestas al navegador deben comenzar con `VITE_`; no almacenes
secretos reales en ellas, porque Vite los incluye en el bundle público.

Para habilitar los botones de Google, GitHub y Microsoft, completa en `.env`
las variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`,
`VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_APP_ID` con la configuración web
pública de Firebase. El frontend obtiene el Firebase ID token y lo intercambia
por el JWT propio del backend en `POST /api/auth/oauth/firebase`; nunca usa el
ID token de Firebase para consumir otros endpoints.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
