# TU TURNO — lo que necesito de ti

Ordenado por urgencia. Marca `[x]` lo que hagas y dímelo en el chat. **Nunca pegues claves en el chat:** van al archivo `.env.local` (te lo dejo preparado en la Fase 1, con los huecos vacíos) o a Vercel → Settings → Environment Variables.

## Urgente (bloquea algo)

- [x] ~~Autorizar GitHub CLI~~ (hecho el 22/10).
- [x] ~~Dar acceso a Vercel al repositorio `kartana`~~ (hecho el 22/10; web en https://kartana-six.vercel.app).

Nada urgente ahora mismo.

## Pronto (tarda días en estar listo)

- [x] ~~Contraseña de aplicación de Gmail~~ — hecho el 22/10: SMTP de Gmail configurado en Supabase (smtp.gmail.com:465). Se probará con el primer código de acceso.

- [ ] **3. «Entrar con Google»** (proyecto `kartana` de Google Cloud ya creado el 22/10) — **Por qué:** es una de las dos formas de entrar al panel (v0.1). No necesita tarjeta. **Pasos:**
  1. En [console.cloud.google.com](https://console.cloud.google.com), comprueba arriba a la izquierda que está seleccionado el proyecto **kartana**.
  2. Menú ☰ → **APIs y servicios** → **Pantalla de consentimiento de OAuth** (puede llamarse **Google Auth Platform**) → **Comenzar**.
  3. Rellena: nombre de la app `Kartana`, correo de asistencia: tu Gmail → **Siguiente**. Público: **Externo** → **Siguiente**. Correo de contacto: tu Gmail → **Siguiente**. Acepta la política → **Crear**.
  4. En el menú de la izquierda, **Clientes** → **Crear cliente** → tipo **Aplicación web** → nombre `Kartana web`.
     - En **Orígenes de JavaScript autorizados** añade dos: `https://kartana-six.vercel.app` y `http://localhost:3000`.
     - En **URI de redireccionamiento autorizados** añade: `https://iewlsyvdkxzcncrbhpyx.supabase.co/auth/v1/callback`
     - Pulsa **Crear**. Te enseña un **ID de cliente** y un **Secreto del cliente**. No cierres la ventana y **no me los pegues aquí**.
  5. En otra pestaña, en [Supabase](https://supabase.com/dashboard) → proyecto **kartana** → **Authentication** → **Sign In / Providers** (o **Providers**) → **Google** → actívalo, pega el **ID de cliente** y el **Secreto** → **Save**.
  6. En Supabase, **Authentication** → **URL Configuration**:
     - **Site URL:** `https://kartana-six.vercel.app`
     - **Redirect URLs** (botón **Add URL**, una a una): `https://kartana-six.vercel.app/**`, `http://localhost:3000/**` y `http://localhost:3100/**` → **Save**.
  7. Vuelve a Google: menú de la izquierda **Desarrollo de la marca** (Branding). Página principal: `https://kartana-six.vercel.app`; política de privacidad: `https://kartana-six.vercel.app/legal/privacidad`; condiciones: `https://kartana-six.vercel.app/legal/condiciones` → **Guardar**.
  8. Menú de la izquierda **Público** (Audience) → **Publicar aplicación** → **Confirmar**. Así puede entrar cualquier dueño, no solo tú. Como solo pedimos nombre y correo, Google no exige revisión.
  
  **Devuélveme:** «Google login configurado».

- [ ] **3b. Google Cloud: facturación y dos APIs** (para la v0.2 y la v0.3; puede esperar unos días) — **Por qué:** traducción de cartas y buscador de fichas de Google. Google pide tarjeta aunque a nuestro volumen sea gratis. **Pasos:**
  1. Menú ☰ → **Facturación** → **Vincular una cuenta de facturación** → crea una con tu tarjeta.
  2. Menú ☰ → **Facturación** → **Presupuestos y alertas** → **Crear presupuesto** → 5 € al mes, con aviso al 50 % y al 100 %. (Así te enteras si algo se dispara.)
  3. Menú ☰ → **APIs y servicios** → **Biblioteca** → busca **Places API (New)** → **Habilitar**. Vuelve atrás, busca **Cloud Translation API** → **Habilitar**.
  
  **Devuélveme:** «facturación y APIs listas». Las claves te las pido más adelante, con instrucciones.

- [ ] **4. Buscar 3–5 bares para el piloto** — **Por qué:** cuanto antes los tengas, antes probamos con cartas reales. **Pasos:** habla con bares de confianza; ofrece 2 meses gratis a cambio de su opinión. Si alguno te deja usar su carta (texto y precios) como carta de ejemplo en la web, mejor todavía: pídele permiso por escrito (un WhatsApp vale).
  
  **Devuélveme:** cuántos tienes y, si puedes, una foto o PDF de una carta real.
  > Recibida el 22/10 la lista de platos de **Cafetería La Guagua** (guardada en `docs/datos/carta-la-guagua.md`). Falta saber si el bar da permiso para usar su nombre en la carta de demostración; mientras tanto se llamará «Bar de ejemplo».

- [ ] **5. Pedir acceso a la API de perfiles de empresa de Google (para la v0.5)** — **Por qué:** sin ella no podemos mostrar reseñas ni responderlas desde el panel. Es gratis pero Google tarda y puede decir que no. **Ojo:** según varias guías, Google suele pedir una **ficha de empresa verificada con más de 60 días** y una **web propia**. Mejor esperar a tener la web publicada. **Pasos (cuando te avise):**
  1. Con el proyecto `kartana` de Google Cloud seleccionado, abre el formulario de acceso de la API de Business Profile (te paso el enlace exacto entonces).
  2. Elige **Application for Basic API Access** y rellénalo con el correo que gestione la ficha.
  
  **Devuélveme:** «solicitud enviada» y, más tarde, la respuesta de Google.

## Antes de vender en serio (v0.4)
- [ ] **Comprar el dominio kartana.app** (9,99 $ el primer año, 15 $/año después) en Vercel → **Domains** → **Buy**, o decirme «cómpralo tú». Hasta entonces usamos la dirección gratis de Vercel, que después redirigirá a kartana.app (los QR ya impresos seguirán funcionando).
- [ ] **Cuenta de Resend** para enviar los correos desde `@kartana.app` en lugar de tu Gmail (te doy los pasos cuando tengas el dominio).

## Antes de cobrar (punto de control 4, al final)
- [ ] **Alta de autónomo con un gestor.** Pregúntale: epígrafe del IAE para un software por suscripción, IVA (21 % a empresas españolas), y si las facturas de Stripe valen con **Verifactu** (obligatorio para autónomos desde el 1/7/2027) o hace falta otro programa.
- [ ] **Revisión de los textos legales** (aviso legal, privacidad, condiciones del servicio) por un profesional.
- [ ] **Pasar a planes de pago:** Vercel Pro (~20 $/mes) y Supabase Pro (~25 $/mes). El plan gratis de Vercel no permite cobrar ni anunciar precios.
- [ ] **Activar la cuenta real de Stripe** (tu entorno «Kartana») con tus datos fiscales y cuenta bancaria.
- [ ] Darme el OK para encender los cobros.

## Opcional
- [ ] Search Console: añadir la web (te doy los pasos cuando esté publicada).
- [ ] Strix (prueba de seguridad con IA): necesita Docker Desktop y una clave de API. Solo si quieres en la Fase 5.
