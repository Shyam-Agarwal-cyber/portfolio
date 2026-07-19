import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

export const runtime = 'edge';
export const alt = 'Shyam Agarwal — Backend Software Engineer';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0A0A0B',
        padding: '72px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: '#2DD4BF' }} />
        <div style={{ color: '#9A9AA3', fontSize: 26 }}>{site.role}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ color: '#EDEDEF', fontSize: 74, fontWeight: 700, letterSpacing: -2 }}>
          {site.name}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            color: '#EDEDEF',
            fontSize: 40,
            fontWeight: 600,
            marginTop: 12,
          }}
        >
          <span>Backend systems that stay fast</span>
          <span style={{ color: '#2DD4BF' }}>under production load.</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 48 }}>
        {[
          ['9M+', 'events / day'],
          ['4s → 500ms', 'p99 latency'],
          ['Rs 22.8L', 'cost saved'],
        ].map(([v, l]) => (
          <div key={l} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#2DD4BF', fontSize: 40, fontWeight: 700 }}>{v}</div>
            <div style={{ color: '#63636B', fontSize: 22 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
