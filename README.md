# Sitio web del workshop «AI agents for chemical safety»

Sitio estático hecho con [Hugo](https://gohugo.io) para el workshop del **3 de noviembre de 2026** en SciLifeLab, Uppsala Biomedical Centre (BMC), con participación online por Zoom.

La estructura sigue la del repositorio [pharmbio/pharmbio-web](https://github.com/pharmbio/pharmbio-web): Hugo, un tema propio dentro de `themes/`, contenido en `content/`, imágenes en `static/img/` y publicación automática con GitHub Actions. La diferencia es que aquí casi todo el contenido vive en archivos de datos (`data/*.yaml`), así que **se puede editar el programa, los ponentes o los patrocinadores sin tocar HTML ni código**.

---

## Índice

1. [Qué incluye el sitio](#1-qué-incluye-el-sitio)
2. [Puesta en marcha en 5 minutos](#2-puesta-en-marcha-en-5-minutos)
3. [Mapa de archivos: qué se edita dónde](#3-mapa-de-archivos-qué-se-edita-dónde)
4. [Editar el contenido paso a paso](#4-editar-el-contenido-paso-a-paso)
5. [Registro: elegir dónde llegan las inscripciones](#5-registro-elegir-dónde-llegan-las-inscripciones)
6. [Publicar el sitio](#6-publicar-el-sitio)
7. [Personalizar el diseño](#7-personalizar-el-diseño)
8. [El día del workshop y después](#8-el-día-del-workshop-y-después)
9. [Privacidad y GDPR](#9-privacidad-y-gdpr)
10. [Lista de comprobación antes de abrir el registro](#10-lista-de-comprobación-antes-de-abrir-el-registro)
11. [Solución de problemas](#11-solución-de-problemas)
12. [Cómo funciona por dentro (para desarrolladores)](#12-cómo-funciona-por-dentro-para-desarrolladores)

---

## 1. Qué incluye el sitio

Una sola página principal con secciones, más una página de aviso de privacidad.

| Sección | Qué hace el visitante |
|---|---|
| **Portada** | Ve fecha, lugar, modalidad y coste. Puede registrarse, añadir el evento a su calendario (.ics) o compartir el enlace. Una línea de estado muestra la cuenta atrás, la fecha límite de registro o, el mismo día, la sesión en curso. A la derecha, una animación de ejemplo de un agente trabajando un caso (marcada como ilustrativa). |
| **About** | Lee la introducción y los objetivos. **Marca los temas que le interesan**: esos temas se copian solos al formulario de registro. |
| **Programme** | Ve el programa en hora CET **o en su propia zona horaria**, filtra por tipo de sesión, **marca sesiones favoritas** (estrella) y ve solo esas, y descarga el día completo o sus favoritas como archivo de calendario. El día del evento, la sesión en curso se resalta y las pasadas se atenúan. |
| **Speakers** | Tarjetas de ponentes con foto (o iniciales), afiliación, aviso «To be confirmed» y enlaces a sus sesiones en el programa. |
| **Register** | Formulario con validación. Los campos de comida, dieta y accesibilidad aparecen solo si elige asistencia presencial. Consentimiento GDPR. Opcionalmente muestra plazas presenciales restantes. |
| **Shape the discussion** | Envía una pregunta al panel (puede ser anónima) y vota el tema de la discusión de la tarde, con resultados en directo si se usa Google Sheets. |
| **Venue and online** | Dirección, entrada, sala, indicaciones, mapa de OpenStreetMap e información sobre Zoom. |
| **FAQ** | Preguntas frecuentes desplegables. |
| **Pie de página** | **Logos de organizadores y financiadores** con números de subvención (solo en la página principal, configurable), contacto y aviso de privacidad. |

Además: diseño adaptado a móvil, modo oscuro automático, navegación por teclado, respeto por «reducir movimiento» del sistema, datos estructurados de evento para Google y una versión imprimible del programa.

---

## 2. Puesta en marcha en 5 minutos

### Instalar Hugo

Se necesita **Hugo extended, versión 0.120 o posterior** (probado con 0.140.2).

- **macOS:** `brew install hugo`
- **Windows:** `winget install Hugo.Hugo.Extended`
- **Linux (Debian/Ubuntu):** descarga el `.deb` desde [las releases de Hugo](https://github.com/gohugoio/hugo/releases) y ejecuta `sudo dpkg -i hugo_extended_*.deb`. El paquete de `apt` suele estar desactualizado.

Comprueba la instalación con `hugo version`.

### Ver el sitio en tu ordenador

```bash
git clone <url-de-este-repositorio>
cd <carpeta-del-repositorio>
hugo server
```

Abre <http://localhost:1313>. Cada vez que guardes un archivo, el navegador se recarga solo.

### Generar la versión final

```bash
hugo --gc --minify
```

El resultado queda en la carpeta `public/`, lista para subir a cualquier servidor web. No hace falta hacerlo a mano si usas GitHub Pages (ver [sección 6](#6-publicar-el-sitio)).

---

## 3. Mapa de archivos: qué se edita dónde

```
.
├── hugo.toml                  ← AJUSTES PRINCIPALES: fecha, sede, contacto, registro, secciones, menú
├── content/
│   ├── _index.md              ← Texto de introducción («About the workshop»)
│   └── privacy.md             ← Aviso de privacidad
├── data/
│   ├── programme.yaml         ← PROGRAMA: sesiones, horarios, tipos, materiales
│   ├── speakers.yaml          ← PONENTES
│   ├── sponsors.yaml          ← ORGANIZADORES Y FINANCIADORES (logos del pie)
│   ├── workshop.yaml          ← Objetivos, temas seleccionables y público
│   ├── faq.yaml               ← Preguntas frecuentes
│   ├── poll.yaml              ← Pregunta y opciones de la votación
│   ├── venue.yaml             ← Indicaciones para llegar y notas prácticas
│   └── trace.yaml             ← Pasos de la animación de la portada
├── static/img/
│   ├── logos/                 ← Logos de patrocinadores
│   ├── speakers/              ← Fotos de ponentes
│   └── favicon.svg            ← Icono de la pestaña del navegador
├── themes/chemsafe/           ← Diseño (plantillas, CSS, JavaScript). Normalmente no se toca.
│   ├── layouts/partials/sections/   ← Una plantilla por sección de la página
│   ├── assets/css/main.css          ← Colores y estilos
│   └── assets/js/main.js            ← Interactividad
├── backend/google-apps-script/Code.gs   ← Script para guardar registros en Google Sheets
├── .github/workflows/hugo.yml ← Publicación automática en GitHub Pages
├── Dockerfile                 ← Alternativa: servir el sitio con nginx
└── netlify.toml               ← Alternativa: publicar en Netlify
```

**Regla general:** para cambiar *qué dice* el sitio, edita `hugo.toml`, `content/` o `data/`. Para cambiar *cómo se ve*, edita `themes/chemsafe/assets/css/main.css`.

### Dos reglas de formato que evitan casi todos los errores

**En los archivos YAML (`data/*.yaml`):**

- La sangría se hace con **espacios, nunca con tabuladores**. Mantén exactamente la misma sangría que las entradas vecinas.
- Si un texto contiene dos puntos (`:`) o empieza con un carácter especial, ponlo **entre comillas**: `title: "Keynote: agents in practice"`.
- Las líneas que empiezan con `#` son comentarios y no se muestran.

**En `hugo.toml`:**

- Todo lo que va debajo de una línea como `[params.venue]` pertenece a ese bloque hasta el siguiente encabezado entre corchetes. Por eso la línea `sections = [...]` está **arriba**, antes de los bloques `[params.xxx]`. Si añades un ajuste nuevo de `params`, colócalo también arriba.

---

## 4. Editar el contenido paso a paso

### 4.1 Fecha, hora, sede y contacto → `hugo.toml`

```toml
date        = "2026-11-03"          # AAAA-MM-DD
dateLabel   = "Tuesday 3 November 2026"
startTime   = "10:00"
endTime     = "15:00"
doorsOpen   = "09:30"               # "" para ocultar «Coffee from…»
timezone    = "Europe/Stockholm"
utcOffset   = "+01:00"              # CET. En horario de verano (CEST) sería "+02:00"
timezoneLabel = "CET"
```

- `utcOffset` es importante: con él se calculan la cuenta atrás, la sesión en curso, la conversión a la hora del visitante y los archivos de calendario. El 3 de noviembre Suecia ya está en horario de invierno (CET, +01:00).
- En `[params.venue]` están el nombre de la sede, dirección, entrada, sala y las coordenadas del mapa (`lat`, `lon`). **Comprueba el marcador del mapa** en la vista previa y ajusta las coordenadas si hace falta. Para obtenerlas: busca el edificio en [openstreetmap.org](https://www.openstreetmap.org), clic derecho → «Mostrar dirección», y copia los dos números.
- En `[params.contact]` están el nombre y el correo de contacto que aparecen en todo el sitio.

### 4.2 Texto de introducción → `content/_index.md`

Es un archivo Markdown normal. Escribe párrafos separados por una línea en blanco. Puedes usar `**negrita**`, `*cursiva*` y enlaces `[texto](https://…)`. El primer párrafo se muestra en tamaño grande.

### 4.3 Programa → `data/programme.yaml`

Cada sesión es un bloque que empieza con `- id:`. Las sesiones se muestran en el orden del archivo.

```yaml
  - id: chemsafeagent               # nombre corto único, sin espacios
    start: "10:30"                  # formato 24 h, entre comillas
    end: "11:00"
    type: talk                      # welcome | talk | demo | discussion | break
    title: "ChemSafeAgent"
    speakers: [edgar-lopez]         # ids de data/speakers.yaml; varios: [edgar-lopez, chris-dinh-long]
    speakerNote: ""                 # texto libre opcional junto a los ponentes
    description: >
      Texto que se ve al pulsar «About this session». Puede ocupar
      varias líneas mientras mantengan la sangría.
    slides: ""                      # enlace a las diapositivas (después del evento)
    recording: ""                   # enlace a la grabación (después del evento)
```

- **Añadir una sesión:** copia un bloque completo, pégalo en su lugar y cambia el `id` (debe ser único) y los demás campos.
- **Quitar una sesión:** borra su bloque completo.
- **No cambies el `id` de una sesión ya publicada** si puedes evitarlo: los visitantes que la marcaron con estrella la perderían.
- Las sesiones de tipo `break` no tienen estrella y se muestran más discretas.
- La nota sobre el programa (`note:`) aparece bajo el título «Programme».
- Los **tipos de sesión** y sus nombres visibles están en la lista `types:`. Su orden es el de los botones de filtro. Puedes añadir un tipo nuevo (por ejemplo `{ id: poster, label: "Posters" }`) y usarlo en `type: poster`.

### 4.4 Ponentes → `data/speakers.yaml`

```yaml
  - id: edgar-lopez                 # el mismo id que se usa en programme.yaml
    name: "Edgar López López"
    affiliation: "Uppsala University"
    role: ""                        # cargo, opcional
    bio: ""                         # 1–2 frases, opcional
    photo: ""                       # "img/speakers/edgar-lopez.jpg"
    url: ""                         # página personal o del grupo
    confirmed: true                 # false muestra «To be confirmed»
    initials: ""                    # opcional: sustituye las iniciales, p. ej. "?"
```

- **Fotos:** guárdalas en `static/img/speakers/`, cuadradas, de unos 400×400 px (JPG o WebP de menos de 150 KB). En `photo:` escribe la ruta **sin** `static/`: `img/speakers/edgar-lopez.jpg`. La foto se recorta en forma hexagonal automáticamente.
- Sin foto, se muestran las iniciales del nombre.
- Las sesiones de cada ponente aparecen solas en su tarjeta a partir del programa.
- **Ponente de RISE:** el borrador decía «Petru? Tawfik?». Cuando se confirme, cambia `name`, quita `initials: "?"` y pon `confirmed: true`.

### 4.5 Logos de patrocinadores → `data/sponsors.yaml` y `static/img/logos/`

Los logos se muestran en una franja blanca al final de la página principal, en dos grupos: **Organised by** y **Funded by**.

```yaml
funders:
  - name: "Formas, the Swedish Research Council for Sustainable Development"
    logo: "img/logos/formas.png"
    url: "https://formas.se/en"
    note: "Grant AC-2025/0027"
```

**Estado actual de los logos:**

| Organización | Logo | Origen |
|---|---|---|
| Uppsala University | ✅ incluido | copiado del repositorio pharmbio-web |
| SciLifeLab | ✅ incluido | copiado del repositorio pharmbio-web |
| Formas | ✅ incluido | copiado del repositorio pharmbio-web |
| Mistra SafeChem | ⏳ falta | se muestra el nombre en texto |
| PARC | ⏳ falta | se muestra el nombre en texto |
| Mistra | ⏳ falta | se muestra el nombre en texto |

**Para añadir un logo que falta:**

1. Descarga el logo oficial desde la página de prensa o de identidad gráfica de la organización. PARC y la UE suelen exigir un formato concreto para el reconocimiento de financiación de Horizon Europe (logo de la UE + texto «Funded by the European Union»); revisa las condiciones de la subvención.
2. Usa PNG con fondo transparente o SVG, de al menos 400 px de ancho.
3. Guárdalo en `static/img/logos/`, por ejemplo `static/img/logos/parc.png`.
4. En `data/sponsors.yaml`, escribe `logo: "img/logos/parc.png"` en la entrada correspondiente.

Mientras `logo:` esté vacío, el sitio muestra el nombre de la organización con tipografía, de modo que nunca aparece una imagen rota.

- La franja de logos siempre tiene fondo blanco, también en modo oscuro, para que los logos oficiales conserven sus colores.
- Para mostrar los logos también en la página de privacidad, pon `sponsorsOnAllPages = true` en `hugo.toml`.
- Comprueba las URL de las organizaciones (`url:`); en particular las de Mistra SafeChem y PARC.
- La frase sobre los logos está en `acknowledgement:`.

### 4.6 Objetivos, temas y público → `data/workshop.yaml`

- `aims:` es una lista simple de frases.
- `topics:` son los temas que el visitante puede marcar. Cada uno tiene `id`, `title` y `text`. El `title` es lo que llega en el registro, en el campo «interests».
- `audience:` es el texto de «Who should attend».

### 4.7 Preguntas frecuentes → `data/faq.yaml`

```yaml
  - q: "¿Pregunta?"
    a: "Respuesta. Admite **Markdown** y [enlaces](https://…)."
```

### 4.8 Votación → `data/poll.yaml`

Cambia `question:` y las opciones (`id` + `label`). Si usas Google Sheets, **copia también los `id` a `POLL_OPTIONS`** en `backend/google-apps-script/Code.gs`. Cambiar las opciones cuando ya hay votos mezcla resultados; hazlo antes de abrir el sitio.

### 4.9 Indicaciones de la sede → `data/venue.yaml`

`directions:` es texto Markdown y `practical:` una lista de notas breves. Revisa que la información sobre autobuses y wifi sea correcta.

### 4.10 Animación de la portada → `data/trace.yaml`

Cada paso tiene un `kind` (`task`, `search`, `model`, `reason`, `report` o `done`) y un `text`. Mantenlo en 5–8 pasos cortos. Si prefieres quitarla, pon `agentTrace = false` en `[params.features]`.

### 4.11 Mostrar, ocultar o reordenar secciones → `hugo.toml`

```toml
sections = ["hero", "about", "programme", "speakers", "register", "discussion", "venue", "faq"]
```

- Quita un nombre para ocultar esa sección; cambia el orden para reordenarlas.
- Si ocultas una sección, quita también su enlace del menú (`[[params.nav]]`).
- Las funciones individuales se activan y desactivan en `[params.features]`: `questions`, `poll`, `myAgenda` (estrellas), `map` y `agentTrace`.

### 4.12 Añadir una página nueva (por ejemplo, un código de conducta)

Crea `content/code-of-conduct.md`:

```markdown
---
title: "Code of conduct"
description: "Expected behaviour at the workshop."
---

Texto en Markdown…
```

Se publica en `/code-of-conduct/` con el mismo diseño. Para enlazarla desde el pie, edita `themes/chemsafe/layouts/partials/footer.html`.

### 4.13 Añadir una sección nueva a la página principal

1. Crea `themes/chemsafe/layouts/partials/sections/posters.html` copiando una sección sencilla, como `faq.html`, como punto de partida. Dale un `id="posters"` al elemento `<section>`.
2. Añade `"posters"` a la lista `sections` en `hugo.toml`.
3. Opcional: añade un enlace al menú con `[[params.nav]]` y `url = "#posters"`.

---

## 5. Registro: elegir dónde llegan las inscripciones

Un sitio estático no tiene base de datos propia, así que el formulario envía los datos a un servicio externo. Se elige en `hugo.toml`:

```toml
[params.registration]
  open          = true
  provider      = "mailto"   # mailto | apps-script | formspree | netlify | external
  endpoint      = ""
  externalUrl   = ""
  deadline      = ""         # "2026-10-20": el formulario se cierra solo al final de ese día
  deadlineLabel = "Deadline to be announced"
  onsiteCapacity = 0
  closedMessage = "Registration is closed. …"
```

### Comparación rápida

| Opción | Servidor necesario | Dónde llegan los datos | Resultados de votación en vivo | Plazas restantes | Duplicados bloqueados | Correo de confirmación |
|---|---|---|---|---|---|---|
| `mailto` (por defecto) | No | Al correo de contacto, **solo si el visitante envía el correo** | No | No | No | No |
| `apps-script` (recomendada) | No (Google) | Hoja de Google Sheets | Sí | Sí | Sí | Sí |
| `formspree` | No (servicio externo) | Panel de Formspree + correo | No | No | No | Con plan de pago |
| `netlify` | Solo si alojas en Netlify | Panel de Netlify | No | No | No | No |
| `external` | — | Tu formulario externo (p. ej. de UU) | No | No | Según el formulario | Según el formulario |

**`mailto`** funciona sin configurar nada, pero depende de que el visitante tenga un programa de correo y pulse «Enviar». Sirve para probar, no para el registro definitivo.

### 5.1 Google Sheets con Apps Script (recomendada)

Guarda cada registro, pregunta y voto en una hoja de cálculo, envía un correo de confirmación, avisa a los organizadores, bloquea correos duplicados, controla el aforo presencial y alimenta los resultados de la votación.

1. **Crea la hoja.** En Google Drive: Nuevo → Hojas de cálculo de Google. Llámala, por ejemplo, «Workshop AI agents – registros». Usa preferiblemente una cuenta institucional o compartida, no personal.
2. **Abre el editor de scripts.** En la hoja: Extensiones → Apps Script.
3. **Pega el código.** Borra el contenido de `Código.gs` y pega todo el archivo `backend/google-apps-script/Code.gs` de este repositorio.
4. **Ajusta `CONFIG`** al principio del archivo:
   - `SITE_URL`: la dirección pública del sitio.
   - `ONSITE_CAPACITY`: aforo de la sala (0 = sin límite). Pon el mismo número en `onsiteCapacity` de `hugo.toml`.
   - `SEND_CONFIRMATION`: `true` para enviar confirmación a cada persona.
   - `NOTIFY_EMAIL`: correo que recibe un aviso por cada registro y pregunta (`''` para desactivarlo).
   - `POLL_OPTIONS`: los `id` de `data/poll.yaml`.
5. **Ejecuta `setup` una vez.** Elige la función `setup` en el desplegable de arriba y pulsa «Ejecutar». Google pedirá permisos para editar la hoja y enviar correos. Acéptalos. Si aparece «Google no ha verificado esta aplicación», pulsa «Configuración avanzada» → «Ir a … (no seguro)»: es tu propio script. Se crearán las pestañas Registrations, Questions y Votes.
6. **Publica como aplicación web.** Implementar → Nueva implementación → tipo «Aplicación web».
   - Ejecutar como: **Yo**.
   - Quién tiene acceso: **Cualquier usuario** (Anyone). Es necesario para que los visitantes, sin cuenta de Google, puedan enviar el formulario. Nadie puede leer la hoja por esta vía; solo se obtienen recuentos agregados de la votación y del aforo.
   - Pulsa «Implementar» y copia la URL que termina en `/exec`.
7. **Conecta el sitio.** En `hugo.toml`:
   ```toml
   provider = "apps-script"
   endpoint = "https://script.google.com/macros/s/XXXXXXXX/exec"
   onsiteCapacity = 40
   ```
8. **Prueba.** Haz un registro de prueba en el sitio publicado, comprueba que aparece en la hoja y que llega el correo, y luego borra la fila de prueba.

**Importante:** cada vez que modifiques `Code.gs` tienes que volver a publicar: Implementar → Gestionar implementaciones → lápiz → Versión: «Nueva versión» → Implementar. La URL no cambia. Si no lo haces, sigue funcionando la versión anterior.

**Límites de Google:** una cuenta gratuita puede enviar unos 100 correos al día desde Apps Script; una cuenta de Google Workspace, bastantes más. Para un workshop es suficiente. Si se agota la cuota, los registros se siguen guardando pero no se envía la confirmación.

**Exportar la lista de asistentes:** en la hoja, Archivo → Descargar → Microsoft Excel o CSV. Puedes filtrar por la columna `attendance` para contar asistentes presenciales o sacar la lista de correos para enviar el enlace de Zoom.

### 5.2 Formspree

1. Crea una cuenta en [formspree.io](https://formspree.io) y un formulario nuevo.
2. Copia la URL del formulario (`https://formspree.io/f/xxxxxxx`).
3. En `hugo.toml`: `provider = "formspree"` y `endpoint = "https://formspree.io/f/xxxxxxx"`.

Registros, preguntas y votos llegan al mismo formulario; el campo `type` indica cuál es cada uno. Revisa los límites del plan gratuito.

### 5.3 Netlify Forms

Solo si publicas el sitio en Netlify. Pon `provider = "netlify"`. Los tres formularios (registration, question, poll) aparecen en el panel del sitio en Netlify → Forms tras el primer despliegue.

### 5.4 Formulario externo

Si la universidad prefiere su propio sistema de inscripción: `provider = "external"` y `externalUrl = "https://…"`. Todos los botones «Register» llevan a ese formulario y la sección de registro muestra un botón hacia él. Las preguntas y la votación se envían entonces por correo (mailto).

### 5.5 Cerrar el registro

- **Automáticamente:** pon `deadline = "2026-10-20"`. El formulario se cierra al terminar ese día (hora CET) y la portada muestra «Register by …» hasta entonces.
- **Manualmente:** pon `open = false`. Se muestra `closedMessage`.
- Tras la fecha del evento, el formulario se cierra solo.

---

## 6. Publicar el sitio

### 6.1 GitHub Pages (recomendado, igual que pharmb.io)

El archivo `.github/workflows/hugo.yml` ya lo hace todo.

1. Sube el repositorio a GitHub, con la rama principal llamada `main`.
2. En GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Haz cualquier cambio y súbelo a `main`. En la pestaña **Actions** verás cómo se construye y publica. Tarda 1–2 minutos.
4. La dirección aparece en Settings → Pages, por ejemplo `https://pharmbio.github.io/ai-agents-chemsafety/`.

La acción ajusta la URL base automáticamente, así que no hace falta cambiar `baseURL` en `hugo.toml` para GitHub Pages. Aun así, conviene ponerla allí para que `hugo server` y los enlaces para compartir sean correctos.

**Dominio propio** (por ejemplo `aiagents.pharmb.io`): en Settings → Pages → Custom domain escribe el dominio y crea el registro DNS `CNAME` que indica GitHub. Pon ese dominio en `baseURL`.

**Trabajar con ramas y revisiones**, como en pharmbio-web:

```bash
git checkout -b nombre/tema-del-cambio
# … editar …
git commit -am "Actualizar ponente de RISE"
git push -u origin nombre/tema-del-cambio
```

Abre un Pull Request. La acción construye el sitio para comprobar que no hay errores (marca verde) pero **no publica** hasta que el PR se fusiona con `main`.

**Editar sin instalar nada:** en GitHub, abre un archivo (por ejemplo `data/programme.yaml`), pulsa el lápiz, edita y pulsa «Commit changes». El sitio se republica solo.

### 6.2 Netlify

Conecta el repositorio en Netlify. `netlify.toml` ya indica el comando de construcción y la carpeta. Útil si quieres Netlify Forms.

### 6.3 Servidor propio o de la universidad (Docker / nginx)

```bash
docker build -t chemsafe-workshop --build-arg BASE_URL=https://tu.dominio/ .
docker run -p 8080:80 chemsafe-workshop
```

Sin Docker: ejecuta `hugo --gc --minify --baseURL https://tu.dominio/` y copia el contenido de `public/` a la carpeta pública del servidor.

---

## 7. Personalizar el diseño

### Colores

Al principio de `themes/chemsafe/assets/css/main.css`:

```css
:root {
  --paper:    #f3f6f5;   /* fondo de la página */
  --surface:  #ffffff;   /* formularios y paneles */
  --ink:      #12232a;   /* texto */
  --muted:    #52646b;   /* texto secundario */
  --line:     #d3dddb;   /* bordes */
  --teal:     #0b6b66;   /* color principal: botones y enlaces */
  --teal-ink: #07504c;   /* color principal al pasar el ratón */
  --teal-wash:#e3efed;   /* fondo de elementos seleccionados */
  --amber:    #eeae1c;   /* señal: «ahora», estrellas. Usar poco */
  --panel:    #10262d;   /* panel de la animación */
}
```

Justo debajo hay un bloque `@media (prefers-color-scheme: dark)` con los mismos colores para el modo oscuro. Si cambias un color, cambia también su versión oscura. Mantén buen contraste entre texto y fondo; puedes comprobarlo en [webaim.org/resources/contrastchecker](https://webaim.org/resources/contrastchecker/).

### Tipografías

- **Bricolage Grotesque** para títulos.
- **Atkinson Hyperlegible** para el texto, diseñada para máxima legibilidad.
- **JetBrains Mono** solo en la animación de la portada.

Se cargan desde Google Fonts en `themes/chemsafe/layouts/partials/head.html`. Para cambiarlas, sustituye el enlace de Google Fonts allí y los nombres en `--font-display`, `--font-body` y `--font-mono` del CSS.

### Icono y textos de la pestaña

- `static/img/favicon.svg` es el icono de la pestaña.
- El título que aparece en Google y al compartir el enlace sale de `title` y `description` en `hugo.toml`.

---

## 8. El día del workshop y después

### Previsualizar cómo se verá el sitio en un momento concreto

Añade `?now=` a la dirección:

```
http://localhost:1313/?now=2026-11-03T11:10
```

Verás la sesión de las 11:00 marcada como «Happening now», las anteriores atenuadas y la línea de estado de la portada cambiada. Funciona también en el sitio publicado y no afecta a los demás visitantes. Otros ejemplos:

- `?now=2026-11-02T12:00` → «Starts tomorrow».
- `?now=2026-11-04T09:00` → mensaje posterior al evento.

### Cambios de última hora

Edita `data/programme.yaml`, súbelo a `main` y en 1–2 minutos está publicado. Para avisos generales, puedes cambiar `deadlineLabel` o añadir un párrafo al principio de `content/_index.md`.

### Recoger las preguntas para el panel

Con Google Sheets, están en la pestaña **Questions**, con la sesión a la que van dirigidas. Con las otras opciones, en tu correo o en el panel del servicio. El resultado de la votación está en la pestaña **Votes** (o en vivo en el sitio).

### Después del evento

- Añade `slides:` y `recording:` a cada sesión en `data/programme.yaml`; aparecen como enlaces en el programa.
- Actualiza la respuesta sobre grabaciones en `data/faq.yaml`.
- Tras el evento, la portada muestra automáticamente un mensaje de agradecimiento y el registro se cierra.
- Borra los datos de registro en el plazo indicado en el aviso de privacidad.

---

## 9. Privacidad y GDPR

- `content/privacy.md` contiene un **borrador** de aviso de privacidad. **Revísalo con el delegado de protección de datos de la universidad** antes de abrir el registro, sobre todo el plazo de conservación, quién es el responsable del tratamiento y el enlace a la política de UU (hay un comentario donde añadirlo).
- Si usas Google Sheets o Formspree, los datos se guardan en servidores de esos proveedores. Menciónalo en el aviso y comprueba que la universidad lo permite. Algunas universidades suecas exigen usar su propio sistema; en ese caso usa `provider = "external"`.
- El sitio **no usa cookies ni analítica**. Guarda en el navegador del visitante (localStorage) solo sus sesiones favoritas, los temas marcados, su preferencia de zona horaria, si ha votado y un resumen de su propio registro. Nada de eso se envía a nadie.
- Las **tipografías se cargan desde Google Fonts**, lo que transmite la dirección IP del visitante a Google. Si la universidad prefiere evitarlo:
  1. Descarga las fuentes, por ejemplo con [google-webfonts-helper](https://gwfh.mranftl.com/fonts).
  2. Guarda los archivos `.woff2` en `static/fonts/`.
  3. Declara las fuentes con `@font-face` al principio de `main.css`.
  4. Borra las tres líneas `<link … fonts.googleapis.com …>` / `fonts.gstatic.com` de `head.html`.
- El mapa se carga desde OpenStreetMap solo cuando el visitante llega a esa sección. Si no se quiere, pon `map = false`; queda el enlace «Open the map in a new tab».
- Los formularios incluyen un campo oculto «trampa» contra robots de spam. Con Google Sheets, además, se neutralizan textos que la hoja podría interpretar como fórmulas.

---

## 10. Lista de comprobación antes de abrir el registro

- [ ] `baseURL` en `hugo.toml` apunta a la dirección definitiva.
- [ ] Fecha, horario, `utcOffset` (+01:00 en noviembre), sala y entrada son correctos.
- [ ] El marcador del mapa está sobre la entrada correcta de BMC.
- [ ] Programa y ponentes revisados; el ponente de RISE, confirmado o marcado como TBC.
- [ ] Afiliación de Chris Dinh Long añadida.
- [ ] Logos de Mistra SafeChem, PARC y Mistra añadidos, y requisitos de visibilidad de la financiación UE/PARC comprobados.
- [ ] URL de todas las organizaciones comprobadas.
- [ ] Sistema de registro elegido y conectado (`provider` y `endpoint`), con una inscripción de prueba realizada y borrada.
- [ ] `deadline` y `onsiteCapacity` establecidos si se conocen.
- [ ] Aviso de privacidad revisado por el DPO.
- [ ] Indicaciones de llegada y nota de wifi revisadas (`data/venue.yaml`).
- [ ] Probado en móvil y en ordenador.

---

## 11. Solución de problemas

| Problema | Causa probable y solución |
|---|---|
| `hugo server` muestra un error con un número de línea en un `.yaml` | Sangría incorrecta (tabulador en vez de espacios) o un texto con `:` sin comillas. Mira la línea indicada y la anterior. |
| Una sección ha desaparecido | Revisa la lista `sections` de `hugo.toml`, y que esté **encima** de los bloques `[params.xxx]` (regla de TOML, sección 3). |
| Un ajuste nuevo de `hugo.toml` no tiene efecto | Probablemente quedó dentro de otro bloque `[params.xxx]` por estar debajo de él. Súbelo. |
| Un ponente no aparece en una sesión | El `id` en `speakers:` del programa no coincide exactamente con el `id` en `speakers.yaml`. |
| Un logo o una foto no se ve | La ruta debe ser relativa a `static/` y sin barra inicial: `img/logos/parc.png`. Revisa mayúsculas y minúsculas y la extensión. |
| El registro dice «Online registration is not connected yet» | `provider` es `apps-script` o `formspree` pero `endpoint` está vacío. |
| El registro dice «Sending failed…» con Google Sheets | La URL no termina en `/exec`; el acceso no está en «Cualquier usuario»; o cambiaste el script sin publicar una nueva versión. En Apps Script → Ejecuciones verás el error concreto. |
| No llega el correo de confirmación | Revisa la carpeta de spam, que `SEND_CONFIRMATION` esté en `true` y la cuota diaria de correo de Google. |
| Los resultados de la votación no aparecen | Solo se muestran con `apps-script`. Revisa también que los `id` de `poll.yaml` estén en `POLL_OPTIONS`. |
| En GitHub Pages faltan estilos o los enlaces van a la raíz | Pages no está configurado con «GitHub Actions» como fuente, o se publicó sin la acción. Revisa la pestaña Actions. |
| La acción de GitHub falla | Abre el paso marcado en rojo en Actions: suele ser el mismo error de YAML que verías con `hugo server`. |
| Quiero borrar mis estrellas o mi registro guardado | Se guardan en el navegador: bórralos desde la configuración de datos del sitio del navegador, o pulsa «Register someone else». |

---

## 12. Cómo funciona por dentro (para desarrolladores)

- **Plantillas:** `themes/chemsafe/layouts/_default/baseof.html` es el esqueleto. `index.html` recorre `site.Params.sections` e incluye `partials/sections/<nombre>.html`. `partials/footer.html` pinta los logos.
- **HTML completo sin JavaScript:** todo el contenido (programa, ponentes, FAQ) se genera en el servidor, así que el sitio se lee y se indexa sin JavaScript. `main.js` solo añade interactividad; los controles que la necesitan llevan `data-needs-js` y se muestran al cargar el script.
- **Configuración para JavaScript:** `partials/site-config.html` genera un bloque `<script type="application/json" id="site-config">` con los ajustes y datos que usa `main.js`. Hugo convierte los nombres de parámetros a minúsculas, por eso ese archivo los mapea explícitamente a camelCase. Si añades un ajuste que necesite JavaScript, añádelo allí.
- **CSS y JS** se procesan con Hugo Pipes: minificados y con huella (`fingerprint`) para que los navegadores no usen versiones antiguas en caché. El JS se compila con esbuild, incluido en Hugo, para compatibilidad ES2018.
- **Envío de formularios:** la función `send()` de `main.js` implementa los cinco proveedores. Con Apps Script envía el cuerpo JSON como `text/plain` para evitar la petición previa CORS, que Apps Script no admite.
- **API del script** (`Code.gs`):
  - `POST` con `{type: "registration" | "question" | "vote", …}` responde `{ok: true}` o `{ok: false, error: "duplicate" | "onsite-full" | …}`.
  - `GET ?action=poll` responde `{counts: {id: n}}`.
  - `GET ?action=stats` responde `{onsite, online, total}`.
- **Calendario:** los archivos `.ics` se generan en el navegador, en UTC, con líneas plegadas según RFC 5545.
- **Accesibilidad:** enlace «Skip to content», estados `aria-pressed` en todos los botones de alternar, regiones `aria-live` para mensajes de formularios, foco visible en ámbar, y animaciones desactivadas con `prefers-reduced-motion`.
- **Almacenamiento local:** todas las claves llevan el prefijo `aics:` y cada acceso está protegido con `try/catch` (modo privado).

Licencia del tema: MIT. Los logos pertenecen a sus respectivas organizaciones y se usan para reconocer la organización y financiación del workshop.
