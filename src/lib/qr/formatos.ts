export const FORMATOS_QR = ["mesa", "pegatinas", "poster"] as const;
export type FormatoQr = (typeof FORMATOS_QR)[number];
