# Seguridad — Web Omnex

Documento de referencia para el equipo técnico y cualquier persona que despliegue o mantenga esta web estática.

---

## 1. Arquitectura de servicios externos

Esta web es **puramente estática** (HTML + CSS + JS). No hay backend propio. Los únicos puntos de integración con servicios externos son:

| Servicio | Propósito | Exposición |
|---|---|---|
| n8n (webhook) | Chatbot OmniChat — procesa mensajes | URL pública en JS del frontend |
| Google Apps Script | Formulario de contacto — escribe en Sheets | URL pública en JS del frontend |
| Google Fonts | Tipografía | Recurso externo de solo lectura |
| WhatsApp (wa.me) | Enlace de contacto directo | Enlace externo pasivo |

---

## 2. Riesgos principales y su estado actual

### 2.1 Webhook n8n público

**Riesgo:** La URL del webhook de n8n (`/webhook/fb7d9697-...`) es visible en el código fuente del navegador. Cualquier persona puede enviar peticiones directamente a ese endpoint, sin pasar por el formulario de la web.

**Implicaciones:**
- Posible abuso para enviar mensajes masivos o payloads maliciosos al workflow de n8n.
- Posible consumo de créditos de LLM si n8n llama a un modelo de IA por cada petición recibida.
- El endpoint no puede autenticarse de forma segura desde el frontend (ver sección 2.3).

**Mitigación recomendada:** Implementar validación de esquema, límite de longitud y rate limiting **dentro del workflow de n8n**. Opcionalmente, añadir un proxy PHP en `/api/chat.php` en Hostinger que actúe de intermediario y oculte la URL real del webhook.

---

### 2.2 Google Apps Script público

**Riesgo:** La URL del script (`/macros/s/AKfycbx.../exec`) también es visible en el código fuente. Cualquier persona puede enviar POST directamente a esa URL para escribir filas arbitrarias en la hoja de cálculo.

**Implicaciones:**
- Posible spam o datos falsos en la hoja de contacto.
- Sin validación en el script, los datos no tienen ningún saneamiento.

**Mitigación recomendada:** Implementar validación de campos, límites de longitud y honeypot/timestamp dentro del propio Google Apps Script. La URL pública es inherente al modelo de Apps Script y no puede ocultarse.

---

### 2.3 Token visible en el frontend

El archivo `omni-chat.js` incluye el valor:

```
token: 'omx-9Kp3nRw7mQ2xB'
```

Este token se envía como cabecera `x-chat-token` en cada petición al webhook de n8n.

**Aclaración importante:** Este token **no es un secreto de seguridad real**. Al estar en el código fuente del navegador, cualquier persona puede leerlo e incluirlo en peticiones manuales. Su función actual es la de un identificador de origen, no un mecanismo de autenticación.

**Lo que esto significa en la práctica:**
- n8n puede usar ese header para saber que la petición viene de la web de Omnex.
- n8n **no debe usarlo como garantía de autenticidad** ni como control de acceso.
- Las validaciones reales (rate limiting, esquema, longitud) deben aplicarse en n8n independientemente del valor del token.

**Si en el futuro se quiere una protección real**, la única opción es añadir un proxy backend (PHP en Hostinger, por ejemplo) que guarde el secreto real en el servidor y no lo exponga al navegador.

---

### 2.4 Necesidad de validación externa

Esta web no valida entradas en el servidor. Toda la validación visible (campos requeridos, longitud, formato) ocurre en el navegador y puede saltarse fácilmente.

**Las validaciones críticas deben implementarse en:**
- El workflow de n8n (para el chatbot).
- El Google Apps Script (para el formulario de contacto).

---

### 2.5 Necesidad de cabeceras de seguridad HTTP

Una web estática sin cabeceras de seguridad configuradas en el servidor/CDN es vulnerable a ataques como clickjacking, MIME sniffing o inyección de recursos.

Las cabeceras recomendadas se detallan en `headers.example.txt`. Deben configurarse en el panel de Hostinger, en un `.htaccess` (Apache) o en la configuración del CDN.

---

## 3. Gestión de secretos

**Regla general:** Ningún secreto real debe vivir en el código fuente del frontend.

- **URLs de webhook y Apps Script:** Son técnicamente públicas por la naturaleza del servicio. La protección real debe estar en el destino (n8n, Apps Script), no en la URL.
- **Claves de API, tokens de autenticación real, credenciales de base de datos:** Si en el futuro se añaden, deben residir exclusivamente en el servidor (variables de entorno, ficheros de configuración fuera del webroot) y nunca en archivos JS, HTML o CSS accesibles desde el navegador.
- **El token `omx-9Kp3nRw7mQ2xB` actual:** No es una credencial de acceso a ningún sistema real. Puede rotarse si se sospecha abuso, actualizando su valor en `omni-chat.js` y en la comprobación equivalente del workflow de n8n.

---

## 4. Canales de reporte

Para reportar una vulnerabilidad o incidencia de seguridad relacionada con esta web, contactar directamente con el equipo técnico de Omnex en: **ceo_paco@omnex.es**
