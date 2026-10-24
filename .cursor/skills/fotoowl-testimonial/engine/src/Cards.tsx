import React from 'react';
import {Easing, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Card} from './types';
import {GOLD, INTER, MUTED, NAVY, popE, rr} from './util';

/*
  Pop-up cards (series-bible.md → Pop-ups). Every text/photo comes from edit.json props.
  Layout: top band (y 148 → max ≈ 580) so cards stay clear of the speaker's head.
  Styles: 'wide' (default) | 'chip' (compact alternative) | 'none'.
*/

const GOLD_TINT = 'rgba(244,186,68,0.20)';
export const CARD_LEFT = 56;
export const CARD_TOP = 148;
export const WIDE_W = 968;

/* ── shared animation + shell ── */
const useAnim = (tIn: number, tOut: number) => {
  const {fps} = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const a = rr(t, tIn, tIn + 0.42);
  const b = rr(t, tOut - 0.28, tOut, Easing.in(Easing.cubic));
  return {t, a, b, visible: t >= tIn && t <= tOut};
};
const shell = (a: number, b: number, width: number | 'auto', extra: React.CSSProperties = {}, radius = 34): React.CSSProperties => ({
  position: 'absolute', left: CARD_LEFT, top: CARD_TOP, width, background: '#fff', borderRadius: radius,
  boxShadow: '0 22px 50px rgba(20,28,44,0.22), 0 2px 8px rgba(20,28,44,0.10)', fontFamily: INTER, color: NAVY,
  opacity: a * (1 - b), transform: `translate(${(1 - a) * -30 - b * 12}px, ${(1 - a) * 12}px) scale(${0.97 + 0.03 * a})`,
  transformOrigin: 'left top', boxSizing: 'border-box', ...extra,
});

/* ── icons: 24-unit stroke icons (lucide-style) ── */
export const ICONS: Record<string, React.ReactNode> = {
  users: (<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  insta: (<><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></>),
  film: (<><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4" /></>),
  sparkle: (<><path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" /><path d="M20 3v4M22 5h-4" /></>),
  squareCheck: (<><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5" /><path d="m9 11 3 3L22 4" /></>),
  undo: (<><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11" /></>),
  circleCheck: (<><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>),
  arrow: <path d="M7 7h10v10M7 17 17 7" />,
  check: <path d="M20 6 9 17l-5-5" />,
  image: (<><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" /></>),
  search: (<><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>),
  camera: (<><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>),
  tv: (<><rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" /></>),
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  face: (<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>),
  share: (<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49" /></>),
  zap: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
};
const ROW_COLORS: Record<string, {tint: string; col: string}> = {
  chat: {tint: 'rgba(52,168,83,0.13)', col: '#2E9E4F'},
  insta: {tint: 'rgba(214,41,118,0.11)', col: '#C13584'},
};
export const Icon: React.FC<{name: string; size: number; color: string; sw?: number}> = ({name, size, color, sw = 2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {ICONS[name] ?? ICONS.sparkle}
  </svg>
);
const Tile: React.FC<{size: number; bg: string; children: React.ReactNode; radius?: number}> = ({size, bg, children, radius = 18}) => (
  <div style={{width: size, height: size, borderRadius: radius, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>{children}</div>
);
const Stars: React.FC<{size: number; p: number}> = ({size, p}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M42 18 C46 44 50 48 76 52 C50 56 46 60 42 86 C38 60 34 56 8 52 C34 48 38 44 42 18Z" fill={GOLD} transform={`translate(42 52) scale(${p}) translate(-42 -52)`} />
    <path d="M74 10 C76 22 78 24 90 26 C78 28 76 30 74 42 C72 30 70 28 58 26 C70 24 72 22 74 10Z" fill={GOLD} transform={`translate(74 26) scale(${Math.max(0, p * 1.15 - 0.15)}) translate(-74 -26)`} />
  </svg>
);
const photo = (p: string) => staticFile(p.includes('/') ? p : `photos/${p}.jpg`);

/* ───────── name lower-third ───────── */
export const LowerThird: React.FC<{name: string; studio?: string; tIn: number; tOut: number}> = ({name, studio, tIn, tOut}) => {
  const {a, b, visible, t} = useAnim(tIn, tOut);
  if (!visible) return null;
  const bar = rr(t, tIn + 0.15, tIn + 0.6);
  return (
    <div style={shell(a, b, 'auto', {padding: '22px 34px 22px 34px', display: 'flex', alignItems: 'center', gap: 22, maxWidth: 760}, 28)}>
      <div style={{width: 6, height: 70 * bar, borderRadius: 3, background: GOLD}} />
      <div>
        <div style={{fontWeight: 700, fontSize: 38, letterSpacing: '-0.02em', lineHeight: 1.1, whiteSpace: 'nowrap'}}>{name}</div>
        {studio && <div style={{fontWeight: 500, fontSize: 26, opacity: 0.66, marginTop: 6, whiteSpace: 'nowrap'}}>{studio}</div>}
      </div>
    </div>
  );
};

/* ───────── stat (e.g. "Using FotoOwl for · almost 4–5 years") ───────── */
const StatCard: React.FC<{c: Card}> = ({c}) => {
  const {a, b, visible, t} = useAnim(c.tIn, c.tOut);
  if (!visible) return null;
  const line = rr(t, c.tIn + 0.3, c.tIn + 0.9);
  return (
    <div style={shell(a, b, 'auto', {padding: '26px 34px 28px 30px', maxWidth: 760}, 28)}>
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        {c.props.icon !== false && <Img src={staticFile('brand/logo-icon.png')} style={{width: 46, height: 46, objectFit: 'contain'}} />}
        <div style={{fontWeight: 600, fontSize: 22, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6, whiteSpace: 'nowrap'}}>{c.props.eyebrow}</div>
      </div>
      <div style={{fontWeight: 800, fontSize: 50, letterSpacing: '-0.03em', marginTop: 14, lineHeight: 1, whiteSpace: 'nowrap'}}>{c.props.value}</div>
      <div style={{height: 5, width: `${line * 46}%`, background: GOLD, borderRadius: 3, marginTop: 16}} />
    </div>
  );
};

/* ───────── AI Culling ───────── */
const CullingCard: React.FC<{c: Card}> = ({c}) => {
  const {tIn, tOut} = c;
  const {t, a, b, visible} = useAnim(tIn, tOut);
  if (!visible) return null;
  const P = {title: 'AI Culling', subtitle: 'Selecting your best shots', photos: ['bride', 'groom', 'mehndi'], countPhoto: 'flowers', count: 472, ...c.props};
  const stars = rr(t, tIn + 0.15, tIn + 0.55, popE);
  const bar = 0.08 + 0.66 * rr(t, tIn + 0.3, tOut - 0.2, Easing.bezier(0.3, 0.1, 0.3, 1));
  const count = Math.round(P.count * rr(t, tIn + 0.35, tIn + 1.1, Easing.out(Easing.cubic)));
  const dots = '.'.repeat(1 + (Math.floor(t * 4) % 3));
  const sparks = rr(t, tIn + 0.25, tIn + 0.5);
  return (
    <div style={shell(a, b, WIDE_W, {padding: '26px 26px 26px 28px', display: 'flex', alignItems: 'center', gap: 22})}>
      <svg width={70} height={70} style={{position: 'absolute', left: -30, top: -42, opacity: sparks}} viewBox="0 0 70 70">
        <path d="M14 40 L30 54" stroke={GOLD} strokeWidth={7} strokeLinecap="round" />
        <path d="M40 14 L46 36" stroke={GOLD} strokeWidth={7} strokeLinecap="round" />
      </svg>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          <Tile size={84} bg={GOLD_TINT} radius={22}><Stars size={58} p={stars} /></Tile>
          <div>
            <div style={{fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05}}>{P.title}</div>
            <div style={{fontSize: 23, fontWeight: 500, color: MUTED, marginTop: 6, whiteSpace: 'nowrap'}}>
              {P.subtitle}<span style={{display: 'inline-block', width: 24, textAlign: 'left'}}>{dots}</span>
            </div>
          </div>
        </div>
        <div style={{marginTop: 22, height: 16, borderRadius: 8, background: '#E9EAEE', overflow: 'hidden'}}>
          <div style={{height: '100%', width: `${bar * 100}%`, borderRadius: 8, background: `linear-gradient(90deg, ${GOLD}, #F7C657)`}} />
        </div>
      </div>
      <div style={{display: 'flex', gap: 10}}>
        {(P.photos as string[]).slice(0, 3).map((p, i) => {
          const q = rr(t, tIn + 0.2 + i * 0.09, tIn + 0.6 + i * 0.09);
          return (
            <div key={p + i} style={{width: 96, height: 136, borderRadius: 15, overflow: 'hidden', opacity: q, transform: `translateY(${(1 - q) * 14}px) scale(${0.92 + 0.08 * q})`}}>
              <Img src={photo(p)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '18% 50%'}} />
            </div>
          );
        })}
        {(() => {
          const q = rr(t, tIn + 0.47, tIn + 0.87);
          return (
            <div style={{width: 96, height: 136, borderRadius: 15, overflow: 'hidden', position: 'relative', opacity: q, transform: `translateY(${(1 - q) * 14}px)`}}>
              <Img src={photo(P.countPhoto)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '20% 70%', filter: 'blur(5px) brightness(0.6) saturate(0.6)', transform: 'scale(1.15)'}} />
              <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, lineHeight: 1.05}}>
                <div style={{fontSize: 34}}>+</div>
                <div style={{fontSize: 28}}>{count}</div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

/* ───────── Studio Manager (title + list rows) ───────── */
const StudioManagerCard: React.FC<{c: Card}> = ({c}) => {
  const {tIn, tOut} = c;
  const {t, a, b, visible} = useAnim(tIn, tOut);
  if (!visible) return null;
  const P = {
    title: 'Studio Manager', subtitle: 'Your leads, all in one place', icon: 'users',
    rows: [
      {icon: 'chat', title: 'New WhatsApp Lead', sub: 'Wedding Photography Enquiry'},
      {icon: 'insta', title: 'New Instagram Lead', sub: 'Wedding Shoot Enquiry'},
    ],
    ...c.props,
  };
  const ok = rr(t, tIn + 0.55, tIn + 0.85, popE);
  return (
    <div style={shell(a, b, WIDE_W, {padding: '26px 34px 22px'})}>
      <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
        <Tile size={78} bg={GOLD_TINT} radius={20}><Icon name={P.icon} size={40} color="#B07A12" /></Tile>
        <div style={{flex: 1}}>
          <div style={{fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05}}>{P.title}</div>
          <div style={{fontSize: 25, fontWeight: 500, color: MUTED, marginTop: 6}}>{P.subtitle}</div>
        </div>
        <div style={{transform: `scale(${ok})`, opacity: Math.min(1, ok * 1.5)}}><Icon name="circleCheck" size={46} color="#3C9A50" sw={2.2} /></div>
      </div>
      <div style={{height: 2, background: '#ECEDF0', margin: '20px 0 8px'}} />
      {(P.rows as {icon: string; title: string; sub?: string}[]).slice(0, 3).map((r, i) => {
        const q = rr(t, tIn + 0.28 + i * 0.14, tIn + 0.7 + i * 0.14);
        const col = ROW_COLORS[r.icon] ?? {tint: GOLD_TINT, col: '#B07A12'};
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, padding: '10px 0', opacity: q, transform: `translateX(${(1 - q) * 22}px)`}}>
            <Tile size={70} bg={col.tint} radius={18}><Icon name={r.icon} size={34} color={col.col} /></Tile>
            <div style={{flex: 1}}>
              <div style={{fontSize: 32, fontWeight: 600, letterSpacing: '-0.015em'}}>{r.title}</div>
              {r.sub && <div style={{fontSize: 23, fontWeight: 500, color: MUTED, marginTop: 4}}>{r.sub}</div>}
            </div>
            <Icon name="arrow" size={28} color="#8A90A0" />
          </div>
        );
      })}
    </div>
  );
};

/* ───────── Clients select (photo grid with ticks + status footer) ───────── */
const Badge: React.FC<{on: number}> = ({on}) => (
  <div style={{position: 'absolute', right: '1.2%', top: '1.4%', width: '26.5%', aspectRatio: '1 / 1', borderRadius: '50%', background: on > 0.01 ? GOLD : 'rgba(255,255,255,0.92)', border: `3px solid ${on > 0.01 ? '#fff' : 'rgba(255,255,255,0.95)'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.18 * Math.sin(Math.min(1, on) * Math.PI)})`}}>
    {on > 0.01 && <div style={{transform: `scale(${on})`}}><Icon name="check" size={26} color={NAVY} sw={3.4} /></div>}
  </div>
);
const ClientsCard: React.FC<{c: Card}> = ({c}) => {
  const {tIn, tOut} = c;
  const {t, a, b, visible} = useAnim(tIn, tOut);
  if (!visible) return null;
  const P = {
    title: 'Clients select', subtitle: 'They mark album photos. The list comes back to you.', showLogo: true,
    photos: [{src: 'couple1', selected: true}, {src: 'bride', selected: true}, {src: 'decor', selected: false}, {src: 'couple2', selected: true}, {src: 'groom', selected: true}],
    countText: '12 photos', footer: 'selected by client', status: 'Received',
    ...c.props,
  };
  let k = 0;
  const foot = rr(t, tIn + 1.15, tIn + 1.5);
  const recv = rr(t, tIn + 1.45, tIn + 1.75, popE);
  return (
    <div style={shell(a, b, WIDE_W, {padding: '24px 26px 22px'})}>
      <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 74, height: 74, borderRadius: 37, background: 'rgba(46,58,80,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}><Icon name="squareCheck" size={36} color={NAVY} sw={2.2} /></div>
        <div style={{flex: 1}}>
          <div style={{fontSize: 40, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05}}>{P.title}</div>
          <div style={{fontSize: 23, fontWeight: 500, color: MUTED, marginTop: 6}}>{P.subtitle}</div>
        </div>
        {P.showLogo && <Img src={staticFile('brand/logo-full.png')} style={{width: 168, height: 'auto', alignSelf: 'flex-start', marginTop: 6}} />}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 14, padding: 10, borderRadius: 20, background: '#F6F7FA', border: '1.5px solid #ECEDF2'}}>
        {(P.photos as {src: string; selected: boolean}[]).slice(0, 5).map((ph, i) => {
          const q = rr(t, tIn + 0.15 + i * 0.06, tIn + 0.5 + i * 0.06);
          const on = ph.selected ? rr(t, tIn + 0.55 + k++ * 0.15, tIn + 0.8 + (k - 1) * 0.15, Easing.out(Easing.back(2))) : 0;
          return (
            <div key={ph.src + i} style={{position: 'relative', aspectRatio: '1 / 0.9', borderRadius: 16, overflow: 'hidden', opacity: q, transform: `scale(${0.92 + 0.08 * q})`}}>
              <Img src={photo(ph.src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              <Badge on={on} />
            </div>
          );
        })}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 12, padding: '10px 16px', borderRadius: 20, border: '1.5px solid #ECEDF2', opacity: foot, transform: `translateY(${(1 - foot) * 10}px)`}}>
        <div style={{width: 52, height: 52, borderRadius: 26, background: 'rgba(46,58,80,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icon name="undo" size={26} color={NAVY} /></div>
        <div style={{flex: 1, fontSize: 27, fontWeight: 500}}><span style={{fontWeight: 800}}>{P.countText}</span> {P.footer}</div>
        {P.status && (
          <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 999, background: 'rgba(60,154,80,0.12)', color: '#2F8A45', fontWeight: 700, fontSize: 24, transform: `scale(${recv})`, opacity: Math.min(1, recv * 1.5)}}>
            <Icon name="check" size={22} color="#2F8A45" sw={3} /> {P.status}
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────── New Upgrades (badge + feature rows) ───────── */
const UpgradesCard: React.FC<{c: Card}> = ({c}) => {
  const {tIn, tOut} = c;
  const {t, a, b, visible} = useAnim(tIn, tOut);
  if (!visible) return null;
  const P = {title: 'New Upgrades', badge: 'NEW', rows: [{icon: 'sparkle', label: 'AI Studio'}, {icon: 'users', label: 'Studio Manager'}, {icon: 'film', label: 'Reelit'}], ...c.props};
  const widths = [0.62, 0.86, 0.62, 0.74];
  const pill = rr(t, tIn + 0.2, tIn + 0.5, popE);
  return (
    <div style={shell(a, b, 640, {padding: '28px 34px 26px'})}>
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18}}>
        <div style={{fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em'}}>{P.title}</div>
        {P.badge && <div style={{background: GOLD, color: NAVY, fontWeight: 800, fontSize: 22, letterSpacing: '0.06em', padding: '7px 16px', borderRadius: 999, transform: `scale(${pill})`}}>{P.badge}</div>}
      </div>
      {(P.rows as {icon: string; label: string}[]).slice(0, 4).map((r, i) => {
        const q = rr(t, tIn + 0.28 + i * 0.14, tIn + 0.68 + i * 0.14);
        const bar = rr(t, tIn + 0.38 + i * 0.14, tIn + 0.9 + i * 0.14);
        return (
          <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 20, marginTop: i ? 14 : 0, opacity: q, transform: `translateX(${(1 - q) * 18}px)`}}>
            <Tile size={52} bg={GOLD_TINT} radius={12}><Icon name={r.icon} size={28} color="#B07A12" /></Tile>
            <div style={{flex: 1, paddingTop: 2}}>
              <div style={{height: 12, width: `${widths[i] * 100 * bar}%`, borderRadius: 6, background: '#4A5568'}} />
              <div style={{fontSize: 27, fontWeight: 500, color: MUTED, marginTop: 8}}>{r.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────── generic feature card (any feature without its own design) ───────── */
const FeatureCard: React.FC<{c: Card}> = ({c}) => {
  const {tIn, tOut} = c;
  const {t, a, b, visible} = useAnim(tIn, tOut);
  if (!visible) return null;
  const P = {icon: 'sparkle', title: 'Feature', description: '', badge: '', photos: [] as string[], image: '', showLogo: false, ...c.props};
  const ic = rr(t, tIn + 0.12, tIn + 0.5, popE);
  const hasMedia = P.image || P.photos.length;
  return (
    <div style={shell(a, b, WIDE_W, {padding: '26px 30px', display: 'flex', alignItems: 'center', gap: 24})}>
      <Tile size={84} bg={GOLD_TINT} radius={22}><div style={{transform: `scale(${ic})`}}><Icon name={P.icon} size={44} color="#B07A12" /></div></Tile>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <div style={{fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05}}>{P.title}</div>
          {P.badge && <div style={{background: GOLD, color: NAVY, fontWeight: 800, fontSize: 20, letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 999}}>{P.badge}</div>}
        </div>
        {P.description && <div style={{fontSize: 25, fontWeight: 500, color: MUTED, marginTop: 8, lineHeight: 1.3}}>{P.description}</div>}
      </div>
      {P.image ? (
        <Img src={staticFile(P.image)} style={{height: 150, maxWidth: 300, objectFit: 'contain', borderRadius: 14, boxShadow: '0 4px 14px rgba(20,28,44,0.14)'}} />
      ) : P.photos.length ? (
        <div style={{display: 'flex', gap: 10}}>
          {P.photos.slice(0, 3).map((p, i) => {
            const q = rr(t, tIn + 0.2 + i * 0.09, tIn + 0.6 + i * 0.09);
            return (
              <div key={p + i} style={{width: 96, height: 136, borderRadius: 15, overflow: 'hidden', opacity: q, transform: `translateY(${(1 - q) * 14}px)`}}>
                <Img src={photo(p)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '18% 50%'}} />
              </div>
            );
          })}
        </div>
      ) : P.showLogo ? (
        <Img src={staticFile('brand/logo-full.png')} style={{width: 168, height: 'auto', alignSelf: 'flex-start'}} />
      ) : null}
      {!hasMedia && null}
    </div>
  );
};

/* ───────── real product screenshot in a clean frame ───────── */
const ScreenshotCard: React.FC<{c: Card}> = ({c}) => {
  const {tIn, tOut} = c;
  const {a, b, visible} = useAnim(tIn, tOut);
  if (!visible) return null;
  const P = {title: '', caption: '', image: '', maxH: 360, ...c.props};
  return (
    <div style={shell(a, b, 'auto', {padding: 18, maxWidth: WIDE_W}, 30)}>
      {P.title && <div style={{fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '4px 8px 14px'}}>{P.title}</div>}
      <Img src={staticFile(P.image)} style={{display: 'block', maxHeight: P.maxH, maxWidth: WIDE_W - 36, borderRadius: 18, objectFit: 'contain'}} />
      {P.caption && <div style={{fontSize: 23, fontWeight: 500, color: MUTED, margin: '12px 8px 2px'}}>{P.caption}</div>}
    </div>
  );
};

/* ───────── chip (compact alternative for any card) ───────── */
const chipText = (c: Card): {icon: string; title: string; sub: string} => {
  const p = c.props;
  switch (c.type) {
    case 'stat': return {icon: 'heart', title: p.value, sub: p.eyebrow};
    case 'culling': return {icon: 'sparkle', title: p.title ?? 'AI Culling', sub: p.subtitle ?? 'Selecting your best shots'};
    case 'studioManager': return {icon: 'users', title: p.title ?? 'Studio Manager', sub: p.subtitle ?? 'Your leads, all in one place'};
    case 'clients': return {icon: 'squareCheck', title: p.title ?? 'Clients select', sub: `${p.countText ?? '12 photos'} ${p.footer ?? 'selected by client'}`};
    case 'upgrades': return {icon: 'zap', title: p.title ?? 'New Upgrades', sub: (p.rows ?? [{label: 'AI Studio'}, {label: 'Studio Manager'}, {label: 'Reelit'}]).map((r: {label: string}) => r.label).join(' · ')};
    default: return {icon: p.icon ?? 'sparkle', title: p.title ?? '', sub: p.description ?? p.caption ?? ''};
  }
};
const ChipCard: React.FC<{c: Card}> = ({c}) => {
  const {t, a, b, visible} = useAnim(c.tIn, c.tOut);
  if (!visible) return null;
  const x = chipText(c);
  const ic = rr(t, c.tIn + 0.1, c.tIn + 0.45, popE);
  return (
    <div style={shell(a, b, 'auto', {padding: '16px 30px 16px 16px', display: 'flex', alignItems: 'center', gap: 18, maxWidth: WIDE_W}, 999)}>
      <Tile size={64} bg={GOLD_TINT} radius={32}><div style={{transform: `scale(${ic})`}}><Icon name={x.icon} size={32} color="#B07A12" /></div></Tile>
      <div style={{minWidth: 0}}>
        <div style={{fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', whiteSpace: 'nowrap'}}>{x.title}</div>
        {x.sub && <div style={{fontSize: 21, fontWeight: 500, color: MUTED, marginTop: 2, whiteSpace: 'nowrap'}}>{x.sub}</div>}
      </div>
    </div>
  );
};

const WIDE: Record<string, React.FC<{c: Card}>> = {
  stat: StatCard, culling: CullingCard, studioManager: StudioManagerCard, clients: ClientsCard,
  upgrades: UpgradesCard, feature: FeatureCard, screenshot: ScreenshotCard,
};

export const CardLayer: React.FC<{cards: Card[]; style: 'wide' | 'chip' | 'none'}> = ({cards, style}) => {
  if (style === 'none') return null;
  return (
    <>
      {cards.map((c, i) => {
        // stat + screenshot keep their own look even in chip mode (they are already compact / real UI)
        const Comp = style === 'chip' && c.type !== 'screenshot' ? ChipCard : WIDE[c.type] ?? FeatureCard;
        return <Comp key={i} c={c} />;
      })}
    </>
  );
};
