# WA-Notifier

**Microservicio de mensajería empresarial sobre WhatsApp** — Sistema orientado a la notificación transaccional de clientes mediante la plataforma WhatsApp, construido sobre el framework **NestJS** y la librería **whatsapp-web.js**. Actúa como un componente interno dentro de un ecosistema corporativo más amplio, exponiendo una interfaz REST autenticada mediante tokens **JSON Web Token (JWT)**.

---

## Índice

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Tecnologías y Dependencias](#tecnologías-y-dependencias)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Autenticación y Seguridad](#autenticación-y-seguridad)
- [API Reference](#api-reference)
- [Flujo de Operación](#flujo-de-operación)
- [Simulación de Escritura](#simulación-de-escritura)
- [Desarrollo](#desarrollo)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                   AutoNex Ecosystem                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │              │    │              │    │              │   │
│  │ AutoNex      │───▶│ WA-Notifier  │───▶│ WhatsApp     │   │
│  │ Backend      │    │ (NestJS)     │    │ Web Client   │   │
│  │              │    │              │    │ (Browser)    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│         │                    │                              │
│         ▼                    ▼                              │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │ AutoNex      │    │ JWT Token    │                       │
│  │ Frontend     │    │ (Bearer)     │                       │
│  └──────────────┘    └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

El servicio se compone de tres módulos principales dentro del patrón **NestJS Module**:

| Módulo           | Responsabilidad                                                 |
| ---------------- | --------------------------------------------------------------- |
| `AuthModule`     | Autenticación y emisión de tokens JWT, rotación de credenciales |
| `WhatsappModule` | Gestión del ciclo de vida del cliente WhatsApp Web              |
| `MessagesModule` | Orquestación del envío de mensajes con simulación de escritura  |

---

## Tecnologías y Dependencias

| Componente                                  | Versión      | Propósito                                                         |
| ------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| **NestJS**                                  | ^11.0        | Framework de aplicación backend Node.js                           |
| **TypeScript**                              | ^5.7         | Lenguaje de programación                                          |
| **whatsapp-web.js**                         | ^1.26        | Cliente no oficial para WhatsApp Web                              |
| **Puppeteer**                               | incluido     | Automatización de navegador headless Chrome                       |
| **Passport** + **passport-jwt**             | ^0.7 / ^4.0  | Estrategia de autenticación mediante tokens JWT                   |
| **@nestjs/jwt**                             | ^11.0        | Módulo de emisión y verificación de JWT                           |
| **class-validator** + **class-transformer** | ^0.14 / ^0.5 | Validación declarativa de objetos de transferencia de datos (DTO) |
| **qrcode-terminal**                         | ^0.12        | Renderizado de códigos QR en consola                              |

---

## Requisitos Previos

- **Node.js** >= 18
- **npm** >= 9
- **Navegador Chrome/Chromium** — Puppeteer gestiona su propia instalación mediante:
  ```bash
  npx puppeteer browsers install chrome
  ```
- **Conexión a Internet** — Para la autenticación inicial mediante código QR

---

## Instalación y Configuración

### 1. Clonar e instalar dependencias

```bash
git clone <repository-url> wa-notifier
cd wa-notifier
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
PORT=3000
NODE_ENV=development
API_PREFIX=api

WA_SESSION_PATH=./wa-session

JWT_SECRET=<secret_key_forte>
JWT_EXPIRATION=1h
```

| Variable          | Descripción                                      | Valor por Defecto |
| ----------------- | ------------------------------------------------ | ----------------- |
| `PORT`            | Puerto de escucha del servidor HTTP              | `3000`            |
| `API_PREFIX`      | Prefijo global para todas las rutas REST         | `api`             |
| `NODE_ENV`        | Entorno de ejecución                             | `development`     |
| `WA_SESSION_PATH` | Ruta de persistencia de la sesión de WhatsApp    | `./wa-session`    |
| `JWT_SECRET`      | Clave secreta para firmar y verificar tokens JWT | _(requerido)_     |
| `JWT_EXPIRATION`  | Tiempo de expiración de los tokens JWT           | `1h`              |

### 3. Configurar clave de API (`auth-config.json`)

El archivo `auth-config.json` se genera automáticamente en la primera ejecución con una clave criptográficamente aleatoria. Si se desea preconfigurar, puede crearse manualmente:

```json
{
  "apiKey": "<api_key_personalizada>"
}
```

Este archivo está excluido del control de versiones mediante `.gitignore`.

### 4. Iniciar el servicio

```bash
# Modo desarrollo (con recarga automática)
npm run start:dev

# Modo producción
npm run build && npm run start:prod
```

---

## Autenticación y Seguridad

El sistema implementa un **esquema de autenticación de dos capas** para garantizar que solo entidades autorizadas puedan interactuar con la API.

### Capa 1: Clave de API compartida (`API Key`)

- Almacenada en `auth-config.json` (excluido del repositorio).
- Se utiliza exclusivamente para obtener un token JWT de acceso.
- Es **independiente** del `JWT_SECRET`.

### Capa 2: Token JWT (Bearer Token)

- Firmado con `JWT_SECRET` y configurado con tiempo de expiración (`JWT_EXPIRATION`).
- Debe incluirse en el encabezado `Authorization` de toda petición a los endpoints protegidos.
- Los tokens emitidos **no pueden revocarse individualmente**; expiran según el tiempo configurado.

### Rotación de Claves

El endpoint `POST /api/auth/rotate-key` — protegido con JWT — genera una nueva clave de API criptográficamente aleatoria (64 caracteres hexadecimales) y la persiste en `auth-config.json`:

- La clave anterior **deja de funcionar inmediatamente** para la emisión de nuevos tokens.
- Los tokens JWT ya emitidos **continúan siendo válidos** hasta su expiración natural.

---

## API Reference

Base URL: `http://localhost:3000/api`

### `POST /auth/token`

Obtener un token JWT de acceso mediante la clave de API compartida.

**Autenticación:** Ninguna (requiere `apiKey` en el cuerpo).

**Request Body:**

```json
{
  "apiKey": "<api_key_del_archivo_auth-config.json>"
}
```

**Response `200` OK:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response `401` Unauthorized:**

```json
{
  "message": "Invalid API key",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

### `POST /auth/rotate-key`

Rotar la clave de API compartida. Genera una nueva clave y la persiste en `auth-config.json`.

**Autenticación:** `Authorization: Bearer <token>`

**Request Body:** No requiere.

**Response `201` Created:**

```json
{
  "apiKey": "3574cbfcb0df41bd90aa399b13f64be9f6d1b696a60e6f3452bdb6a4cc5284e7"
}
```

---

### `POST /messages/send`

Enviar un mensaje de WhatsApp a un destinatario.

**Autenticación:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "phone": "584241620546",
  "message": "Su pedido ha sido confirmado y será entregado en las próximas 24 horas.",
  "title": "Buenos días, Juan"
}
```

| Campo     | Tipo     | Requerido | Descripción                                                                  |
| --------- | -------- | --------- | ---------------------------------------------------------------------------- |
| `phone`   | `string` | Sí        | Número de teléfono (10-15 dígitos, sin prefijo `+` ni caracteres especiales) |
| `message` | `string` | Sí        | Contenido del mensaje a enviar                                               |
| `title`   | `string` | No        | Saludo o título que se antepone al mensaje con un salto de línea             |

**Response `201` Created:**

```json
{
  "success": true,
  "message": "Message sent to 584241620546",
  "data": {
    "phone": "584241620546",
    "title": "Buenos días, Juan"
  }
}
```

**Response `401` Unauthorized:**

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

**Response `500` Error:**

```json
{
  "success": false,
  "message": "WhatsApp client is not ready. Scan the QR code first.",
  "data": {
    "phone": "584241620546",
    "title": null
  }
}
```

---

## Flujo de Operación

### Autenticación inicial de WhatsApp Web

1. El servicio inicia Puppeteer en modo **headless** con una instancia de Chrome.
2. whatsapp-web.js genera un **código QR** que se renderiza en la consola.
3. El operador escanea el código QR desde la aplicación móvil de WhatsApp.
4. La sesión se persiste en `wa-session/` para reconexiones futuras sin necesidad de reautenticación.

### Envío de un mensaje

```
AutoNex Backend                    WA-Notifier                         WhatsApp
      │                                │                                  │
      │  POST /auth/token              │                                  │
      │  { apiKey }                    │                                  │
      │───────────────────────────────▶│                                  │
      │  { accessToken }               │                                  │
      │◀───────────────────────────────│                                  │
      │                                │                                  │
      │  POST /messages/send           │                                  │
      │  Authorization: Bearer <jwt>   │                                  │
      │  { phone, message, title }     │                                  │
      │───────────────────────────────▶│                                  │
      │                                │  simulate typing (5-14s)         │
      │                                ├─────────────────────────────────▶│
      │                                │  sendMessage                     │
      │                                ├─────────────────────────────────▶│
      │  { success: true }             │                                  │
      │◀───────────────────────────────│                                  │
```

---

## Simulación de Escritura

Para mitigar la detección automatizada y reducir el riesgo de bloqueo de cuenta, el servicio implementa una **simulación de estado de escritura** previo al envío de cada mensaje.

### Algoritmo de duración

```
duration = (baseDelay + (messageLength / charsPerSecond) × 1000) × variationFactor
```

| Parámetro         | Rango             | Descripción                                               |
| ----------------- | ----------------- | --------------------------------------------------------- |
| `baseDelay`       | 1000–2500 ms      | Tiempo inicial simulado (abrir chat, comenzar a escribir) |
| `charsPerSecond`  | 6–10 caracteres/s | Velocidad de escritura en dispositivos móviles            |
| `variationFactor` | 0.85–1.15         | Variación estocástica para evitar patrones predecibles    |

Duración resultante para un mensaje típico de 80 caracteres: **7–14 segundos**.

---

## Desarrollo

### Comandos disponibles

```bash
# Compilación
npm run build

# Desarrollo con recarga automática
npm run start:dev

# Formateo de código
npm run format

# Linting
npm run lint

# Pruebas unitarias
npm run test
npm run test:watch
npm run test:cov

# Pruebas end-to-end
npm run test:e2e
```

### Estructura del Proyecto

```
src/
├── main.ts                       # Punto de entrada de la aplicación
├── app.module.ts                 # Módulo raíz
├── auth/
│   ├── auth.module.ts            # Módulo de autenticación
│   ├── auth.controller.ts        # Endpoints de autenticación
│   ├── auth.service.ts           # Lógica de emisión de tokens
│   ├── auth-config.service.ts    # Gestión de auth-config.json
│   ├── jwt.strategy.ts           # Estrategia Passport para JWT
│   └── jwt-auth.guard.ts         # Guard de protección de rutas
├── whatsapp/
│   ├── whatsapp.module.ts        # Módulo de WhatsApp
│   └── whatsapp.service.ts       # Cliente WhatsApp + simulación de escritura
└── messages/
    ├── messages.module.ts        # Módulo de mensajes
    ├── messages.controller.ts    # Endpoint de envío
    ├── messages.service.ts       # Orquestación de envío
    └── dto/
        └── send-message.dto.ts   # Objeto de transferencia de datos
```

---

## Seguridad

### Buenas prácticas implementadas

- **Validación de datos de entrada:** Uso de `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted` para prevenir inyección de campos no esperados.
- **Rotación de credenciales:** La clave de API puede rotarse bajo demanda sin interrupción del servicio.
- **Almacenamiento seguro:** El archivo `auth-config.json` y `.env` están excluidos del control de versiones.
- **Expiración de tokens:** Los JWT cuentan con tiempo de vida limitado (`JWT_EXPIRATION`).

### Recomendaciones para entornos productivos

1. Utilizar un `JWT_SECRET` robusto (mínimo 256 bits) generado mediante un generador criptográficamente seguro.
2. Configurar `JWT_EXPIRATION` a intervalos cortos (1 hora o menos) según el volumen de operaciones.
3. Establecer rotación periódica de la clave de API mediante `POST /auth/rotate-key`.
4. Restringir el origen de las peticiones Cross-Origin Resource Sharing (CORS) en producción, modificando `app.enableCors()` en `main.ts`.

---

## Licencia

**UNLICENSED** — Uso interno del ecosistema AutoNex.
