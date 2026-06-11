# Checklist de seguridad — Despliegue Web Omnex

Checklist de acciones a completar antes y después de publicar la web en producción.
Ninguna de estas acciones modifica el código fuente; todas se aplican en infraestructura externa.

---

## 1. Hosting / CDN

### HTTPS y transporte

- [ ] **Activar HTTPS** en Hostinger para el dominio `omnex.es` (certificado SSL/TLS activo).
- [ ] **Redirigir HTTP → HTTPS** de forma permanente (301). En Apache/Hostinger, añadir al `.htaccess`:
  ```
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
  ```
- [ ] **Activar HSTS** (`Strict-Transport-Security`) con al menos 6 meses (`max-age=15768000`). Ver `headers.example.txt`.

### Cabeceras de seguridad HTTP

- [ ] Configurar `Content-Security-Policy` (CSP). Ver `headers.example.txt`. **Probar en staging antes de producción.**
- [ ] Configurar `X-Content-Type-Options: nosniff`.
- [ ] Configurar `Referrer-Policy: strict-origin-when-cross-origin`.
- [ ] Configurar `Permissions-Policy` para deshabilitar APIs no usadas.
- [ ] Configurar `X-Frame-Options: SAMEORIGIN` (o cubrirlo con la directiva `frame-ancestors` de la CSP).

### Control de acceso y bots

- [ ] **Verificar `robots.txt`**: confirmar que no se indexan rutas que no deban aparecer en buscadores.
- [ ] Si el hosting o CDN ofrece **rate limiting**, activarlo sobre las rutas de la web (especialmente útil si se añade un proxy `/api/`).
- [ ] Si el hosting o CDN ofrece **firewall de aplicación (WAF)**, revisar las reglas y activar las básicas.
- [ ] Desactivar listado de directorios en el servidor (en Apache: `Options -Indexes` en `.htaccess`).

### Archivos sensibles

- [ ] Confirmar que **no hay archivos `.env`, credenciales, backups ni ficheros de configuración** accesibles desde el webroot.
- [ ] Confirmar que el archivo `.gitignore` excluye correctamente lo que no debe subirse.

---

## 2. n8n (webhook del chatbot)

Aplicar dentro del workflow de n8n que recibe peticiones desde `omni-chat.js`.

- [ ] **Aceptar solo método POST.** Rechazar GET, PUT, DELETE con error 405.
- [ ] **Validar `Content-Type: application/json`** en la petición entrante. Rechazar cualquier otro content-type.
- [ ] **Validar el esquema del payload.** El body debe contener exactamente los campos esperados (`message`, `history`, opcionalmente `sessionId`). Rechazar payloads con campos adicionales inesperados o estructura incorrecta.
- [ ] **Limitar la longitud del campo `message`** (por ejemplo, máximo 1000 caracteres). Rechazar mensajes más largos con un error controlado.
- [ ] **Limitar la longitud del campo `history`** (por ejemplo, máximo 20 turnos o 8000 caracteres totales).
- [ ] **No confiar en `x-chat-token` como mecanismo de autenticación real.** El token es visible en el código fuente del navegador. Se puede usar como filtro de primer nivel (rechazar peticiones sin el header correcto), pero no como garantía de autenticidad.
- [ ] **No devolver HTML al frontend.** Las respuestas deben ser siempre JSON válido, incluso en caso de error.
- [ ] **Registrar las peticiones abusivas** (payloads malformados, longitudes excesivas, frecuencia anómala) en los logs de n8n o en un sistema de alertas.
- [ ] Si el CDN o un proxy lo permite, **añadir rate limiting** antes de que las peticiones lleguen al webhook (por ejemplo, máximo N peticiones por IP por minuto).
- [ ] Revisar que el nodo de n8n que llama al modelo de IA no ejecute el workflow completo con payloads de prueba o abusivos (añadir condición de validación previa al nodo de IA).

---

## 3. Google Apps Script (formulario de contacto)

Aplicar en el código del Apps Script (`Code.gs` o equivalente) que recibe el POST del formulario.

- [ ] **Validar todos los campos del formulario** en el script: `name`, `email`, `phone`, `service`, `message`, `consent`. Rechazar si faltan campos obligatorios.
- [ ] **Validar formato de email** con una expresión regular básica.
- [ ] **Limitar longitudes máximas** por campo (por ejemplo: `name` ≤ 100 chars, `message` ≤ 2000 chars).
- [ ] **Rechazar payloads con campos inesperados** o estructura incorrecta (comparar contra un esquema fijo).
- [ ] **Añadir campo honeypot** (campo oculto en el formulario que los bots tienden a rellenar; si llega relleno, descartar la petición silenciosamente).
- [ ] **Añadir timestamp de envío**: validar en el script que el timestamp del cliente no tiene más de N minutos de diferencia con el del servidor (previene replay de formularios).
- [ ] **Devolver JSON real** en todos los casos (`ContentService.createTextOutput(JSON.stringify({...})).setMimeType(ContentService.MimeType.JSON)`) para que el frontend pueda parsear la respuesta correctamente.
- [ ] **Proteger la hoja de cálculo** contra edición no autorizada: acceso de escritura solo para la cuenta de servicio del script; acceso de lectura restringido al equipo de Omnex.
- [ ] Revisar la configuración de CORS del script (el endpoint de Apps Script acepta peticiones desde cualquier origen por diseño; compensar con las validaciones anteriores).

---

## 4. RGPD y privacidad

- [ ] **Indicar la finalidad del formulario de contacto** en la política de privacidad: los datos se usan para responder a la consulta y no se ceden a terceros salvo Google (Google Sheets como herramienta de gestión interna).
- [ ] **Mencionar las herramientas externas** utilizadas en la política de privacidad y en la política de cookies:
  - Google Fonts (puede registrar IPs de visitantes).
  - Google Apps Script / Google Sheets (almacena datos del formulario).
  - n8n en servidor propio / EasyPanel (procesa mensajes del chatbot).
- [ ] **Revisar la conservación de datos:** definir cuánto tiempo se guardan los registros del formulario en Google Sheets y cuándo se eliminan. Documentar el criterio.
- [ ] **Evitar enviar datos personales sensibles al chatbot:** el chatbot no debe solicitar ni procesar DNI, datos bancarios, datos de salud ni datos especialmente protegidos. Si el workflow de n8n los recibiese, deben eliminarse de los logs.
- [ ] Confirmar que el banner de cookies cubre correctamente Google Fonts (si se carga desde fonts.googleapis.com, puede implicar transferencia de datos a EE.UU.).
- [ ] Confirmar que el checkbox de consentimiento del formulario es explícito, no pre-marcado, y que enlaza a la política de privacidad real.
- [ ] Revisar con asesor legal si la actividad concreta de Omnex requiere nombrar un DPO o registrar tratamientos ante la AEPD.
