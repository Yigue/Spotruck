export type Audience = 'DRIVER' | 'COMPANY'

export interface Step {
  title: string
  text: string
  tips?: string[]
}

// Guía de usuario del informe original (Camionero / Empresa), actualizada a la app nueva
export const guideSteps: Record<Audience, Step[]> = {
  DRIVER: [
    {
      title: 'Registrate como transportista',
      text: 'Creá tu cuenta con email y contraseña, y completá tu licencia y teléfono en el perfil.',
      tips: ['Subí tu documentación para obtener la insignia «Verificado»: las empresas confían más.'],
    },
    {
      title: 'Registrá tu camión',
      text: 'En «Mi perfil» agregá la patente, el tipo y la capacidad de cada camión de tu flota. Podés adjuntar VTV, Senasa y póliza.',
    },
    {
      title: 'Encontrá viajes',
      text: 'En «Explorar» ves las publicaciones en un mapa o en lista. Buscá por origen o destino: ideal para conseguir el viaje de vuelta. «Cerca de mí» muestra lo que sale a tu alrededor.',
      tips: ['Cambiá entre Mapa y Satélite con el selector de capas.'],
    },
    {
      title: 'Postulate con tu oferta',
      text: 'Elegí el camión, indicá tu precio y dejá una aclaración. En subastas abiertas tu oferta debe bajar al menos 10 % la mejor actual; en las holandesas pulsás «Tomar»; en las selladas tu monto es privado.',
    },
    {
      title: 'Esperá la confirmación',
      text: 'Seguí tus ofertas en «Mis ofertas»: podés modificarlas o retirarlas mientras estén pendientes. Te avisamos al instante si te aceptan.',
    },
    {
      title: 'Realizá el viaje e informá cada estado',
      text: 'Marcá «Comencé el viaje» y, al llegar, «Terminé el viaje». Compartí tu ubicación para que la empresa te siga en vivo.',
    },
    {
      title: 'Calificá a la empresa',
      text: 'Cuando la empresa confirma la entrega, dejá tus estrellas y un comentario sobre la experiencia.',
    },
  ],
  COMPANY: [
    {
      title: 'Registrate como empresa',
      text: 'Completá razón social y CUIT (lo validamos), y tu dirección y teléfono de contacto.',
    },
    {
      title: 'Publicá tu viaje',
      text: 'Indicá origen y destino sobre el mapa, fecha, tipo y peso de la carga y el precio tope. Calculamos distancia y duración. Elegí el tipo de subasta: abierta, holandesa o sellada.',
      tips: ['Podés guardarlo como borrador y publicarlo después.'],
    },
    {
      title: 'Esperá las postulaciones',
      text: 'Los transportistas ofertan en tiempo real. Si nadie se postuló todavía lo verás en la publicación, y te avisamos con una notificación cuando llegue la primera.',
    },
    {
      title: 'Compará y elegí',
      text: 'Mirá la tabla de postulantes: precio, camión, calificación. Abrí cada perfil para ver sus viajes realizados y las opiniones de otras empresas. Aceptá o rechazá con confirmación.',
    },
    {
      title: 'Seguí el viaje',
      text: 'Vas a ver los estados: preparándose → en viaje → esperando confirmación → finalizado, con el recorrido GPS en vivo.',
    },
    {
      title: 'Confirmá la entrega y pagá',
      text: 'Al confirmar que llegó la carga se libera el pago retenido al transportista.',
    },
    {
      title: 'Calificá al transportista',
      text: 'Tu opinión queda en su perfil y ayuda a otras empresas a elegir bien.',
    },
  ],
}
