# Encuesta Web Interactiva: Jamaica Pipiles

Este proyecto es una aplicación web interactiva premium diseñada a medida para el estudio de mercado de **Jamaica Pipiles**. Está estructurada como un formulario de paso a paso (step-by-step) con animaciones fluidas, lógica de saltos de preguntas y adaptabilidad total para teléfonos móviles.

Las respuestas se recolectan automáticamente y se guardan en una hoja de **Google Sheets** de forma 100% gratuita utilizando Google Apps Script.

---

## 🚀 Guía de Despliegue Rápido (Costo Cero)

### Paso 1: Configurar la Base de Datos (Google Sheets)

1. Ve a tu Google Drive y crea una nueva **Hoja de cálculo de Google** (Google Sheet). Puedes llamarla `Respuestas Encuesta Jamaica Pipiles`.
2. En el menú superior de la hoja de cálculo, haz clic en **Extensiones** > **Apps Script**.
3. Se abrirá una nueva pestaña con un editor de código. Borra todo el código que aparezca por defecto en el editor.
4. Abre el archivo `google-script.js` de este proyecto, copia todo su contenido y pégalo en el editor de Apps Script.
5. Haz clic en el icono del disquete (Guardar proyecto) en la parte superior.
6. Haz clic en el botón azul **Implementar** (Deploy) > **Nueva implementación** (New deployment).
7. En el menú de tipo de implementación (icono de engranaje), selecciona **Aplicación web** (Web app).
8. Configura los siguientes parámetros:
   - **Descripción:** `Backend de la encuesta Pipiles`
   - **Ejecutar como:** `Tú (tu dirección de correo de Google)`
   - **Quién tiene acceso:** `Cualquiera` *(Esto es muy importante para que la web pública pueda enviar las respuestas).*
9. Haz clic en **Implementar**. Si Google te pide autorizar permisos para que el script acceda y escriba en tu hoja de cálculo, acéptalos (haz clic en *Configuración Avanzada* > *Ir a Proyecto (no seguro)* y concede los permisos).
10. Copia la **URL de la aplicación web** que te generará al finalizar (se ve similar a `https://script.google.com/macros/s/AKfycb.../exec`).

### Paso 2: Conectar la Web con Google Sheets

1. Abre el archivo `app.js` en tu editor de código.
2. En la línea 5, reemplaza el valor de la variable `GOOGLE_SCRIPT_URL` por la URL que copiaste en el paso anterior:
   ```javascript
   const GOOGLE_SCRIPT_URL = "PEGAR_AQUÍ_LA_URL_DE_TU_APPS_SCRIPT";
   ```
3. Guarda los cambios en `app.js`.

### Paso 3: Subir a la Web Gratis con GitHub Pages

Puedes alojar este sitio de forma gratuita en GitHub Pages siguiendo estos pasos rápidos:

1. Crea una cuenta gratuita en [GitHub](https://github.com/) si aún no tienes una.
2. Crea un nuevo repositorio público con el nombre `sitios-web` o el que uses para tu sitio principal.
3. Sube toda la estructura de carpetas a tu repositorio (de modo que la encuesta quede en el subdirectorio `Pipiles/encuesta/`).
4. En GitHub, ve a la pestaña **Settings** (Configuración) de tu repositorio.
5. En el menú de la izquierda, busca la sección **Pages**.
6. En **Build and deployment** > **Source**, asegúrate de que esté seleccionado `Deploy from a branch`.
7. En **Branch**, selecciona `main` (o `master`) y la carpeta `/ (root)`. Haz clic en **Save**.
8. ¡Listo! Espera alrededor de 1 minuto y GitHub Pages te proporcionará un enlace público gratuito (por ejemplo: `https://tu-usuario.github.io/sitios-web/Pipiles/encuesta/`).
9. Puedes compartir este enlace a las personas que responderán tu encuesta.

---

## 🛠️ Personalización Futura (Videos e Imágenes)

### Cómo agregar tus videos finales:
Cuando tengas listos los videos en **YouTube** o **Vimeo**, abre el archivo `index.html` y dirígete al paso `#step-multimedia` (línea 46). Reemplaza los elementos `<div class="video-placeholder">` por el código de inserción (`iframe`) que te proporciona YouTube o Vimeo.

Ejemplo para YouTube:
```html
<iframe src="https://www.youtube.com/embed/ID_DE_TU_VIDEO" frameborder="0" allowfullscreen></iframe>
```

---

## 📁 Archivos del Proyecto

- `index.html` - Estructura y flujo de pasos.
- `style.css` - Estilos con los colores fucsia y mora, cenefas oficiales y diseño responsive.
- `app.js` - Control de validaciones, navegación y conexión.
- `google-script.js` - Backend de Google Apps Script.
