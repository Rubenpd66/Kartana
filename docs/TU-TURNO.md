# TU TURNO — lo que necesito de ti

Ordenado por urgencia. Marca `[x]` lo que hagas y dímelo en el chat. **Nunca pegues claves en el chat:** van al archivo `.env.local` (te lo dejo preparado en la Fase 1, con los huecos vacíos) o a Vercel → Settings → Environment Variables.

## Urgente (bloquea algo)

- [ ] **1. Instalar GitHub CLI e iniciar sesión** — **Por qué:** sin ella no puedo crear el repositorio privado `kartana` ni subir el código. **Pasos:**
  1. Pulsa la tecla Windows, escribe `PowerShell` y ábrelo.
  2. Copia esto, pégalo y pulsa Enter: `winget install --id GitHub.cli`
  3. Cuando acabe, **cierra PowerShell y VS Code** y vuelve a abrirlos (para que se entere de que está instalado).
  4. En PowerShell escribe `gh auth login` y pulsa Enter. Responde: **GitHub.com** → **HTTPS** → **Yes** → **Login with a web browser**.
  5. Copia el código de 8 letras que te enseña, pulsa Enter, pégalo en la web que se abre y autoriza.
  
  **Devuélveme:** «gh listo».

- [ ] **2. Darme el OK para comprar el dominio kartana.app** (9,99 $ el primer año, 15 $/año después) — **Por qué:** hace falta para los correos de acceso y para que la dirección de los QR impresos no cambie nunca. **Pasos (si lo compras tú):**
  1. Entra en [vercel.com](https://vercel.com) con tu cuenta.
  2. Arriba, pestaña **Domains** → **Buy** (o «Add» → «Buy a domain»).
  3. Escribe `kartana.app`, comprueba que pone 9,99 $ y compra. Te pedirá tarjeta y datos de contacto.
  
  **Devuélveme:** «dominio comprado». (Si prefieres que lo compre yo desde aquí, dime «cómpralo tú» y lo hago con tu tarjeta de Vercel.)
  > Nota: los `.app` solo funcionan con candado (HTTPS). Vercel lo pone solo.

## Pronto (tarda días en estar listo)

- [ ] **3. Google Cloud: proyecto, facturación y dos APIs** — **Por qué:** traducción de cartas (v0.2) y buscador de fichas de Google (v0.3). Google pide tarjeta aunque a nuestro volumen sea gratis. **Pasos:**
  1. Entra en [console.cloud.google.com](https://console.cloud.google.com) con tu cuenta de Google.
  2. Arriba a la izquierda, el selector de proyectos → **Proyecto nuevo** → nombre `kartana` → **Crear**.
  3. Menú ☰ → **Facturación** → **Vincular una cuenta de facturación** → crea una con tu tarjeta.
  4. Menú ☰ → **Facturación** → **Presupuestos y alertas** → **Crear presupuesto** → 5 € al mes, con aviso al 50 % y al 100 %. (Así te enteras si algo se dispara.)
  5. Menú ☰ → **APIs y servicios** → **Biblioteca** → busca **Places API (New)** → **Habilitar**. Vuelve atrás, busca **Cloud Translation API** → **Habilitar**.
  
  **Devuélveme:** «Google Cloud listo». Las claves te las pido más adelante, con instrucciones.

- [ ] **4. Cuenta de Resend (correos de acceso)** — **Por qué:** el dueño entra con un código que le llega por correo; el correo gratis de Supabase solo deja enviar unos pocos a la hora. **Requiere:** el dominio comprado (paso 2). **Pasos:**
  1. Entra en [resend.com](https://resend.com) → **Sign up** (puedes usar tu cuenta de GitHub).
  2. **Domains** → **Add Domain** → escribe `kartana.app` → región **Ireland (eu-west-1)** → **Add**.
  3. Te enseña varios «DNS records». Déjalos abiertos y dímelo: si el dominio está en Vercel, los añado yo desde aquí.
  
  **Devuélveme:** «Resend creado».

- [ ] **5. Buscar 3–5 bares para el piloto** — **Por qué:** cuanto antes los tengas, antes probamos con cartas reales. **Pasos:** habla con bares de confianza; ofrece 2 meses gratis a cambio de su opinión. Si alguno te deja usar su carta (texto y precios) como carta de ejemplo en la web, mejor todavía: pídele permiso por escrito (un WhatsApp vale).
  
  **Devuélveme:** cuántos tienes y, si puedes, una foto o PDF de una carta real.

- [ ] **6. Pedir acceso a la API de perfiles de empresa de Google (para la v0.5)** — **Por qué:** sin ella no podemos mostrar reseñas ni responderlas desde el panel. Es gratis pero Google tarda y puede decir que no. **Ojo:** según varias guías, Google suele pedir una **ficha de empresa verificada con más de 60 días** y una **web propia**. Es mejor esperar a tener kartana.app publicada (v0.1). **Pasos (cuando te avise):**
  1. Con el proyecto `kartana` de Google Cloud seleccionado, abre el formulario de acceso de la API de Business Profile (te paso el enlace exacto entonces).
  2. Elige **Application for Basic API Access** y rellénalo con el correo que gestione la ficha.
  
  **Devuélveme:** «solicitud enviada» y, más tarde, la respuesta de Google.

## Antes de lanzar o cobrar (punto de control 4)
- [ ] **Alta de autónomo con un gestor.** Pregúntale: epígrafe del IAE para un software por suscripción, IVA (21 % a empresas españolas), y si las facturas de Stripe valen con **Verifactu** (obligatorio para autónomos desde el 1/7/2027) o hace falta otro programa.
- [ ] **Revisión de los textos legales** (aviso legal, privacidad, condiciones del servicio) por un profesional.
- [ ] **Pasar a planes de pago:** Vercel Pro (~20 $/mes) y Supabase Pro (~25 $/mes). El plan gratis de Vercel no permite cobrar.
- [ ] **Activar la cuenta real de Stripe** (tu entorno «Kartana») con tus datos fiscales y cuenta bancaria.
- [ ] Darme el OK para encender los cobros.

## Opcional
- [ ] Search Console: añadir kartana.app (te doy los pasos cuando esté publicada).
- [ ] Strix (prueba de seguridad con IA): necesita Docker Desktop y una clave de API. Solo si quieres en la Fase 5.
