# Augmented Open5e (Open5e Aumentado)

<p align="left">
  <a href="README.md"><img src="https://flagcdn.com/w40/us.png" alt="English" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEIAME.md"><img src="https://flagcdn.com/w40/br.png" alt="Português" width="22" style="opacity: 0.5;"></a>&nbsp;&nbsp;
  <a href="LEAME.md"><img src="https://flagcdn.com/w40/es.png" alt="Español" width="32" style="opacity: 1;"></a>
</p>

Una API REST de código abierto (Licencia MIT) implementada en **Azion Edge Functions** que actúa como una capa de "aumento" (augmentation) sobre la [API pública de Open5e](https://api.open5e.com/).

Sirve contenido del System Reference Document (SRD) de Dungeons & Dragons 5ª Edición y lo extiende automáticamente con traducciones generadas por Inteligencia Artificial (LLMs de Hugging Face) a diferentes idiomas.

> **⚠️ ATENCIÓN — Derechos de Autor:** Este proyecto se basa enteramente en el SRD (System Reference Document) de D&D 5e, que está disponible bajo la licencia Creative Commons (CC-BY). **Las traducciones proporcionadas por esta API son estrictamente generadas por máquina (vía IA/LLMs) bajo demanda y NO SON traducciones oficiales.** Este proyecto no está afiliado, respaldado ni creado con la intención de reproducir las obras traducidas protegidas por derechos de autor de Wizards of the Coast o de cualquiera de sus socios locales de publicación.

## Valor Real y Caso de Uso

El caso de uso principal de esta API **no es** reemplazar la API de Open5e, sino complementarla. Un cliente (aplicación) puede usar perfectamente Open5e directamente para búsqueda (search) y paginación (que es un caso de uso distinto con su propia UX), y usar esta API como una capa de traducción rápida a través del `slug`.

Las traducciones serán increíblemente rápidas precisamente porque se ejecutan en el edge y se almacenan en caché globalmente, lo que garantiza una latencia baja después del primer acceso.

**Ejemplo Concreto:** Una UI de un libro de hechizos o una hoja de personaje que muestra hechizos traducidos automáticamente al idioma del usuario. El cliente busca el hechizo en Open5e, obtiene el slug y llama a esta API para obtener su traducción — sin necesitar gestionar su propia infraestructura de traducción.

## Limitaciones Actuales

Actualmente, la API admite solo la **búsqueda de un hechizo individual por slug**. No hay endpoints relacionados con búsquedas abiertas, paginación u operaciones en bloque (bulk).

**¿Por qué?** El modelo de edge computing (ejecutado en V8 isolates) tiene límites estrictos en los tiempos de ejecución y no es adecuado para procesos masivos de larga duración u orquestación. Estas operaciones pertenecen a un "cloud worker" tradicional que consume una cola de mensajes, no al edge.

## Arquitectura y Roadmap

La arquitectura planificada para la futura iteración del proyecto separa la entrega rápida del procesamiento pesado:

1. **La Edge Function** sirve resultados cacheados y devuelve el estado `202 Accepted` para contenido que aún no ha sido traducido.
2. **Un Cloud Worker** (ej., Cloud Run, Lambda) consume una cola de mensajes (ej., SQS, Pub/Sub) y procesa las traducciones en bloque de forma asíncrona.
3. **El Edge SQL** permanece como una caché de lectura ultrarrápida en el "hot path" (camino crítico).

Esta separación respeta el punto fuerte del edge (servir con baja latencia) sin abusar de él para cargas de trabajo para las que no fue diseñado.

Además, el endpoint `GET /api/spells?locale=<locale>` podría, en el futuro (como una posibilidad o contribución de la comunidad), activar automáticamente el trabajo de traducción en segundo plano cuando se consulte un idioma (locale) sin ningún hechizo en caché — convirtiéndolo en el punto de entrada natural para comenzar a inicializar y calentar el caché de un idioma nuevo.

## Desarrollo

Este proyecto utiliza [pnpm](https://pnpm.io/) como su administrador de paquetes. Si no está instalado, se puede instalar globalmente mediante `npm install -g pnpm`.

Además, para implementar y administrar este proyecto, es estrictamente necesario tener el entorno [Azion CLI](https://www.azion.com/es/documentacion/productos/azion-cli/vision-general/) instalado y autenticado.
Para instalar la CLI oficial de Azion:

**Para macOS/Linux**:

```bash
curl -fsSL https://cli.azion.app/install.sh | bash
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

### Desarrollo y Pruebas

#### Pruebas Unitarias

Utilizamos Vitest para las pruebas unitarias. Para ejecutar la suite de pruebas:

```bash
pnpm test
```

#### Emulación Local y Documentación

Puedes emular localmente el entorno de Azion Edge Functions para probar cambios a través de una interfaz interactiva Scalar antes de implementar.

1. **Inicia el Emulador:**

   En una primera terminal, ejecuta:

   ```bash
   pnpm emulate
   ```

   Este comando levanta un servidor local que simula el entorno Edge (`azion dev`).

2. **Abre la Documentación de la API:**

   En una segunda terminal, ejecuta:

   ```bash
   pnpm open
   ```

   Esto abrirá automáticamente tu navegador en `http://localhost:3333/docs`, donde podrás visualizar la especificación y probar directamente los endpoints.

### Estrategia de Implementación (Deploy)

Este proyecto usa una configuración de doble entorno (Staging y Producción) definida en `azion.config.ts`. Los recursos creados en Azion reciben automáticamente el sufijo `-staging` o `-prod`.

Los archivos de estado `azion.json` (en `azion/staging/` y `azion/production/`) **están confirmados en el repositorio** para garantizar la consistencia del despliegue en diferentes entornos y pipelines de CI/CD.

#### 1. Configuración para Nuevos Colaboradores

Si acabas de clonar el repositorio y necesitas autorizar tus propios recursos de aplicación en Azion, ejecuta el comando de reinicio:

```bash
pnpm reset
```

Esto genera los archivos `azion.json` de arranque. Tu primer `pnpm deploy` creará los recursos y actualizará estos archivos con los nuevos IDs.

#### 2. Despliegue de Staging (local)

```bash
pnpm deploy:staging
```

Construye y despliega la edge function en el namespace `augmentedopen5e-staging`. En la primera ejecución (después de `pnpm reset`), el CLI crea los recursos; en las siguientes, los actualiza utilizando los IDs almacenados en `azion.json`.

#### 3. Despliegue de Producción (local o GitHub Actions)

```bash
pnpm deploy:prod
```

Construye y despliega en el namespace `augmentedopen5e-prod`. Utiliza los IDs confirmados en el repositorio para asegurar que siempre se actualice la aplicación correcta.

> **Importante para Forks:**
>
> 1. Cree un Personal Token en su consola de Azion.
> 2. En su repositorio de GitHub, vaya a **Settings → Secrets and variables → Actions** y agregue un secret llamado `AZION_PERSONAL_TOKEN` con el valor del token.

## Licencia

El código fuente de esta API está licenciado bajo la **Licencia MIT**.

El contenido servido por esta API (incluyendo las traducciones generadas por IA) es derivado del SRD de la 5ª Edición y está licenciado bajo la licencia **Creative Commons Attribution 4.0 International (CC-BY 4.0)**, coincidiendo con la licencia de la API de Open5e.
