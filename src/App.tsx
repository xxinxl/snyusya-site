import { useCallback, useEffect, useRef, useState, createContext, useContext } from 'react'
import type { ReactNode, CSSProperties, PointerEvent as RPE } from 'react'

/* ---------- данные ---------- */
const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const P = (n: number) => asset(`snusya/${n}.png`)
type Photo = { id: number; src: string; cap: string; tags: string[]; wide?: boolean }
const PHOTOS: Photo[] = [
  { id: 1, src: P(1), cap: 'Булочка на пододеяльнике. Свежая выпечка.', tags: ['rest', 'vip'] },
  { id: 2, src: P(2), cap: 'Лапа для пятюни. Платная.', tags: ['paws'] },
  { id: 3, src: P(3), cap: 'Принимает солнечные ванны. Не беспокоить.', tags: ['rest', 'paws'], wide: true },
  { id: 5, src: P(5), cap: 'Меня держат. Я разрешаю.', tags: ['vip'] },
  { id: 6, src: P(6), cap: 'Поза «ну и что ты мне сделаешь»', tags: ['paws', 'vip'] },
  { id: 7, src: P(7), cap: 'Только что попробовала ламинат. Без комментариев.', tags: ['vip'], wide: true },
  { id: 8, src: P(8), cap: 'Клубочек. Обращаться осторожно.', tags: ['rest'], wide: true },
]
const FILTERS = [
  { k: 'all', l: 'Все прелести' },
  { k: 'paws', l: 'Лапки' },
  { k: 'rest', l: 'Отдых' },
  { k: 'vip', l: 'Очень важная кошка' },
]
const PET_REACTIONS = ['Мрр… ещё', 'Так и быть, разрешаю', 'За ушком, пожалуйста!', 'Ты принят в свиту', '*довольно щурится*', 'Мурр-мурр-мурр', 'Можно ещё 100 раз', 'Теперь ты мой человек']
const COMPLIMENTS = ['Самые круглые глаза во вселенной', 'Белые лапки — произведение искусства', 'Носик уровня «шедевр»', 'Хрумаешь пол элегантнее всех', 'Ты — официальная причина улыбаться', 'Пушистее облака', 'Королева подоконника', 'Главная звезда этого дома', 'Твои усы достойны музея', 'Мягче любой подушки', 'Без тебя пол был бы скучным']
const ACHIEVEMENTS = [
  { at: 10, t: 'Официальный поклонник', i: 'ribbon' },
  { at: 50, t: 'Почётный чесатель', i: 'paw' },
  { at: 100, t: 'Министр Снюсиных дел', i: 'crown' },
]
const MOODS = [
  { k: 'bun', l: 'Булочка', src: P(1), cut: asset('snusya/cutout-1.png'), cap: 'Сложилась в идеальную булочку. Мягкость: 100%.', bg: '#ffe9d6', accent: '#f4a46a', anim: 'floaty' },
  { k: 'hunt', l: 'Охотница', src: P(7), cut: asset('snusya/cutout-7.png'), cap: 'Цель обнаружена. Это провод. Или пол. Или твоя нога.', bg: '#dff3e4', accent: '#4f9a6a', anim: 'wiggle' },
  { k: 'bite', l: 'Кусь', src: P(2), cap: 'Предупреждаю лапой. Следующий этап — кусь.', bg: '#ffd3e4', accent: '#e0528a', anim: 'wiggle' },
  { k: 'queen', l: 'Сонная королева', src: P(8), cap: 'Её величество изволит дремать. Говорите шёпотом.', bg: '#e3dcff', accent: '#7a5bd6', anim: 'floaty' },
]

/* ---------- утилиты ---------- */
function useStored<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => {
    try { const s = localStorage.getItem('snusya:' + key); return s ? JSON.parse(s) : init } catch { return init }
  })
  useEffect(() => { try { localStorage.setItem('snusya:' + key, JSON.stringify(v)) } catch { /* */ } }, [key, v])
  return [v, setV] as const
}

type Particle = { id: number; x: number; y: number; dx: number; rot: number; kind: string; size: number }
const FxCtx = createContext<{ burst: (x: number, y: number, n?: number, kinds?: string[]) => void; calm: boolean }>({ burst: () => {}, calm: false })
const useFx = () => useContext(FxCtx)

function Reveal({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.12 })
    io.observe(el); return () => io.disconnect()
  }, [])
  return <section id={id} ref={ref} className={'reveal ' + className}>{children}</section>
}

/* ---------- рисованные детали ---------- */
const Heart = ({ c = '#e0528a', s = 24, className = '', style }: { c?: string; s?: number; className?: string; style?: CSSProperties }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" className={className} style={style}><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.9 1.3 5.4 3.2 1.5-1.9 3.2-3.2 5.4-3.2 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z" fill={c} stroke="#4a2160" strokeWidth="1.3" strokeLinejoin="round" /></svg>
)
const Star = ({ c = '#fff', s = 22, className = '', style }: { c?: string; s?: number; className?: string; style?: CSSProperties }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" className={className} style={style}><path d="M12 2c.6 4.8 2.6 8.8 10 10-7.4 1.2-9.4 5.2-10 10-.6-4.8-2.6-8.8-10-10 7.4-1.2 9.4-5.2 10-10z" fill={c} /></svg>
)
const Paw = ({ c = '#fff', s = 40, className = '', style, stroke = '#4a2160' }: { c?: string; s?: number; className?: string; style?: CSSProperties; stroke?: string }) => (
  <svg width={s} height={s} viewBox="0 0 48 48" className={className} style={style} fill={c} stroke={stroke} strokeWidth="1.8">
    <ellipse cx="24" cy="32" rx="10" ry="8.5" /><ellipse cx="11" cy="20" rx="4.2" ry="5.4" /><ellipse cx="19" cy="12" rx="4.2" ry="5.6" /><ellipse cx="29" cy="12" rx="4.2" ry="5.6" /><ellipse cx="37" cy="20" rx="4.2" ry="5.4" />
  </svg>
)
const Yarn = ({ s = 70, c = '#c9a8f5' }: { s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 60 60" fill="none" stroke="#4a2160" strokeWidth="2" strokeLinecap="round">
    <circle cx="30" cy="30" r="22" fill={c} /><path d="M12 22c10 4 22 2 34-8M10 34c14 2 28-6 38-16M14 44c12-2 24-12 32-22M22 50c6-8 16-18 26-22" /><path d="M50 40c4 4 6 10 2 14" />
  </svg>
)
const Whiskers = ({ className = '', flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 140 80" className={className} style={{ transform: flip ? 'scaleX(-1)' : undefined }} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
    <path d="M5 20 C45 14 90 12 135 4" /><path d="M5 42 C50 40 95 40 135 38" /><path d="M5 62 C45 66 90 70 132 76" />
  </svg>
)
const MiniCat = ({ s = 70, color = '#8f8a9c' }: { s?: number; color?: string }) => (
  <svg width={s} height={s} viewBox="0 0 80 80" stroke="#4a2160" strokeWidth="2" strokeLinejoin="round">
    <path d="M14 70c-4-18 2-34 10-40l-2-18 12 10c4-1 8-1 12 0l12-10-2 18c8 6 14 22 10 40z" fill={color} />
    <path d="M32 40c4 4 12 4 16 0l-2 16c-4 2-8 2-12 0z" fill="#fff" stroke="none" />
    <circle cx="31" cy="38" r="5" fill="#f2c94c" /><circle cx="49" cy="38" r="5" fill="#f2c94c" />
    <circle cx="31" cy="38" r="2.4" fill="#2a1630" stroke="none" /><circle cx="49" cy="38" r="2.4" fill="#2a1630" stroke="none" />
    <path d="M38 46l2 2 2-2z" fill="#f29bb5" />
    <path d="M24 46l-14-2M24 50l-14 3M56 46l14-2M56 50l14 3" fill="none" strokeWidth="1.3" />
    <ellipse cx="28" cy="70" rx="6" ry="3.5" fill="#fff" /><ellipse cx="52" cy="70" rx="6" ry="3.5" fill="#fff" />
  </svg>
)

function Tip({ text, children, className = '', style }: { text: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <span className={'group/tip absolute ' + className} style={style} tabIndex={0}>
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-max max-w-[220px] -translate-x-1/2 scale-75 rounded-2xl bg-plum px-3 py-2 text-center font-hand text-xl leading-tight text-white opacity-0 transition group-hover/tip:scale-100 group-hover/tip:opacity-100 group-focus/tip:scale-100 group-focus/tip:opacity-100">
        {text}
      </span>
    </span>
  )
}

/* ---------- мурчание ---------- */
function usePurr() {
  const ctx = useRef<AudioContext | null>(null)
  const nodes = useRef<{ stop: () => void } | null>(null)
  const [on, setOn] = useState(false)
  const toggle = () => {
    if (on) { nodes.current?.stop(); nodes.current = null; setOn(false); return }
    const ac = ctx.current ?? new AudioContext(); ctx.current = ac; ac.resume()
    const master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination)
    master.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.6)
    const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = buf.getChannelData(0)
    let last = 0; for (let i = 0; i < d.length; i++) { last = (last + (Math.random() * 2 - 1) * 0.08) * 0.97; d[i] = last * 3 }
    const noise = ac.createBufferSource(); noise.buffer = buf; noise.loop = true
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320
    const am = ac.createGain(); am.gain.value = 0.5
    const lfo = ac.createOscillator(); lfo.frequency.value = 25; const lfoG = ac.createGain(); lfoG.gain.value = 0.5
    lfo.connect(lfoG).connect(am.gain)
    const breath = ac.createOscillator(); breath.frequency.value = 0.45; const bG = ac.createGain(); bG.gain.value = 0.25
    breath.connect(bG).connect(master.gain)
    noise.connect(lp).connect(am).connect(master)
    noise.start(); lfo.start(); breath.start()
    nodes.current = { stop: () => { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(0, ac.currentTime, 0.15); setTimeout(() => { noise.stop(); lfo.stop(); breath.stop(); master.disconnect() }, 600) } }
    setOn(true)
  }
  useEffect(() => () => nodes.current?.stop(), [])
  return { on, toggle }
}

/* ---------- лазер ---------- */
function Laser({ active }: { active: boolean }) {
  const dot = useRef({ x: -100, y: -100 }); const cat = useRef({ x: 80, y: 300 })
  const [, force] = useState(0)
  useEffect(() => {
    if (!active) return
    const mv = (e: PointerEvent) => { dot.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('pointermove', mv); window.addEventListener('pointerdown', mv)
    let raf = 0
    const tick = () => { cat.current.x += (dot.current.x - cat.current.x - 30) * 0.05; cat.current.y += (dot.current.y - cat.current.y - 30) * 0.05; force((n) => n + 1); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerdown', mv); cancelAnimationFrame(raf) }
  }, [active])
  if (!active) return null
  const caught = Math.hypot(dot.current.x - cat.current.x - 30, dot.current.y - cat.current.y - 30) < 30
  const flip = dot.current.x < cat.current.x + 30
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      <div className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500" style={{ left: dot.current.x, top: dot.current.y, boxShadow: '0 0 12px 6px rgba(255,0,0,.55)' }} />
      <div className="absolute" style={{ left: cat.current.x, top: cat.current.y, transform: flip ? 'scaleX(-1)' : undefined }}><MiniCat s={64} /></div>
      {caught && <div className="absolute font-hand text-2xl text-plum" style={{ left: cat.current.x + 10, top: cat.current.y - 28 }}>почти поймала!</div>}
    </div>
  )
}

/* ---------- навбар ---------- */
function Nav({ calm, setCalm, purr, laser, setLaser }: { calm: boolean; setCalm: (v: boolean) => void; purr: ReturnType<typeof usePurr>; laser: boolean; setLaser: (v: boolean) => void }) {
  const chip = (activeV: boolean) => 'springy flex items-center gap-2 rounded-full border-2 border-plum px-3 py-1.5 text-sm font-extrabold ' + (activeV ? 'bg-plum text-white' : 'bg-white/70 text-plum backdrop-blur')
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full bg-white/60 px-3 py-2 shadow-[0_6px_30px_rgba(74,33,96,.12)] backdrop-blur-md">
        <a href="#top" className="flex items-center gap-2 pl-1 font-display text-sm font-bold"><Paw s={26} c="#ffd3e4" /> <span className="hidden sm:inline">Фан-клуб Снюси</span></a>
        <div className="flex flex-wrap justify-end gap-1.5">
          <button className={chip(purr.on)} onClick={purr.toggle} aria-pressed={purr.on}><span>{purr.on ? '♫' : '♪'}</span><span className="hidden sm:inline">{purr.on ? 'Мурчит' : 'Мурчание'}</span></button>
          <button className={chip(laser)} onClick={() => setLaser(!laser)} aria-pressed={laser}><span className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_6px_red]" /><span className="hidden sm:inline">Лазер</span></button>
          <button className={chip(calm)} onClick={() => setCalm(!calm)} aria-pressed={calm}><span>{calm ? '☾' : '✦'}</span><span className="hidden sm:inline">Спокойный режим</span></button>
        </div>
      </div>
    </header>
  )
}

/* ---------- герой ---------- */
function Hero({ pets, setPets, onSecret }: { pets: number; setPets: (f: (n: number) => number) => void; onSecret: () => void }) {
  const { burst, calm } = useFx()
  const [m, setM] = useState({ x: 0, y: 0 })
  const [reaction, setReaction] = useState<string | null>(null)
  const [joy, setJoy] = useState(0)
  const [taps, setTaps] = useState(0)
  const photoRef = useRef<HTMLDivElement>(null)
  useEffect(() => { const t = setInterval(() => setJoy((j) => Math.max(0, j - 2)), 900); return () => clearInterval(t) }, [])
  const pet = () => {
    const r = photoRef.current?.getBoundingClientRect()
    if (r) burst(r.left + r.width / 2, r.top + r.height / 2, 14)
    setPets((n) => n + 1); setJoy((j) => Math.min(100, j + 14))
    setReaction(PET_REACTIONS[Math.floor(Math.random() * PET_REACTIONS.length)])
  }
  useEffect(() => { if (!reaction) return; const t = setTimeout(() => setReaction(null), 2200); return () => clearTimeout(t) }, [reaction])
  const tapTitle = () => { const n = taps + 1; setTaps(n); if (n >= 5) { setTaps(0); onSecret() } }
  const joyLabel = joy > 85 ? 'Абсолютное блаженство' : joy > 55 ? 'Мурчит на всю квартиру' : joy > 25 ? 'Довольна' : joy > 0 ? 'Принюхивается' : 'Ждёт ласки'
  const px = calm ? 0 : m.x, py = calm ? 0 : m.y
  return (
    <section id="top" className="relative overflow-hidden px-3 pt-24 sm:px-6"
      onPointerMove={(e) => { if (e.pointerType !== 'mouse') return; const r = e.currentTarget.getBoundingClientRect(); setM({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }) }}>
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[36px] sm:rounded-[48px]" style={{ background: 'radial-gradient(circle at 10% 0%, #ffc4f2 0%, transparent 35%), radial-gradient(circle at 90% 40%, #f0e2ff 0%, transparent 40%), linear-gradient(180deg,#d9b8ff,#c9a8f5 60%,#bb98f0)' }}>
        {/* декор */}
        <Star s={34} className="twinkle absolute left-[8%] top-[18%]" />
        <Star s={20} className="twinkle absolute right-[12%] top-[12%]" style={{ animationDelay: '.8s' }} />
        <Star s={26} className="twinkle absolute bottom-[30%] left-[16%]" style={{ animationDelay: '1.4s' }} />
        <Heart s={30} c="#ffd3e4" className="floaty absolute right-[22%] top-[26%]" style={{ ['--r' as string]: '12deg', translate: `${px * -40}px ${py * -30}px` }} />
        <Heart s={22} c="#fff" className="floaty absolute left-[24%] top-[40%]" style={{ animationDelay: '1s', translate: `${px * -30}px ${py * -20}px` }} />
        <Whiskers className="absolute right-[4%] top-[48%] hidden w-36 text-white sm:block" />
        <Whiskers flip className="absolute left-[4%] top-[52%] hidden w-28 text-white/80 sm:block" />

        <p className="relative pt-10 text-center font-hand text-2xl text-white sm:pt-14 sm:text-3xl">личный фан-клуб одной очень важной кошки</p>
        <h1 onClick={tapTitle} title="Нажми… если осмелишься" className="relative z-0 cursor-pointer select-none text-center font-display text-[24vw] font-black leading-[.85] tracking-tight text-white sm:text-[17vw] lg:text-[200px]"
          style={{ transform: `translate(${px * 18}px, ${py * 10}px)`, textShadow: '0 8px 40px rgba(74,33,96,.18)' }}>
          СНЮСЯ
        </h1>
        {taps > 0 && <p className="absolute left-1/2 top-[34%] z-20 -translate-x-1/2 font-hand text-xl text-plum" key={taps} style={{ animation: 'pop .4s' }}>{['', 'ой', 'ещё…', 'почти!', 'последний раз!'][taps]}</p>}

        {/* фото */}
        <div className="relative z-10 mx-auto -mt-[16vw] w-[96%] max-w-[680px] sm:-mt-[11vw] lg:-mt-32" style={{ transform: `translate(${px * -30}px, ${py * -20}px) rotate(${px * 4}deg)`, transition: 'transform .2s ease-out' }}>
          <div ref={photoRef} className="relative">
            <div className="blob absolute inset-x-[12%] bottom-[2%] top-[22%] bg-white/35" />
            <img src={asset('snusya/cutout-7.png')} alt="Снюся смотрит огромными глазами" className="relative w-full drop-shadow-[0_24px_30px_rgba(74,33,96,.35)]" />
          </div>
          <Tip text="Носик для поцелуев. Строго по записи." className="left-[57%] top-[40%] h-10 w-10 -translate-x-1/2" ><span className="block h-full w-full rounded-full" /></Tip>
          <Tip text="Белые носочки. Стирать нельзя, только любоваться." className="bottom-[2%] left-[42%] h-16 w-28"><span className="block h-full w-full" /></Tip>
          {reaction && <div key={reaction + pets} className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-plum bg-white px-4 py-2 font-hand text-2xl text-plum shadow-lg" style={{ animation: 'pop .45s cubic-bezier(.34,1.8,.5,1)' }}>{reaction}</div>}
          <Tip text="Сертификат подлинный. Выдан самой себе." className="wiggle right-2 top-[2%] z-20 sm:right-4 sm:top-[10%] lg:-right-20" style={{ ['--r' as string]: '8deg' }}>
            <span className="floor-taster-label block rotate-6 rounded-[22px] border-2 border-plum bg-rose text-center font-display font-bold text-plum shadow-[4px_4px_0_#4a2160]">Профессиональный дегустатор пола</span>
          </Tip>
          <Tip text="Это лапа. Она тоже хочет внимания." className="floaty -left-6 bottom-[16%] z-20 sm:-left-20" style={{ ['--r' as string]: '-14deg' }}><Paw s={64} c="#fff" /></Tip>
        </div>

        {/* текст и кнопки */}
        <div className="relative z-10 mx-auto max-w-2xl px-4 pb-12 pt-8 text-center">
          <p className="font-display text-lg font-bold leading-snug text-plum sm:text-2xl">Маленькая кошка. Большая любовь.<br /><span className="text-white [text-shadow:0_2px_0_#4a2160]">Пол под угрозой.</span></p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={pet} className="springy flex items-center gap-2 rounded-full bg-plum px-7 py-4 text-lg font-extrabold text-white shadow-[0_8px_0_#2b1038]"><Heart s={22} c="#ffd3e4" /> Погладить Снюсю</button>
            <a href="#meet" className="springy rounded-full border-2 border-plum bg-white px-7 py-4 text-lg font-extrabold text-plum">Познакомиться поближе</a>
          </div>
          <div className="mx-auto mt-6 max-w-sm rounded-3xl bg-white/50 p-4 text-left backdrop-blur">
            <div className="flex items-baseline justify-between text-sm font-bold"><span>Шкала довольства</span><span className="font-hand text-xl">{joyLabel}</span></div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-white"><div className="h-full rounded-full bg-gradient-to-r from-rose via-[#f59ac6] to-plum transition-all duration-500" style={{ width: joy + '%' }} /></div>
            <p className="mt-2 text-sm">Всего поглаживаний: <b className="font-display">{pets.toLocaleString('ru')}</b></p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- бегущая строка ---------- */
function Marquee() {
  const items = ['хрум', 'мяу', 'носик', 'лапки', 'кусь', 'мрр', 'усы', 'пол — вкусный']
  const row = [...items, ...items, ...items, ...items]
  return (
    <div className="my-16 -rotate-2 overflow-hidden border-y-2 border-plum bg-rose py-3">
      <div className="marquee flex w-max gap-8 font-display text-2xl font-bold uppercase text-plum">
        {row.map((t, i) => <span key={i} className="flex items-center gap-8">{t}<Star s={18} c="#4a2160" /></span>)}
      </div>
    </div>
  )
}

/* ---------- знакомство ---------- */
const FACTS = [
  { t: 'Носик', d: 'для поцелуев', more: 'Розовый, влажный и с тонкой полоской. Целовать можно, но быстро.', icon: 'heart' },
  { t: 'Лапки', d: 'для важных дел', more: 'Белые носочки, пушистые подушечки. Важные дела: пятюня, топтание, сбивание предметов.', icon: 'paw' },
  { t: 'Глаза', d: 'чтобы получать всё', more: 'Два жёлтых фонаря. Один взгляд — и ты уже открываешь корм.', icon: 'star' },
  { t: 'Пол', d: 'чтобы хрум', more: 'Увлечение всей жизни. Ламинат — нежный, паркет — с ноткой дуба, плинтус — деликатес.', icon: 'yarn' },
]
function Meet() {
  const [open, setOpen] = useState<number | null>(null)
  const { burst } = useFx()
  return (
    <Reveal id="meet" className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1fr_1.1fr]">
      <div className="relative mx-auto w-[85%] max-w-md">
        <div className="absolute -inset-6 rotate-6 rounded-[40%] bg-lav-soft" />
        <div className="tilt relative -rotate-3 bg-white p-3 pb-14 shadow-[0_20px_50px_rgba(74,33,96,.18)]">
          <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-3" />
          <img src={P(5)} alt="Снюся на руках" className="aspect-[3/4] w-full object-cover" />
          <p className="absolute bottom-3 left-0 right-0 text-center font-hand text-3xl">это я, здрасьте</p>
        </div>
        <Heart s={44} className="floaty absolute -right-4 -top-6" style={{ ['--r' as string]: '14deg' }} />
      </div>
      <div>
        <p className="font-hand text-3xl text-[#b26bd6]">глава первая</p>
        <h2 className="font-display text-4xl font-black leading-[1.02] sm:text-6xl">Знакомьтесь, это&nbsp;Снюся</h2>
        <p className="mt-4 max-w-md text-lg">Серо-кремовая, белогрудая, с глазами размером с блюдца. Живёт здесь, правит здесь, грызёт пол здесь. Нажми на факт — узнаешь больше.</p>
        <div className="mt-8 space-y-3">
          {FACTS.map((f, i) => {
            const o = open === i
            return (
              <button key={i} onClick={(e) => { setOpen(o ? null : i); if (!o) burst(e.clientX, e.clientY, 6, [f.icon === 'paw' ? 'paw' : f.icon === 'star' ? 'star' : 'heart']) }}
                className={'springy block w-full rounded-[28px] border-2 border-plum px-5 py-4 text-left ' + (o ? 'bg-plum text-white' : 'bg-white hover:bg-lav-soft')}
                style={{ marginLeft: `${[0, 24, 8, 32][i]}px`, width: `calc(100% - ${[0, 24, 8, 32][i]}px)` }} aria-expanded={o}>
                <span className="flex items-center gap-3">
                  <span className={'grid h-11 w-11 shrink-0 place-items-center rounded-full transition ' + (o ? 'rotate-12 bg-rose' : 'bg-lav-soft')}>
                    {f.icon === 'heart' ? <Heart s={24} /> : f.icon === 'paw' ? <Paw s={28} /> : f.icon === 'star' ? <Star s={24} c="#f2c94c" /> : <Yarn s={30} />}
                  </span>
                  <span className="font-display text-lg font-bold sm:text-xl">{f.t} — <span className={o ? 'text-rose' : 'text-[#b26bd6]'}>{f.d}</span></span>
                  <span className={'ml-auto text-2xl transition ' + (o ? 'rotate-45' : '')}>+</span>
                </span>
                <span className="grid transition-all duration-500" style={{ gridTemplateRows: o ? '1fr' : '0fr' }}>
                  <span className="overflow-hidden"><span className="block pt-3 pl-14 text-base" style={o ? { animation: 'bounceIn .5s' } : undefined}>{f.more}</span></span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </Reveal>
  )
}

/* ---------- настроение ---------- */
function Mood() {
  const [k, setK] = useState(0)
  const mo = MOODS[k]
  return (
    <Reveal className="px-3 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[48px] px-5 py-14 transition-colors duration-700 sm:px-12" style={{ background: mo.bg }}>
        <h2 className="text-center font-display text-3xl font-black leading-tight sm:text-5xl">Сегодня у Снюси настроение…</h2>
        <div className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2" role="tablist">
          {MOODS.map((x, i) => (
            <button key={x.k} role="tab" aria-selected={i === k} onClick={() => setK(i)}
              className={'springy rounded-full border-2 border-plum px-5 py-2.5 font-extrabold ' + (i === k ? 'scale-105 text-white shadow-[0_5px_0_#4a2160]' : 'bg-white/80')}
              style={i === k ? { background: x.accent } : undefined}>{x.l}</button>
          ))}
        </div>
        <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
          <div className="relative mx-auto w-[80%] max-w-sm">
            <div key={mo.k} className={mo.anim} style={{ ['--r' as string]: k % 2 ? '3deg' : '-3deg' }}>
              {mo.cut ? (
                <div className="relative grid aspect-square place-items-center" style={{ animation: 'pop .6s cubic-bezier(.34,1.56,.5,1)' }}>
                  <div className="blob absolute inset-[6%]" style={{ background: mo.accent, opacity: 0.25 }} />
                  <img src={mo.cut} alt={mo.l} className="relative w-[112%] max-w-none drop-shadow-[0_18px_22px_rgba(74,33,96,.3)]" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-[42%_58%_50%_50%/50%_45%_55%_50%] border-[6px] border-white shadow-xl" style={{ animation: 'pop .6s cubic-bezier(.34,1.56,.5,1)' }}>
                  <img src={mo.src} alt={mo.l} className="aspect-square w-full object-cover" />
                </div>
              )}
            </div>
            <span className="absolute -bottom-3 -left-3 rotate-[-8deg] rounded-xl px-3 py-1 font-display text-sm font-bold text-white" style={{ background: mo.accent }}>режим: {mo.l.toLowerCase()}</span>
          </div>
          <div key={'c' + mo.k} style={{ animation: 'bounceIn .6s' }}>
            <p className="font-display text-6xl font-black sm:text-8xl" style={{ color: mo.accent }}>{['мягко', 'тссс', 'кусь!', 'zzz'][k]}</p>
            <p className="mt-3 max-w-md font-hand text-3xl leading-tight sm:text-4xl">{mo.cap}</p>
            <div className="mt-4 flex gap-2">{Array.from({ length: 5 }).map((_, i) => <span key={i} className="floaty" style={{ animationDelay: i * 0.2 + 's' }}>{k === 3 ? <Star s={20} c={mo.accent} /> : k === 2 ? <Paw s={24} c={mo.accent} /> : <Heart s={20} c={mo.accent} />}</span>)}</div>
          </div>
        </div>
      </div>
    </Reveal>
  )
}

/* ---------- галерея ---------- */
function Gallery({ likes, setLikes }: { likes: Record<number, boolean>; setLikes: (f: (l: Record<number, boolean>) => Record<number, boolean>) => void }) {
  const [f, setF] = useState('all')
  const [idx, setIdx] = useState<number | null>(null)
  const { burst } = useFx()
  const list = PHOTOS.filter((p) => f === 'all' || p.tags.includes(f))
  const like = (id: number, e?: { clientX: number; clientY: number }) => {
    setLikes((l) => ({ ...l, [id]: !l[id] }))
    if (!likes[id] && e) burst(e.clientX, e.clientY, 8)
  }
  const rot = [-3, 2, -1.5, 3, -2.5, 1.5, -2]
  return (
    <Reveal className="mx-auto max-w-6xl px-5 py-20">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="font-hand text-3xl text-[#b26bd6]">фотоохота</p>
          <h2 className="max-w-2xl font-display text-4xl font-black leading-[1.02] sm:text-6xl">Снюся в естественной среде обитания</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((x) => (
            <button key={x.k} onClick={() => setF(x.k)} className={'springy rounded-full border-2 border-plum px-4 py-2 text-sm font-extrabold ' + (f === x.k ? 'bg-plum text-white' : 'bg-white')}>{x.l}</button>
          ))}
        </div>
      </div>
      <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3">
        {list.map((p, i) => (
          <figure key={p.id} className="tilt relative mb-8 break-inside-avoid bg-white p-3 pb-4 shadow-[0_14px_40px_rgba(74,33,96,.14)]" style={{ transform: `rotate(${rot[i % rot.length]}deg)`, animation: 'bounceIn .5s both', animationDelay: i * 0.07 + 's' }}>
            {i % 2 === 0 && <span className="tape -top-3 left-6 -rotate-6" />}
            <button onClick={() => setIdx(i)} className="block w-full overflow-hidden" aria-label="Открыть фото">
              <img src={p.src} alt={p.cap} loading="lazy" className={'w-full object-cover transition duration-500 hover:scale-105 ' + (p.wide ? 'aspect-[4/3]' : i % 3 === 1 ? 'aspect-[3/4]' : 'aspect-[4/5]')} />
            </button>
            <figcaption className="mt-2 flex items-start justify-between gap-2">
              <span className="font-hand text-2xl leading-tight">{p.cap}</span>
              <button onClick={(e) => like(p.id, e)} className="springy shrink-0" aria-label="Сердечко" aria-pressed={!!likes[p.id]}><Heart s={30} c={likes[p.id] ? '#e0528a' : '#fff'} /></button>
            </figcaption>
          </figure>
        ))}
      </div>
      {idx !== null && <Lightbox list={list} idx={idx} setIdx={setIdx} likes={likes} like={like} />}
    </Reveal>
  )
}
function Lightbox({ list, idx, setIdx, likes, like }: { list: Photo[]; idx: number; setIdx: (n: number | null) => void; likes: Record<number, boolean>; like: (id: number, e?: { clientX: number; clientY: number }) => void }) {
  const p = list[idx]
  const go = useCallback((d: number) => setIdx((idx + d + list.length) % list.length), [idx, list.length, setIdx])
  const sx = useRef<number | null>(null)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setIdx(null); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = '' }
  }, [go, setIdx])
  const btn = 'springy grid h-12 w-12 place-items-center rounded-full bg-white text-2xl font-black text-plum'
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-plum/85 p-4 backdrop-blur" onClick={() => setIdx(null)}
      onTouchStart={(e) => { sx.current = e.touches[0].clientX }} onTouchEnd={(e) => { if (sx.current === null) return; const d = e.changedTouches[0].clientX - sx.current; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); sx.current = null }}>
      <div className="relative max-h-full w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div key={p.id} className="bg-white p-3 pb-4 shadow-2xl" style={{ animation: 'pop .4s' }}>
          <img src={p.src} alt={p.cap} className="max-h-[70vh] w-full object-contain" />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-hand text-2xl sm:text-3xl">{p.cap}</p>
            <button onClick={(e) => like(p.id, e)} className="springy" aria-label="Сердечко"><Heart s={38} c={likes[p.id] ? '#e0528a' : '#fff'} /></button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <button className={btn} onClick={() => go(-1)} aria-label="Назад">←</button>
          <span className="font-bold text-white">{idx + 1} / {list.length}</span>
          <button className={btn} onClick={() => go(1)} aria-label="Вперёд">→</button>
        </div>
        <button className={btn + ' absolute -right-2 -top-5'} onClick={() => setIdx(null)} aria-label="Закрыть">×</button>
      </div>
    </div>
  )
}

/* ---------- игра ---------- */
type Spot = { id: number; x: number; y: number; born: number }
type Bite = { id: number; x: number; y: number }
function Game({ best, setBest }: { best: number; setBest: (n: number) => void }) {
  const [state, setState] = useState<'idle' | 'play' | 'done'>('idle')
  const [time, setTime] = useState(15)
  const [score, setScore] = useState(0)
  const [spots, setSpots] = useState<Spot[]>([])
  const [bites, setBites] = useState<Bite[]>([])
  const [pops, setPops] = useState<Bite[]>([])
  const [jump, setJump] = useState(0)
  const [newBest, setNewBest] = useState(false)
  const idc = useRef(0)
  const board = useRef<HTMLDivElement>(null)
  const [yarn, setYarn] = useState({ x: 82, y: 70 })
  const drag = useRef(false)

  const start = () => { setScore(0); setTime(15); setBites([]); setSpots([]); setNewBest(false); setState('play') }
  useEffect(() => {
    if (state !== 'play') return
    const t0 = Date.now()
    const tick = setInterval(() => {
      const left = Math.max(0, 15 - (Date.now() - t0) / 1000); setTime(left)
      if (left <= 0) setState('done')
    }, 100)
    const spawn = setInterval(() => {
      const now = Date.now()
      setSpots((s) => [...s.filter((x) => now - x.born < 1400), { id: ++idc.current, x: 10 + Math.random() * 80, y: 15 + Math.random() * 60, born: now }].slice(-4))
    }, 550)
    return () => { clearInterval(tick); clearInterval(spawn) }
  }, [state])
  useEffect(() => { if (state === 'done') { setSpots([]); if (score > best) { setBest(score); setNewBest(true) } } }, [state]) // eslint-disable-line

  const hit = (s: Spot) => {
    setSpots((a) => a.filter((x) => x.id !== s.id))
    setBites((b) => [...b, { id: s.id, x: s.x, y: s.y }].slice(-40))
    setPops((p) => [...p, { id: s.id, x: s.x, y: s.y }]); setTimeout(() => setPops((p) => p.filter((x) => x.id !== s.id)), 800)
    setScore((n) => n + 1); setJump((j) => j + 1)
  }
  const rank = score >= 20 ? 'Паркетная легенда' : score >= 10 ? 'Гроза ламината' : 'Начинающий хрумолог'
  const moveYarn = (e: RPE) => {
    if (!drag.current || !board.current) return
    const r = board.current.getBoundingClientRect()
    setYarn({ x: Math.min(95, Math.max(5, ((e.clientX - r.left) / r.width) * 100)), y: Math.min(90, Math.max(10, ((e.clientY - r.top) / r.height) * 100)) })
  }
  return (
    <Reveal id="game" className="px-3 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <p className="font-hand text-3xl text-[#b26bd6]">мини-игра</p>
          <h2 className="font-display text-4xl font-black leading-none sm:text-7xl">Спаси пол.<br /><span className="text-[#b26bd6]">Или не спасай</span></h2>
          <p className="mx-auto mt-4 max-w-lg text-lg">15 секунд. Нажимай на светящиеся дощечки, пока Снюся их пробует. Клубок можно таскать — просто так, для души.</p>
        </div>
        <div className="mx-auto mb-3 flex max-w-4xl items-center justify-between gap-2 rounded-full bg-plum px-5 py-3 font-display text-sm font-bold text-white sm:text-lg">
          <span>Хрум: {score}</span>
          <span className="flex-1 px-3"><span className="block h-2.5 overflow-hidden rounded-full bg-white/20"><span className="block h-full bg-rose transition-[width] duration-100" style={{ width: (time / 15) * 100 + '%' }} /></span></span>
          <span>{time.toFixed(1)} с</span>
          <span className="hidden sm:inline">Рекорд: {best}</span>
        </div>
        <div ref={board} className="boards relative mx-auto h-[420px] max-w-4xl touch-none select-none overflow-hidden rounded-[32px] border-4 border-plum sm:h-[480px]"
          onPointerMove={moveYarn} onPointerUp={() => (drag.current = false)} onPointerLeave={() => (drag.current = false)}>
          {bites.map((b) => (
            <svg key={b.id} viewBox="0 0 40 30" className="absolute w-12 -translate-x-1/2 -translate-y-1/2" style={{ left: b.x + '%', top: b.y + '%' }}>
              <path d="M4 4 Q8 14 12 6 Q16 16 20 6 Q24 16 28 6 Q32 14 36 4 Q30 26 20 26 Q10 26 4 4z" fill="#6b4024" stroke="#3d220f" strokeWidth="1.5" />
            </svg>
          ))}
          {spots.map((s) => (
            <button key={s.id} onPointerDown={(e) => { e.stopPropagation(); hit(s) }} aria-label="Участок пола"
              className="absolute h-20 w-24 rounded-[40%] border-[3px] border-dashed border-white bg-[#f4c890]/80 shadow-[0_0_30px_#fff6]"
              style={{ left: s.x + '%', top: s.y + '%', animation: 'spot .3s both' }}>
              <span className="font-hand text-xl text-plum">хрум?</span>
            </button>
          ))}
          {pops.map((p) => (
            <div key={'p' + p.id} className="pointer-events-none absolute" style={{ left: p.x + '%', top: p.y + '%' }}>
              <span className="absolute font-display text-2xl font-black text-white [text-shadow:2px_2px_0_#4a2160]" style={{ animation: 'khrum .8s forwards' }}>хрум!</span>
              {Array.from({ length: 7 }).map((_, i) => <span key={i} className="absolute h-2 w-2 rounded-sm bg-[#7a4a28]" style={{ ['--dx' as string]: Math.cos(i) * 40 + 'px', ['--dy' as string]: Math.sin(i) * 30 + 20 + 'px', animation: 'crumb .7s forwards' } as CSSProperties} />)}
            </div>
          ))}
          {/* Снюся */}
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
            <div key={jump} style={{ animation: jump ? 'jump .5s' : undefined }}>
              <img src={asset('snusya/cutout-7.png')} alt="Маленькая Снюся" className="w-36 drop-shadow-[0_8px_8px_rgba(61,34,15,.45)] sm:w-44" />
            </div>
            {state === 'play' && jump > 0 && <span key={'j' + jump} className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-hand text-xl text-white" style={{ animation: 'pop .3s' }}>{['ням', 'вкусно!', 'ещё!', 'м-м-м'][jump % 4]}</span>}
          </div>
          {/* клубок */}
          <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing" style={{ left: yarn.x + '%', top: yarn.y + '%', transform: `rotate(${yarn.x * 8}deg)` }}
            onPointerDown={(e) => { e.stopPropagation(); drag.current = true; board.current?.setPointerCapture(e.pointerId) }} title="Клубок. Таскай!">
            <Yarn s={60} c="#ffd3e4" />
          </div>
          {state !== 'play' && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-plum/50 p-4 backdrop-blur-[2px]">
              <div className="w-full max-w-sm rounded-[32px] bg-milk p-6 text-center shadow-2xl" style={{ animation: 'pop .5s' }}>
                {state === 'idle' ? (
                  <>
                    <p className="font-display text-2xl font-black">Готов к хрусту?</p>
                    <p className="mt-2">Нажимай на дощечки быстрее, чем Снюся передумает.</p>
                  </>
                ) : (
                  <>
                    <p className="font-hand text-2xl">твой титул:</p>
                    <p className="font-display text-3xl font-black leading-tight text-[#b26bd6]">{rank}</p>
                    <p className="mt-2 text-lg">Схрумано дощечек: <b>{score}</b></p>
                    {newBest ? <p className="mt-1 font-bold text-[#e0528a]">Новый рекорд! Пол в шоке.</p> : <p className="mt-1 text-sm">Рекорд: {best}</p>}
                  </>
                )}
                <button onClick={start} className="springy mt-5 rounded-full bg-plum px-8 py-3 text-lg font-extrabold text-white shadow-[0_6px_0_#2b1038]">{state === 'idle' ? 'Старт!' : 'Ещё разок'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Reveal>
  )
}

/* ---------- восхищение ---------- */
function Admire({ count, setCount }: { count: number; setCount: (f: (n: number) => number) => void }) {
  const { burst } = useFx()
  const [comp, setComp] = useState('Нажми — и Снюся узнает правду')
  const [toast, setToast] = useState<string | null>(null)
  const click = (e: { clientX: number; clientY: number }) => {
    const n = count + 1; setCount(() => n)
    burst(e.clientX, e.clientY, 12, ['heart', 'star', 'paw'])
    setComp(COMPLIMENTS[n % COMPLIMENTS.length])
    const a = ACHIEVEMENTS.find((x) => x.at === n)
    if (a) { setToast(a.t); setTimeout(() => setToast(null), 3500) }
  }
  const next = ACHIEVEMENTS.find((a) => a.at > count)
  return (
    <Reveal className="relative overflow-hidden bg-plum px-5 py-24 text-white">
      <Paw s={160} c="#5c2d75" stroke="#5c2d75" className="absolute -left-8 top-10 -rotate-12" />
      <Paw s={220} c="#5c2d75" stroke="#5c2d75" className="absolute -bottom-10 -right-10 rotate-12" />
      <div className="relative mx-auto max-w-4xl text-center">
        <h2 className="font-display text-4xl font-black leading-[1.02] sm:text-6xl">Выдай Снюсе заслуженное восхищение</h2>
        <button onClick={click} className="springy mx-auto mt-10 block rounded-full bg-rose px-8 py-7 font-display text-2xl font-black text-plum shadow-[0_10px_0_#e0528a] sm:px-14 sm:text-4xl">Снюся, ты великолепна!</button>
        <p key={comp} className="mt-8 min-h-[3rem] font-hand text-4xl text-rose" style={{ animation: 'bounceIn .4s' }}>{comp}</p>
        <p className="mt-4 font-display text-7xl font-black">{count}</p>
        <p className="opacity-80">единиц восхищения {next ? `· до «${next.t}» осталось ${next.at - count}` : '· все титулы собраны!'}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {ACHIEVEMENTS.map((a, i) => {
            const got = count >= a.at
            return (
              <div key={a.t} className={'w-44 rounded-[28px] border-2 p-4 transition duration-500 ' + (got ? 'border-rose bg-white text-plum' : 'border-white/30 text-white/50')} style={{ transform: `rotate(${[-4, 2, -2][i]}deg) scale(${got ? 1 : 0.95})` }}>
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lav-soft">{got ? (a.i === 'paw' ? <Paw s={34} c="#ffd3e4" /> : a.i === 'crown' ? <Star s={34} c="#f2c94c" /> : <Heart s={30} />) : <span className="font-display text-xl text-plum">?</span>}</div>
                <p className="mt-2 font-display text-sm font-bold leading-tight">{a.t}</p>
                <p className="text-xs">{a.at} нажатий</p>
              </div>
            )
          })}
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-3xl border-2 border-plum bg-white px-6 py-4 text-center text-plum shadow-2xl" style={{ animation: 'pop .5s' }}>
          <p className="text-sm font-bold">Достижение открыто!</p><p className="font-display text-xl font-black">{toast}</p>
        </div>
      )}
    </Reveal>
  )
}

/* ---------- финал ---------- */
function Finale() {
  return (
    <Reveal className="relative mx-auto max-w-6xl px-5 py-24">
      <div className="grid items-center gap-10 md:grid-cols-[1.3fr_1fr]">
        <div className="relative">
          <div className="tilt relative rotate-2 overflow-hidden rounded-[48px] border-8 border-white shadow-[0_30px_70px_rgba(74,33,96,.25)]">
            <img src={P(3)} alt="Снюся отдыхает у окна" className="aspect-[4/3] w-full object-cover" />
          </div>
          <Heart s={56} className="floaty absolute -left-4 -top-6" />
          <Star s={36} c="#c9a8f5" className="twinkle absolute -bottom-4 right-10" />
        </div>
        <div>
          <h2 className="font-display text-4xl font-black leading-[1.05] sm:text-6xl">В мире много кошек.<br /><span className="text-[#b26bd6]">А Снюся — одна.</span></h2>
          <p className="mt-4 font-hand text-3xl">Спасибо, что зашёл. Пол передаёт привет (то, что от него осталось).</p>
          <button onClick={() => window.scrollTo({ top: 0, behavior: document.documentElement.classList.contains('calm') ? 'auto' : 'smooth' })} className="springy mt-8 rounded-full bg-plum px-8 py-4 text-lg font-extrabold text-white shadow-[0_8px_0_#2b1038]">Ещё раз полюбоваться ↑</button>
        </div>
      </div>
      <p className="mt-20 text-center text-sm opacity-70">Сделано с любовью · ни один пол не пострадал (пострадали все)</p>
    </Reveal>
  )
}

/* ---------- секрет ---------- */
function Secret({ close }: { close: () => void }) {
  const { burst } = useFx()
  useEffect(() => { burst(window.innerWidth / 2, window.innerHeight / 2, 30, ['heart', 'star', 'paw']); const k = (e: KeyboardEvent) => e.key === 'Escape' && close(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, []) // eslint-disable-line
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-plum/80 p-4 backdrop-blur" onClick={close}>
      <div className="relative w-full max-w-md rotate-[-2deg] bg-white p-4 pb-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()} style={{ animation: 'pop .5s cubic-bezier(.34,1.8,.5,1)' }}>
        <span className="tape -top-3 left-1/2 -translate-x-1/2" />
        <img src={P(2)} alt="Снюся даёт пятюню" className="aspect-square w-full object-cover" />
        <p className="mt-3 font-display text-2xl font-black">Секретная пятюня!</p>
        <p className="font-hand text-2xl">Ты нашёл тайный архив. Снюся официально даёт тебе лапу. Никому не говори (а лучше — расскажи всем).</p>
        <button onClick={close} className="springy mt-4 rounded-full bg-plum px-6 py-3 font-extrabold text-white">Принять лапу</button>
      </div>
    </div>
  )
}

/* ---------- приложение ---------- */
export default function App() {
  const [calm, setCalm] = useStored('calm', false)
  const [pets, setPets] = useStored('pets', 0)
  const [likes, setLikes] = useStored<Record<number, boolean>>('likes', {})
  const [best, setBest] = useStored('best', 0)
  const [admire, setAdmire] = useStored('admire', 0)
  const [laser, setLaser] = useState(false)
  const [secret, setSecret] = useState(false)
  const [parts, setParts] = useState<Particle[]>([])
  const pid = useRef(0)
  const purr = usePurr()

  useEffect(() => { document.documentElement.classList.toggle('calm', calm) }, [calm])

  const burst = useCallback((x: number, y: number, n = 10, kinds = ['heart']) => {
    if (calm) n = Math.min(n, 0)
    const ps: Particle[] = Array.from({ length: n }).map(() => ({ id: ++pid.current, x: x + (Math.random() - 0.5) * 60, y: y + (Math.random() - 0.5) * 40, dx: (Math.random() - 0.5) * 220, rot: (Math.random() - 0.5) * 90, kind: kinds[Math.floor(Math.random() * kinds.length)], size: 16 + Math.random() * 22 }))
    setParts((p) => [...p, ...ps])
    setTimeout(() => setParts((p) => p.filter((x) => !ps.includes(x))), 1300)
  }, [calm])

  const colors = ['#e0528a', '#ffd3e4', '#c9a8f5', '#fff']
  return (
    <FxCtx.Provider value={{ burst, calm }}>
      <div className="font-body">
        <Nav calm={calm} setCalm={setCalm} purr={purr} laser={laser} setLaser={setLaser} />
        <Hero pets={pets} setPets={setPets} onSecret={() => setSecret(true)} />
        <Marquee />
        <Meet />
        <Mood />
        <Gallery likes={likes} setLikes={setLikes} />
        <Game best={best} setBest={setBest} />
        <Admire count={admire} setCount={setAdmire} />
        <Finale />
      </div>
      <div className="pointer-events-none fixed inset-0 z-[90]">
        {parts.map((p) => (
          <span key={p.id} className="particle absolute" style={{ left: p.x, top: p.y, ['--dx' as string]: p.dx + 'px', ['--rot' as string]: p.rot + 'deg', animation: 'rise 1.2s ease-out forwards' } as CSSProperties}>
            {p.kind === 'star' ? <Star s={p.size} c="#f2c94c" /> : p.kind === 'paw' ? <Paw s={p.size} c="#ffd3e4" /> : <Heart s={p.size} c={colors[p.id % colors.length]} />}
          </span>
        ))}
      </div>
      <Laser active={laser} />
      {secret && <Secret close={() => setSecret(false)} />}
    </FxCtx.Provider>
  )
}
