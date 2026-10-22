# TU TURNO — lo que necesito de ti

Ordenado por urgencia. Marca `[x]` lo que hagas y dímelo en el chat. **Nunca pegues claves en el chat:** van al archivo `.env.local` (te lo dejo preparado en la Fase 1, con los huecos vacíos) o a Vercel → Settings → Environment Variables.

## Urgente (bloquea algo)

- [x] ~~Autorizar GitHub CLI~~ (hecho el 22/10).
- [ ] **1. Dar acceso a Vercel al repositorio `kartana`** — **Por qué:** sin esto Vercel no puede publicar la web. Ahora solo ve el repositorio `forja`. **Pasos:**
  1. Abre [github.com/settings/installations](https://github.com/settings/installations).
  2. En la fila **Vercel**, pulsa **Configure**.
  3. Baja hasta **Repository access**. Deja marcado **Only select repositories**, pulsa **Select repositories** y elige **kartana** (sin quitar `forja`).
  4. Pulsa **Save**. Si te pide la contraseña de GitHub, ponla.
  
  **Devuélveme:** «Vercel ya ve kartana».

## Pronto (tarda días en estar listo)

- [x] ~~Contraseña de aplicación de Gmail~~ — hecho el 22/10: SMTP de Gmail configurado en Supabase (smtp.gmail.com:465). Se probará con el primer código de acceso.

- [ ] **3. Google Cloud: proyecto, facturación y dos APIs** — **Por qué:** «Entrar con Google», traducción de cartas (v0.2) y buscador de fichas de Google (v0.3). Google pide tarjeta aunque a nuestro volumen sea gratis. **Pasos:**
  1. Entra en [console.cloud.google.com](https://console.cloud.google.com) con tu cuenta de Google.
  2. Arriba a la izquierda, el selector de proyectos → **Proyecto nuevo** → nombre `kartana` → **Crear**.
  3. Menú ☰ → **Facturación** → **Vincular una cuenta de facturación** → crea una con tu tarjeta.
  4. Menú ☰ → **Facturación** → **Presupuestos y alertas** → **Crear presupuesto** → 5 € al mes, con aviso al 50 % y al 100 %. (Así te enteras si algo se dispara.)
  5. Menú ☰ → **APIs y servicios** → **Biblioteca** → busca **Places API (New)** → **Habilitar**. Vuelve atrás, busca **Cloud Translation API** → **Habilitar**.
  
  **Devuélveme:** «Google Cloud listo». Las claves te las pido más adelante, con instrucciones.

- [ ] **4. Buscar 3–5 bares para el piloto** — **Por qué:** cuanto antes los tengas, antes probamos con cartas reales. **Pasos:** habla con bares de confianza; ofrece 2 meses gratis a cambio de su opinión. Si alguno te deja usar su carta (texto y precios) como carta de ejemplo en la web, mejor todavía: pídele permiso por escrito (un WhatsApp vale).
  
  **Devuélveme:** cuántos tienes y, si puedes, una foto o PDF de una carta real.

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
