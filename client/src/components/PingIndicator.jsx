import React, { useState, useEffect, useRef } from 'react';
import './PingIndicator.css';

export default function PingIndicator() {
  const [ping, setPing] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    const doPing = async () => {
      const start = performance.now();
      try {
        await fetch('/api/ping', { cache: 'no-store' });
        const ms = Math.round(performance.now() - start);
        setPing(ms);
      } catch {
        setPing(null);
      }
    };

    doPing();
    intervalRef.current = setInterval(doPing, 7000);

    return () => clearInterval(intervalRef.current);
  }, []);

  const getColor = () => {
    if (ping === null) return 'var(--text-muted)';
    if (ping < 100) return 'var(--green-400)';
    if (ping <= 300) return 'var(--yellow-400)';
    return 'var(--red-400)';
  };

  return (
    <div className="ping" title={`Latency: ${ping ?? '—'}ms`}>
      <span className="ping__dot" style={{ background: getColor() }} />
      <span className="ping__value" style={{ color: getColor() }}>
        {ping !== null ? `${ping}ms` : '—'}
      </span>
    </div>
  );
}
