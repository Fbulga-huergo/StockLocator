import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { GRID, dropSlot } from '../lib/grid'

// ---- Parámetros geométricos ----
const SHELF_WIDTH = 4.8
const SHELF_DEPTH = 2.1
const LEVEL_GAP = 1.55
const TIER_STEP = 0.62
const CUBE = 0.5
const BOARD_T = 0.08
const POST = 0.09

const usableW = SHELF_WIDTH - 0.8
const usableD = SHELF_DEPTH - 0.45
const colStep = usableW / GRID.cols
const depthStep = usableD / GRID.depths

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function colX(col) {
  return -usableW / 2 + colStep * (col + 0.5)
}
function depthZ(depth) {
  // depth 0 = adelante (hacia la cámara, +Z)
  return usableD / 2 - depthStep * (depth + 0.5)
}

// ===================== Cubo de producto =====================
function ProductCube({ product, basePos, highlighted, isDragged, dragLocalRef, onHover, onLeave, onPointerDownCube, onClickCube }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)
  const color = useMemo(() => new THREE.Color(product.color), [product.color])
  const target = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    if (isDragged && dragLocalRef.current) {
      target.copy(dragLocalRef.current)
      target.y += 0.22 // se "levanta" al arrastrar
    } else {
      target.set(basePos[0], basePos[1] + (highlighted ? Math.sin(t * 2.5) * 0.05 + 0.05 : 0), basePos[2])
    }
    ref.current.position.lerp(target, isDragged ? 0.4 : 0.18)
    const s = hovered || highlighted || isDragged ? 1.14 : 1
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.18)
  })

  return (
    <group>
      <RoundedBox
        ref={ref}
        args={[CUBE, CUBE, CUBE]}
        radius={0.06}
        smoothness={3}
        position={basePos}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          onHover?.(product)
          document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          setHovered(false)
          onLeave?.()
          document.body.style.cursor = 'auto'
        }}
        onPointerDown={(e) => onPointerDownCube?.(e, product)}
        onClick={(e) => {
          e.stopPropagation()
          onClickCube?.(product)
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={highlighted ? 0.55 : isDragged ? 0.4 : hovered ? 0.25 : 0.08}
          metalness={0.2}
          roughness={0.45}
        />
      </RoundedBox>

      {(hovered || highlighted) && !isDragged && (
        <Html position={[basePos[0], basePos[1] + 0.55, basePos[2]]} center distanceFactor={9} zIndexRange={[100, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-lg border border-white/15 bg-ink-950/95 px-3 py-1.5 text-center shadow-xl">
            <div className="text-xs font-semibold text-white">{product.name}</div>
            <div className="font-mono text-[11px]" style={{ color: product.color }}>
              {product.code}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ===================== Estructura de la estantería =====================
function Posts({ levels }) {
  const totalH = (levels - 1) * LEVEL_GAP + LEVEL_GAP
  const halfW = SHELF_WIDTH / 2
  const halfD = SHELF_DEPTH / 2
  const pts = [
    [-halfW, -halfD],
    [halfW, -halfD],
    [-halfW, halfD],
    [halfW, halfD],
  ]
  return (
    <group>
      {pts.map(([x, z], i) => (
        <mesh key={i} position={[x, totalH / 2 - LEVEL_GAP / 2, z]} castShadow>
          <boxGeometry args={[POST, totalH, POST]} />
          <meshStandardMaterial color="#4b5468" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Board({ y }) {
  return (
    <mesh position={[0, y, 0]} receiveShadow castShadow>
      <boxGeometry args={[SHELF_WIDTH + 0.2, BOARD_T, SHELF_DEPTH + 0.12]} />
      <meshStandardMaterial color="#2b3242" metalness={0.3} roughness={0.7} />
    </mesh>
  )
}

// ===================== Escena =====================
function Scene({ shelf, mode, highlightId, onCubeClick, onPlace, onDraggingChange }) {
  const { camera, gl, raycaster } = useThree()
  const isEditor = mode === 'editor'
  const L = shelf.levels.length
  const groupOffsetY = -((L - 1) * LEVEL_GAP) / 2

  // li=0 es el estante de ARRIBA
  const boardLocalY = (li) => (L - 1 - li) * LEVEL_GAP
  const cubeLocalY = (li, tier) => boardLocalY(li) + BOARD_T / 2 + CUBE / 2 + tier * TIER_STEP
  const slotPos = (li, col, depth, tier) => [colX(col), cubeLocalY(li, tier), depthZ(depth)]

  const [drag, setDrag] = useState(null) // { id }
  const dragLocal = useRef(new THREE.Vector3())
  const dragSnap = useRef(null) // { levelIndex, col, depth, tier }
  const moved = useRef(false)
  const downXY = useRef({ x: 0, y: 0 })
  const [snapView, setSnapView] = useState(null)

  // Buffers reutilizables
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const tmpDir = useMemo(() => new THREE.Vector3(), [])
  const vNormal = useMemo(() => new THREE.Vector3(), [])
  const vPlane = useMemo(() => new THREE.Plane(), [])
  const hPlane = useMemo(() => new THREE.Plane(), [])
  const hitA = useMemo(() => new THREE.Vector3(), [])
  const hitB = useMemo(() => new THREE.Vector3(), [])
  const UP = useMemo(() => new THREE.Vector3(0, 1, 0), [])

  // Snap vertical: elige el ESTANTE (no el tier; el tier lo decide el apilado).
  const snapLevel = (localY) => {
    let best = 0
    let bd = Infinity
    for (let li = 0; li < L; li++) {
      const d = Math.abs(boardLocalY(li) + 0.3 - localY)
      if (d < bd) {
        bd = d
        best = li
      }
    }
    return best
  }
  const snapCol = (x) => clamp(Math.round((x + usableW / 2) / colStep - 0.5), 0, GRID.cols - 1)
  const snapDepth = (z) => clamp(Math.round((usableD / 2 - z) / depthStep - 0.5), 0, GRID.depths - 1)

  useEffect(() => {
    onDraggingChange?.(!!drag)
  }, [drag, onDraggingChange])

  useEffect(() => {
    if (!drag) return
    const onMove = (e) => {
      const rect = gl.domElement.getBoundingClientRect()
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(ndc, camera)

      if (Math.abs(e.clientX - downXY.current.x) > 4 || Math.abs(e.clientY - downXY.current.y) > 4) {
        moved.current = true
      }

      // Plano vertical (mira a la cámara, horizontal) para leer la altura del puntero
      const worldPos = dragLocal.current.clone()
      worldPos.y += groupOffsetY
      camera.getWorldDirection(tmpDir)
      vNormal.set(tmpDir.x, 0, tmpDir.z).normalize()
      vPlane.setFromNormalAndCoplanarPoint(vNormal, worldPos)
      const hv = raycaster.ray.intersectPlane(vPlane, hitA)
      const localY = hv ? hv.y - groupOffsetY : dragLocal.current.y
      const li = snapLevel(localY)

      // Plano horizontal a la altura del puntero -> X/Z
      const planeWorldY = hv ? hv.y : cubeLocalY(li, 0) + groupOffsetY
      hPlane.set(UP, -planeWorldY)
      const hh = raycaster.ray.intersectPlane(hPlane, hitB)
      if (hh) {
        const col = snapCol(hh.x)
        const depth = snapDepth(hh.z)
        // El cubo "fantasma" sigue al puntero (sensación de arrastre)
        dragLocal.current.set(
          clamp(hh.x, -usableW / 2, usableW / 2),
          clamp(localY, -0.2, boardLocalY(0) + 1.4),
          clamp(hh.z, -usableD / 2, usableD / 2),
        )
        // ¿Dónde caería realmente? (apila encima; si está lleno, otra columna)
        const levelProducts = shelf.levels[li]?.products || []
        const target = dropSlot(levelProducts, col, depth, drag.id)
        if (target) {
          dragSnap.current = { levelIndex: li, ...target }
          setSnapView({ pos: slotPos(li, target.col, target.depth, target.tier), valid: true })
        } else {
          dragSnap.current = null
          setSnapView({ pos: slotPos(li, col, depth, 0), valid: false })
        }
      }
    }
    const onUp = () => {
      if (drag && dragSnap.current && moved.current) {
        const destLevel = shelf.levels[dragSnap.current.levelIndex]
        if (destLevel) {
          onPlace?.(drag.id, destLevel.id, {
            col: dragSnap.current.col,
            depth: dragSnap.current.depth,
            tier: dragSnap.current.tier,
          })
        }
      }
      setDrag(null)
      setSnapView(null)
      dragSnap.current = null
      document.body.style.cursor = 'auto'
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [drag]) // eslint-disable-line

  const startDrag = (e, product, li) => {
    if (!isEditor) return
    e.stopPropagation()
    moved.current = false
    downXY.current = { x: e.clientX, y: e.clientY }
    dragLocal.current.set(...slotPos(li, product.col ?? 0, product.depth ?? 0, product.tier ?? 0))
    setDrag({ id: product.id })
    document.body.style.cursor = 'grabbing'
  }

  const handleClick = (product) => {
    if (moved.current) {
      moved.current = false
      return
    }
    onCubeClick?.(product)
  }

  return (
    <>
      <color attach="background" args={['#0c0f15']} />
      <fog attach="fog" args={['#0c0f15', 13, 30]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 5]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]}>
        <orthographicCamera attach="shadow-camera" args={[-9, 9, 9, -9, 0.1, 35]} />
      </directionalLight>
      <directionalLight position={[-6, 4, -4]} intensity={0.4} color="#60a5fa" />
      <pointLight position={[0, 6, 3]} intensity={0.5} color="#f59e0b" />

      <group position={[0, groupOffsetY, 0]}>
        <Posts levels={L} />

        {shelf.levels.map((lvl, li) => (
          <group key={lvl.id}>
            <Board y={boardLocalY(li)} />
            {/* Etiqueta del estante (número arriba = 1) */}
            <Html position={[-SHELF_WIDTH / 2 - 0.25, boardLocalY(li) + 0.28, SHELF_DEPTH / 2]} center distanceFactor={11}>
              <div className="pointer-events-none select-none whitespace-nowrap rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] font-medium text-ink-100">
                {li + 1}
              </div>
            </Html>
            {lvl.products.map((p) => (
              <ProductCube
                key={p.id}
                product={{ ...p, levelLabel: lvl.label }}
                basePos={slotPos(li, p.col ?? 0, p.depth ?? 0, p.tier ?? 0)}
                highlighted={p.id === highlightId}
                isDragged={drag?.id === p.id}
                dragLocalRef={dragLocal}
                onPointerDownCube={(e, prod) => startDrag(e, prod, li)}
                onClickCube={handleClick}
              />
            ))}
          </group>
        ))}

        {/* Indicador de casillero destino (ámbar = válido, rojo = estante lleno) */}
        {snapView && (
          <mesh position={snapView.pos}>
            <boxGeometry args={[CUBE + 0.12, CUBE + 0.12, CUBE + 0.12]} />
            <meshBasicMaterial color={snapView.valid ? '#f59e0b' : '#ef4444'} wireframe transparent opacity={0.65} />
          </mesh>
        )}
      </group>

      <ContactShadows position={[0, groupOffsetY - 0.02, 0]} opacity={0.45} scale={16} blur={2.4} far={6} color="#000000" />
      <gridHelper args={[44, 44, '#1e2536', '#141821']} position={[0, groupOffsetY - 0.03, 0]} />

      <OrbitControls
        makeDefault
        enabled={!drag}
        enablePan
        enableZoom
        enableRotate
        minDistance={3}
        maxDistance={20}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, 0, 0]}
      />
    </>
  )
}

export default function Estanteria3D({ shelf, mode, highlightId, onCubeClick, onPlace, onDraggingChange }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 3.5, 7], fov: 45 }} gl={{ antialias: true }}>
      <Scene
        shelf={shelf}
        mode={mode}
        highlightId={highlightId}
        onCubeClick={onCubeClick}
        onPlace={onPlace}
        onDraggingChange={onDraggingChange}
      />
    </Canvas>
  )
}
