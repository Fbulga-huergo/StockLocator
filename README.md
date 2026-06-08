# Depósito · Inventario en estanterías

Webapp local (single-page, sin backend) para gestionar inventario en estanterías
físicas de un depósito. Plano 2D editable, vista 3D de cada estantería con
React Three Fiber, búsqueda global e importación/exportación CSV/JSON.

## Requisitos

- Node.js 18 o superior

## Cómo correrla

```bash
npm install
npm run dev
```

Abrí la URL que muestra la terminal (por defecto http://localhost:5173).

Para generar una versión de producción:

```bash
npm run build
npm run preview
```

## Modos

- **Editor (amber):** crea, mueve, renombra y elimina estanterías, estantes y
  productos. Arrastra estanterías en el plano 2D y **cubos en la vista 3D** para
  reubicarlos. Importa/exporta datos.
- **Invitado (azul):** navegación y consulta de solo lectura. Sin controles de
  edición. Puede buscar productos y abrir la vista 3D.

El modo es solo para la sesión actual y no se persiste.

## Vista 2D: Plano y Lista

- **Plano:** cada estantería es una tarjeta que muestra su contenido por estante.
  El **estante 1 es el de más arriba** y se numera hacia abajo.
- **Lista:** tabla con todos los productos (código, nombre, estantería, estante y
  posición). Clic en una fila abre la vista 3D con el producto resaltado.

Se cambia entre ambas con el selector **Plano / Lista** de la barra superior.

## Posicionamiento de productos (vista 3D)

En modo Editor podés **arrastrar cada cubo** dentro de la estantería. La posición
se define en tres direcciones, con encastre automático a una grilla de casilleros:

- **Ancho (columna):** de izquierda a derecha sobre el estante.
- **Fondo (profundidad):** un cubo adelante de otro.
- **Alto (apilado):** un cubo arriba de otro.

También se puede arrastrar un cubo a otro estante. Si el casillero destino está
ocupado, los dos productos intercambian su lugar.

## Controles de la vista 3D

- Clic izquierdo + arrastrar (sobre vacío): rotar la cámara
- Rueda del mouse: zoom
- Clic derecho + arrastrar: desplazar (pan)
- Arrastrar un cubo (Editor): reubicar el producto
- Hover sobre un cubo: muestra nombre y código del producto

## Persistencia

Todos los datos (estanterías, estantes, productos y posiciones del plano) se
guardan automáticamente en el `localStorage` del navegador. Para mover los datos
a otra máquina o hacer copia de seguridad, usá **Datos → Exportar JSON** y luego
**Importar JSON** en el otro equipo.

## Formato CSV

Columnas: `Codigo, Nombre, Estanteria, Estante`. La importación reconstruye las
estanterías y estantes a partir de esas columnas. Los códigos deben ser únicos.

## Stack

- React 18 + hooks (Context para el estado global)
- React Three Fiber + @react-three/drei (vista 3D, OrbitControls, tooltips Html)
- Tailwind CSS
- Vite
- Persistencia exclusivamente en `localStorage`
