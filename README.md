# tejada-hnos-backend

Guía rápida de instalación y ejecución para el proyecto Node + TypeScript.

## Requisitos

- Node.js (v18+ recomendado)
- npm (v9+ recomendado) o yarn

## Pasos de instalación

1. Clona el repositorio:

	git clone https://github.com/patricio-jp/tejada-hnos-backend.git
	cd tejada-hnos-backend

2. Crea un archivo de variables de entorno `.env` a partir de `.env.example`.

	Copia el ejemplo y abre el archivo para ajustar valores:

	Windows PowerShell:

  ``` bash
	cp .env.example .env
  ```

	Luego abre .env en tu editor y modifica los valores según tu entorno

	El proyecto requiere al menos las siguientes variables en `.env`:

	- `PORT` — puerto donde correrá la app (ej. 3000)

3. Instala dependencias:

	npm install

4. Ejecuta en modo desarrollo (con recarga automática):

	npm run dev

5. Para compilar TypeScript y ejecutar la versión de producción:

	npm run build
	npm start

## Scripts útiles (definidos en `package.json`)

- `npm run dev` — Ejecuta con `ts-node` y `nodemon`, ideal para desarrollo.
- `npm run build` — Compila TypeScript a `dist/`.
- `npm start` — Ejecuta la build compilada desde `dist/`.

## Notas

- No incluyas el archivo `.env` en el repositorio. Usa `.env.example` como plantilla.
