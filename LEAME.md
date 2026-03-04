# Augmented Open5e (Open5e Aumentado)

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="32" style="opacity: 1;"></a>
</p>

Una API REST de código abierto (Licencia MIT) implementada en **Azion Edge Functions** que actúa como una capa de "aumento" (augmentation) sobre la [API pública de Open5e](https://api.open5e.com/).

Sirve contenido del System Reference Document (SRD) de Dungeons & Dragons 5ª Edición y lo extiende automáticamente con traducciones generadas por Inteligencia Artificial (LLMs de Hugging Face) a diferentes idiomas.

> **⚠️ ATENCIÓN — Derechos de Autor:** Este proyecto se basa enteramente en el SRD (System Reference Document) de D&D 5e, que está disponible bajo la licencia Creative Commons (CC-BY). **Las traducciones proporcionadas por esta API son estrictamente generadas por máquina (vía IA/LLMs) bajo demanda y NO SON traducciones oficiales.** Este proyecto no está afiliado, respaldado ni creado con la intención de reproducir las obras traducidas protegidas por derechos de autor de Wizards of the Coast o de cualquiera de sus socios locales de publicación.

## Características

- **Edge Native**: Se ejecuta globalmente en aislados V8 (V8 isolates) a través de [Azion Edge Functions](https://www.azion.com/es/productos/edge-functions/) para una latencia ultrabaja.
- **Autotraducción**: Traduce automáticamente hechizos al idioma solicitado ("locale") utilizando endpoints de inferencia de Hugging Face (el soporte para monstruos y objetos está planeado para versiones futuras).
- **Motor de Traducción Asíncrono**: Evita los tiempos de espera (timeouts) en el Edge al devolver datos parciales de inmediato mientras procesa traducciones en segundo plano.
- **Caché en Edge SQL**: Almacena en caché las entidades traducidas (y posiblemente las cadenas originales en inglés de Open5e) directamente en el borde de la red (edge) a través de una base de datos SQLite replicada globalmente mediante [Azion Edge SQL](https://www.azion.com/es/productos/edge-sql/).

## Arquitectura y Trade-offs (Pros y Contras)

Durante la fase de planificación de esta API, se tomaron decisiones arquitectónicas deliberadas enfocadas en la computación serverless en el borde.

### 1. Enrutador Monolítico vs Microfunciones

**Decisión**: Un único punto de entrada (`index.ts`) que enruta el tráfico internamente, en lugar de implementar decenas de funciones de Azion aisladas para cada ruta (`/monsters`, `/spells`, etc.).

**Trade-offs**:

- **Pros**: Reduce drásticamente los _cold starts_ (inicios en frío), ya que cualquier solicitud a la API mantiene el aislado V8 "caliente" para todas las demás rutas. También centraliza el middleware (como el análisis de JSON y el manejo de errores) y simplifica enormemente el despliegue a través de Azion CLI.
- **Contras**: El tamaño final del archivo (`.ts` empaquetado) es ligeramente mayor que el de una función de propósito único, aunque el impacto es insignificante para el entorno V8.

### 2. Azion Edge SQL vs Azion KV Store (Clave-Valor)

**Decisión**: Se utiliza Azion Edge SQL (SQLite Distribuido) en lugar de Azion KV Store (Almacenamiento Clave-Valor) para la capa de caché.

**Trade-offs**:

- **Pros**: **Flexibilidad en la paginación.** Si se usara un KV Store, consultar una lista paginada de hechizos (`/api/spells?page=2`) requeriría almacenar en caché _la respuesta completa de esa página_ como una sola cadena. Si el usuario luego agrega un filtro o cambia el tamaño de la página, el caché de la página se rompe. Con Edge SQL, se almacena la caché de traducciones a nivel de **Entidad** (ej., `slug: acid-arrow_es-es`). Se puede ejecutar un comando rápido `SELECT * WHERE slug IN (...)`, lo que permite consultas API dinámicas y robustas que se adaptan a cualquier variación de lista y paginación original.
- **Contras**: El almacenamiento SQL requiere un poco más de configuración inicial en comparación con los comandos simples `get` / `put` de una base de datos NoSQL clave-valor.

### 3. Traducciones Asíncronas vs Síncronas

**Decisión**: Las llamadas a la API de traducción LLM de Hugging Face ocurren de forma _asíncrona_ (en segundo plano) en lugar de bloquear la solicitud HTTP del usuario.

**Trade-offs**:

- **Pros**: Las Edge Functions tienen límites de tiempo de ejecución estrictos. Esperar a que un modelo de IA externo traduzca un gran bloque de JSON de forma síncrona conduciría invariablemente a errores de `504 Gateway Timeout`. Al devolver la lista sin traducir (o parcialmente traducida) inmediatamente y enviar la tarea de traducción a un segundo plano, la API principal sigue siendo extremadamente rápida.
- **Contras**: El usuario (o cliente) debe actualizar la página o realizar una solicitud posterior unos segundos después para ver las traducciones completadas una vez que el procesador en segundo plano las haya guardado en la base de datos de Edge SQL.

## Desarrollo

Este proyecto utiliza [pnpm](https://pnpm.io/) como su administrador de paquetes. Si no está instalado, se puede instalar globalmente mediante `npm install -g pnpm`.

Además, para implementar y administrar este proyecto, es estrictamente necesario tener el entorno [Azion CLI](https://www.azion.com/es/documentacion/productos/azion-cli/vision-general/) instalado y autenticado.
Para instalar la CLI oficial de Azion:

**Para macOS/Linux**:

```bash
curl -sSfL https://get.azion.com | sh
```

**Para Windows (vía Winget)**:

```bash
winget install aziontech.azion
```

Después de la instalación, inicie sesión en su cuenta:

```bash
azion login
```

### Configuración

Instalar dependencias:

```bash
pnpm install
```

Formatear y Lint:

```bash
pnpm format
pnpm lint
```

### Emulación Local

Puedes emular localmente el entorno de Azion Edge Functions para probar cambios antes de implementar.

1. **Inicia el Emulador:**

   ```bash
   pnpm emulate
   ```

   Este comando levanta un servidor local que simula el entorno Edge (`azion dev`).

2. **Prueba la API Local:**
   Para verificar que la API funciona localmente y probar la consulta hacia Open5e usando el endpoint `/api/test`:
   ```bash
   curl http://localhost:3000/api/test?slug=fireball
   ```

Desplegar en Azion (requiere Azion CLI):

```bash
pnpm deploy
```

## Licencia

El código fuente de esta API está licenciado bajo la **Licencia MIT**.

El contenido servido por esta API (incluyendo las traducciones generadas por IA) es derivado del SRD de la 5ª Edición y está licenciado bajo la licencia **Creative Commons Attribution 4.0 International (CC-BY 4.0)**, coincidiendo con la licencia de la API de Open5e.
