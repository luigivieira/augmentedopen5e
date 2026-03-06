# Augmented Open5e (Open5e Aumentado)

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="32" style="opacity: 1;"></a>
</p>

Una API REST de código abierto (MIT) implementada en **[Azion Edge Functions](https://www.azion.com/es/documentacion/productos/build/edge-application/edge-functions/)** que actúa como una capa de "aumento" (augmentation) sobre la [API pública de Open5e](https://api.open5e.com/) para traducciones automáticas vía IA.

Sirve contenido del System Reference Document (SRD) de Dungeons & Dragons 5ª Edición, extendiéndolo automáticamente con traducciones generadas por Inteligencia Artificial a diferentes idiomas usando la **API de Groq** (con el modelo [llama-3.3-70b-versatile](https://console.groq.com/docs/models)).

> **¿Por qué Groq en lugar de Azion AI Inference?** Este proyecto es de código abierto y funciona con una cuenta gratuita de Azion. Al momento de este lanzamiento, el plan gratuito no incluye acceso a [Azion AI Inference](https://www.azion.com/es/documentacion/productos/ai/ai-inference/). En un entorno de pago, AI Inference sería una opción más directa y eficiente — sin dependencia de una API externa. Groq fue elegido como alternativa práctica: ofrece un plan gratuito generoso con inferencia rápida y excelente soporte multilingüe.

> **AVISO:** Este proyecto se basa enteramente en el SRD de D&D 5e, disponible bajo la licencia [Creative Commons Attribution 4.0 International (CC-BY 4.0)](https://creativecommons.org/licenses/by/4.0/). **Las traducciones proporcionadas por esta API son estrictamente generadas por máquina (vía IA/LLMs) bajo demanda y NO SON traducciones oficiales.** Este proyecto no está afiliado, respaldado ni creado con la intención de reproducir las obras traducidas protegidas por derechos de autor de Wizards of the Coast o de cualquiera de sus socios locales de publicación.

## Valor Real y Caso de Uso

El objetivo principal de esta API **no es** reemplazar la API de Open5e, sino complementarla. Un cliente puede usar Open5e directamente para búsqueda y paginación, y usar esta API únicamente como una capa de traducción rápida por slug.

Las traducciones son rápidas porque se ejecutan en el edge y se almacenan en caché globalmente — baja latencia garantizada después del primer acceso. Esto incluye el contenido original en inglés: una vez que un hechizo es obtenido de Open5e por primera vez, queda almacenado en caché en el edge y se reutiliza en todas las solicitudes de traducción posteriores para ese hechizo, sin llamadas repetidas a la API upstream.

Este proyecto tampoco pretende reemplazar ninguna traducción oficial existente, sino servir como un recurso para la comunidad y como demostración de lo que se puede construir en la plataforma Azion Edge.

**Ejemplo Concreto:** Una UI de libro de hechizos digital o hoja de personaje que muestra hechizos traducidos automáticamente. El cliente busca el hechizo en Open5e, extrae el slug y llama a esta API para obtener la traducción — sin necesidad de gestionar ninguna infraestructura de traducción propia.

## Alcance y Decisiones de Diseño

Esta API soporta intencionalmente solo la búsqueda individual de hechizos por slug. La API de Open5e ya maneja excelentemente la búsqueda y paginación — un cliente que tiene el slug de un hechizo puede usar esta API puramente como capa de traducción, solicitando el contenido para un locale determinado sin ninguna infraestructura adicional.

También vale mencionar que las traducciones en bloque (bulk) no están soportadas. El modelo de edge computing (V8 isolates con límites estrictos de tiempo de ejecución) no fue diseñado para procesamiento masivo de larga duración; esas operaciones corresponden a un cloud worker tradicional que consume una cola de mensajes.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/spell?slug=<slug>&locale=<locale>` | Devuelve un hechizo traducido al locale solicitado |
| `GET` | `/api/spells?locale=<locale>` | Devuelve todos los slugs actualmente en caché para un locale dado |

El endpoint `/api/spells` (sin slug) está destinado principalmente al uso interno y la observabilidad — no devuelve datos de hechizos, sino solo la lista de slugs ya almacenados en caché para cada locale.

**Formato del locale:** El parámetro de query `locale` debe seguir siempre el formato `idioma-región` (ej.: `pt-br`, `en-us`, `es-es`). Códigos simples como `pt` o `en` son rechazados con HTTP 400.

## Cómo Funciona

Cada solicitud a `GET /api/spell` sigue este flujo:

1. **Validación de entrada** — `slug` y `locale` son obligatorios. El formato del locale también se valida. Parámetros ausentes o malformados devuelven `400 Bad Request`.

2. **Consulta al caché** — El edge verifica KV Storage para el par `slug + locale`.
   - **Cache hit** → `200 OK` con el hechizo traducido. No se realiza ninguna llamada externa.

3. **Cache miss** — El edge verifica si el contenido base en inglés (`en-us`) ya está en caché.
   - **Inglés no cacheado** → El pipeline completo se dispara en segundo plano: obtener el hechizo de Open5e, cachear la versión en inglés, traducir y cachear el locale destino. Devuelve `202 Accepted` de inmediato.
   - **Inglés cacheado y locale destino es `en-us`** → Devuelve `200 OK` directamente.
   - **Inglés cacheado y locale destino es otro** → Solo el paso de traducción se ejecuta en segundo plano. Devuelve `202 Accepted`.

4. **Estado pendiente** — Si ya hay un job en segundo plano corriendo para ese `slug + locale`, la solicitud devuelve `202 Accepted` sin disparar un job duplicado.

5. **Polling del cliente** — En `202`, el cliente debe reintentar la misma solicitud después de un breve intervalo hasta recibir `200`.

6. **Respuestas de error** — `400` para entrada inválida; `500` para errores inesperados como timeouts en el edge, que no deberían ocurrir en condiciones normales.

## Sugerencias de Posibles Mejoras

La arquitectura actual sirve bien los resultados en caché, pero hay próximos pasos naturales si el proyecto evoluciona:

- Un **Cloud Worker** (ej.: Cloud Run, Lambda) consumiendo una cola de mensajes para procesar traducciones en bloque de forma asíncrona, fuera de las limitaciones del edge.
- El endpoint `/api/spells` podría activar automáticamente un trabajo de traducción en segundo plano cuando se solicite un locale por primera vez, convirtiéndolo en el punto de entrada natural para calentar el caché de un nuevo idioma.

## Desarrollo

Este proyecto utiliza [pnpm](https://pnpm.io/) como gestor de paquetes. Si no está instalado, instálalo globalmente mediante `npm install -g pnpm`.

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

Para implementar y gestionar este proyecto también es necesaria la [Azion CLI](https://www.azion.com/es/documentacion/productos/azion-cli/vision-general/). Instálala para tu plataforma:

**macOS/Linux:**

```bash
curl -fsSL https://cli.azion.app/install.sh | bash
```

**Windows (vía Winget):**

```bash
winget install aziontech.azion
```

Luego autentícate con tu cuenta de Azion:

```bash
azion login
```

### Desarrollo y Pruebas

#### Pruebas Unitarias

Utilizamos Vitest para las pruebas unitarias:

```bash
pnpm test
```

#### Emulación Local y Documentación

Puedes emular el entorno de Azion Edge Functions localmente antes de implementar.

1. **Inicia el Emulador** — en una primera terminal:

   ```bash
   pnpm emulate
   ```

2. **Abre el servidor local** en tu navegador en `http://localhost:3333`. La página de inicio muestra los detalles del proyecto, enlaces a la documentación interactiva de la API (Scalar UI) y acceso rápido para probar los endpoints directamente.

#### Emulador Local — Notas de Comportamiento

**KV Storage en disco:** Al ejecutar localmente, el emulador de Azion persiste los datos de KV en `.edge/storage/<nombre-del-bucket>/` en la raíz del proyecto. Para reiniciar la caché local, detén el emulador, elimina los archivos de ese directorio y reinícialo:

```bash
rm .edge/storage/augmented_spells_kv-staging/*
```

**Clave de API de Groq:** El emulador local llama a la **API real de Groq**. Crea un archivo `.env.local` en la raíz del proyecto antes de ejecutar `pnpm emulate`:

```env
GROQ_API_KEY=tu_clave_aqui
```

Este archivo ya está incluido en `.gitignore`. Obtén una clave gratuita en [console.groq.com](https://console.groq.com).

### Estrategia de Implementación (Deploy)

Este proyecto usa una configuración de doble entorno (Staging y Producción) definida en `azion.config.ts`. Los recursos creados en Azion reciben automáticamente el sufijo `-staging` o `-prod`.

Los archivos de estado `azion.json` (en `azion/staging/` y `azion/production/`) **están confirmados en el repositorio** para garantizar la consistencia del despliegue entre diferentes entornos y pipelines de CI/CD.

#### 1. Configuración para Nuevos Colaboradores

Después de clonar el repositorio, ejecuta el comando de reset para generar los archivos `azion.json` de arranque para tu propia cuenta de Azion:

```bash
pnpm reset
```

Tu primer `pnpm deploy` creará los recursos y actualizará estos archivos con los nuevos IDs.

#### 2. Despliegue de Staging

```bash
pnpm deploy:staging
```

Construye y despliega en el namespace `augmentedopen5e-staging`. En la primera ejecución, el CLI crea los recursos; en las siguientes, los actualiza usando los IDs confirmados.

#### 3. Despliegue de Producción

```bash
pnpm deploy:prod
```

Construye y despliega en el namespace `augmentedopen5e-prod`. **Nota:** En la mayoría de los casos, esto es manejado automáticamente por GitHub Actions en cada push a la rama `main` — el despliegue manual de producción generalmente no es necesario.

#### 4. Limpieza de la Caché Remota

```bash
pnpm delete:cache:staging
pnpm delete:cache:prod
```

Utiliza la CLI de Azion para listar y eliminar todos los objetos del bucket correspondiente. Útil para invalidar traducciones en caché que estén desactualizadas.

### Haciendo Fork de este Proyecto

Si haces fork de este repositorio, sigue estos pasos antes de tu primer despliegue:

1. Obtén tu propia clave de API de Groq en [console.groq.com](https://console.groq.com). Agrégala como `GROQ_API_KEY` en:
   - Un archivo `.env.local` en la raíz del proyecto (para emulación local).
   - Las variables de entorno de tu Edge Function en Azion (Azion Console → Edge Functions → tu función → Environment Variables).
2. Ejecuta `pnpm reset` para generar nuevos archivos `azion.json` de arranque. Sin este paso, el CLI intentará actualizar recursos que no existen en tu cuenta y fallará.
3. Después de tu primer despliegue exitoso, **confirma los archivos `azion.json` actualizados**. Estos archivos ahora contienen los IDs de tus recursos de Azion recién creados. Sin confirmarlos, futuros despliegues pueden fallar con un error de conflicto de recursos.

## Licencia

El código fuente está licenciado bajo la **Licencia MIT**.

El contenido servido por esta API (incluyendo las traducciones generadas por IA) es derivado del SRD de la 5ª Edición y está licenciado bajo **Creative Commons Attribution 4.0 International (CC-BY 4.0)**, coincidiendo con la licencia de la API de Open5e.

---

*Creado con amor y cuidado por Luiz Carlos Vieira para toda la comunidad.* ❤️
