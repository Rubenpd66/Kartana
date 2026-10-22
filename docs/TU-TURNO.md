# TU TURNO — lo que necesito de ti

Ordenado por urgencia. Marca `[x]` lo que hagas y dímelo en el chat. **Nunca pegues claves en el chat:** van al archivo `.env.local` (te lo dejo preparado en la Fase 1, con los huecos vacíos) o a Vercel → Settings → Environment Variables.

## Urgente (bloquea algo)

- [x] ~~Autorizar GitHub CLI~~ (hecho el 22/10).
- [x] ~~Dar acceso a Vercel al repositorio `kartana`~~ (hecho el 22/10; web en https://kartana-six.vercel.app).

- [x] ~~Revisar las maquetas (punto de control 2)~~ — diseño aprobado el 22/10.

- [ ] **B. Plantillas de correo con el código de 6 cifras** — **Por qué:** sin esto, el correo de acceso llega con un enlace en vez de con el código. **Pasos:**
  1. En [Supabase](https://supabase.com/dashboard) → proyecto **kartana** → **Authentication** → en el submenú, **Emails** (o **Email Templates**).
  2. Pestaña **Magic Link**:
     - **Subject:** `Tu código para entrar en Kartana`
     - **Body** (en la vista de código; borra lo que haya y pega esto):
       ```
       <h2>Tu código para entrar en Kartana</h2>
       <p>Escribe este código en la pantalla de Kartana:</p>
       <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
       <p>Caduca en 1 hora. Si no has pedido entrar, ignora este correo.</p>
       ```
     - Pulsa **Save changes**.
  3. Pestaña **Confirm signup** (es la que reciben los dueños la primera vez):
     - **Subject:** `Tu código para crear tu cuenta en Kartana`
     - **Body:** el mismo de arriba → **Save changes**.
  
  **Devuélveme:** «plantillas cambiadas».

## Pronto (tarda días en estar listo)

- [x] ~~Contraseña de aplicación de Gmail~~ — hecho el 22/10: SMTP de Gmail configurado en Supabase (smtp.gmail.com:465). Se probará con el primer código de acceso.

- [x] ~~«Entrar con Google»~~ — hecho el 22/10: cliente OAuth «Kartana web» en Google Cloud, proveedor Google activo en Supabase y URLs de retorno configuradas (comprobado: redirige a Google con el cliente correcto).

- [x] ~~Google Cloud: facturación y dos APIs~~ — hecho el 22/10: cuenta de facturación vinculada, presupuesto «Kartana» de 5 € con alertas al 50 % y 100 % (el límite de gasto real no admite estas APIs), Places API (New) y Cloud Translation API habilitadas. Cuotas diarias: no editables («Ilimitado»); el límite se pone en el código.

- [ ] **4. Buscar 3–5 bares para el piloto** — **Por qué:** cuanto antes los tengas, antes probamos con cartas reales. **Pasos:** habla con bares de confianza; ofrece 2 meses gratis a cambio de su opinión. Si alguno te deja usar su carta (texto y precios) como carta de ejemplo en la web, mejor todavía: pídele permiso por escrito (un WhatsApp vale).
  
  **Devuélveme:** cuántos tienes y, si puedes, una foto o PDF de una carta real.
  > Recibidos el 22/10 los platos, los precios y fotos de **Cafetería La Guagua** (`docs/datos/carta-la-guagua.md`). La demo se llamará «Cafetería La Guagua», marcada como carta de ejemplo. Pendiente: saber si las fotos de platos son del bar (solo se publican con su permiso).

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
