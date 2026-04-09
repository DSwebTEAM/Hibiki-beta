import { useEffect, useRef } from 'react'

export default function SakuraCanvas() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const lowRAM = navigator.deviceMemory ? navigator.deviceMemory < 4 : false
    const maxPetals = lowRAM ? 8 : 18
    const seedCount = lowRAM ? 6 : 14
    let petals = [], frame

    const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }

    function spawnPetal() {
      const size = 6 + Math.random() * 10
      return {
        x: Math.random() * canvas.width, y: -size, size,
        speedY: 0.6 + Math.random() * 1.2, speedX: (Math.random() - 0.5) * 0.6,
        rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.04,
        alpha: 0.5 + Math.random() * 0.5, drift: Math.random() * Math.PI * 2,
        driftS: 0.008 + Math.random() * 0.01,
      }
    }

    function drawPetal(p) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = p.alpha
      ctx.beginPath()
      ctx.moveTo(0, -p.size / 2)
      ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.2, p.size * 0.6, p.size * 0.5, 0, p.size * 0.55)
      ctx.bezierCurveTo(-p.size * 0.6, p.size * 0.5, -p.size * 0.6, -p.size * 0.2, 0, -p.size / 2)
      const dark = isDark()
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
      if (dark) { grad.addColorStop(0, '#d090c0'); grad.addColorStop(1, '#9060a0') }
      else       { grad.addColorStop(0, '#f9d0db'); grad.addColorStop(1, '#e8829a') }
      ctx.fillStyle = grad; ctx.fill(); ctx.restore()
    }

    function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (petals.length < maxPetals && Math.random() < 0.02) petals.push(spawnPetal())
      petals = petals.filter(p => {
        p.drift += p.driftS; p.x += p.speedX + Math.sin(p.drift) * 0.5
        p.y += p.speedY; p.rot += p.rotSpeed
        drawPetal(p); return p.y < canvas.height + 20
      })
      frame = requestAnimationFrame(loop)
    }

    const timer = setTimeout(() => {
      resize(); window.addEventListener('resize', resize)
      for (let i = 0; i < seedCount; i++) { const p = spawnPetal(); p.y = Math.random() * canvas.height; petals.push(p) }
      loop()
    }, 150)

    return () => { clearTimeout(timer); cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} id="sakura-canvas" />
}
