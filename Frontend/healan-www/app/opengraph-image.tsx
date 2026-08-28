import { ImageResponse } from 'next/og';

export const alt = 'دکتر معصومه شهرویی؛ متخصص قلب و عروق و درمان واریس در شوشتر';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: '#f4f5f7', color: '#1a1a1a', fontFamily: 'sans-serif' }}>
      <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: 999, background: '#c6e000', opacity: .28, left: -130, top: -180 }} />
      <div style={{ position: 'absolute', width: 360, height: 360, borderRadius: 999, border: '70px solid #c6e000', opacity: .14, right: -100, bottom: -150 }} />
      <div style={{ width: '100%', padding: '76px 86px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ width: 58, height: 58, borderRadius: 18, background: '#c6e000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>+</div><div style={{ display: 'flex', flexDirection: 'column' }}><strong style={{ fontSize: 25 }}>Cardiovascular Clinic</strong><span style={{ fontSize: 18, color: '#5f6368' }}>Shushtar</span></div></div>
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 940 }}><h1 style={{ margin: 0, fontSize: 58, lineHeight: 1.35 }}>Dr. Masoumeh Shahrooei</h1><p style={{ margin: '14px 0 0', fontSize: 31, color: '#43474d' }}>Cardiology &amp; Varicose Vein Care</p></div>
        <div style={{ display: 'flex', gap: 12 }}><span style={{ padding: '11px 19px', borderRadius: 999, background: '#1a1a1a', color: '#fff', fontSize: 17 }}>drshahrooei.ir</span><span style={{ padding: '11px 19px', borderRadius: 999, background: '#e8edbd', fontSize: 17 }}>Online appointments</span></div>
      </div>
    </div>,
    size
  );
}
