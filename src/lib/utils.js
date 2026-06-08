// Generación de IDs y utilidades varias

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`
}

// Paleta de colores para los cubos de producto (alto contraste sobre fondo oscuro)
export const PRODUCT_COLORS = [
  '#f59e0b', // amber
  '#60a5fa', // azul
  '#34d399', // esmeralda
  '#f472b6', // rosa
  '#a78bfa', // violeta
  '#fb7185', // coral
  '#22d3ee', // cian
  '#facc15', // amarillo
  '#4ade80', // verde
  '#fca5a5', // salmón
  '#c084fc', // lila
  '#2dd4bf', // turquesa
]

export function randomColor() {
  return PRODUCT_COLORS[Math.floor(Math.random() * PRODUCT_COLORS.length)]
}

// Datos de ejemplo para el primer arranque
export function seedData() {
  return {
    shelves: [
      {
        id: uid('shelf'),
        name: 'Estantería A',
        x: 90,
        y: 90,
        levels: [
          {
            id: uid('lvl'),
            label: 'Estante 1',
            products: [
              { id: uid('p'), name: 'Tornillos M6', code: 'TOR-001', color: '#f59e0b', col: 0, depth: 0, tier: 0 },
              { id: uid('p'), name: 'Tuercas M6', code: 'TUE-002', color: '#60a5fa', col: 0, depth: 0, tier: 1 },
              { id: uid('p'), name: 'Arandelas', code: 'ARA-003', color: '#34d399', col: 1, depth: 0, tier: 0 },
            ],
          },
          {
            id: uid('lvl'),
            label: 'Estante 2',
            products: [
              { id: uid('p'), name: 'Llave 10mm', code: 'LLA-004', color: '#f472b6', col: 0, depth: 0, tier: 0 },
              { id: uid('p'), name: 'Llave 12mm', code: 'LLA-005', color: '#a78bfa', col: 0, depth: 1, tier: 0 },
            ],
          },
          { id: uid('lvl'), label: 'Estante 3', products: [] },
        ],
      },
      {
        id: uid('shelf'),
        name: 'Estantería B',
        x: 380,
        y: 90,
        levels: [
          {
            id: uid('lvl'),
            label: 'Estante 1',
            products: [
              { id: uid('p'), name: 'Cinta aisladora', code: 'CIN-010', color: '#f472b6', col: 0, depth: 0, tier: 0 },
              { id: uid('p'), name: 'Bridas 200mm', code: 'BRI-011', color: '#a78bfa', col: 1, depth: 0, tier: 0 },
              { id: uid('p'), name: 'Guantes nitrilo', code: 'GUA-012', color: '#22d3ee', col: 2, depth: 0, tier: 0 },
            ],
          },
          {
            id: uid('lvl'),
            label: 'Estante 2',
            products: [
              { id: uid('p'), name: 'Lijas grano 120', code: 'LIJ-013', color: '#facc15', col: 0, depth: 0, tier: 0 },
            ],
          },
        ],
      },
      {
        id: uid('shelf'),
        name: 'Estantería C',
        x: 90,
        y: 320,
        levels: [
          {
            id: uid('lvl'),
            label: 'Estante 1',
            products: [
              { id: uid('p'), name: 'Cables 2.5mm', code: 'CAB-020', color: '#fb7185', col: 0, depth: 0, tier: 0 },
            ],
          },
          { id: uid('lvl'), label: 'Estante 2', products: [] },
        ],
      },
    ],
  }
}
