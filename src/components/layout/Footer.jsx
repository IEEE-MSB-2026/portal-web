import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mail, MapPin, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-card)',
        borderTop: '1px solid var(--color-border)',
        paddingTop: 'var(--space-16)',
        paddingBottom: 'var(--space-12)',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-10)',
            marginBottom: 'var(--space-12)',
          }}
        >
          {/* Column 1: Brand & Mission */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div
                style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '0.75rem',
                }}
              >
                IEEE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.125rem',
                    fontWeight: 700,
                  }}
                >
                  IEEE MSB
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6875rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Menoufia University
                </span>
              </div>
            </div>
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.9375rem',
                lineHeight: 1.6,
                marginBottom: 'var(--space-4)',
              }}
            >
              Inspiring, innovating, connecting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} style={{ color: 'var(--color-primary)' }} />
                <span>Faculty of Electronic Engineering, Menouf</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} style={{ color: 'var(--color-primary)' }} />
                <span>contact@ieee-menoufia.org</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: 'var(--space-4)',
              }}
            >
              Navigation
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
              <li><Link to="/" style={{ transition: 'color var(--transition-fast)' }}>Home</Link></li>
              <li><Link to="/about" style={{ transition: 'color var(--transition-fast)' }}>About & Leadership</Link></li>
              <li><Link to="/committees" style={{ transition: 'color var(--transition-fast)' }}>Committees Overview</Link></li>
              <li><Link to="/events" style={{ transition: 'color var(--transition-fast)' }}>Conferences & Workshops</Link></li>
              <li><Link to="/announcements" style={{ transition: 'color var(--transition-fast)' }}>Official Newsfeed</Link></li>
              <li><Link to="/gallery" style={{ transition: 'color var(--transition-fast)' }}>Photo & Media Gallery</Link></li>
            </ul>
          </div>

          {/* Column 3: Official IEEE Links */}
          <div>
            <h4
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1rem',
                fontWeight: 700,
                marginBottom: 'var(--space-4)',
              }}
            >
              IEEE Global
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.9375rem', color: 'var(--color-text-muted)' }}>
              <li>
                <a href="https://www.ieee.org" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>IEEE.org</span>
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a href="https://ieeexplore.ieee.org" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>IEEE Xplore Digital Library</span>
                  <ExternalLink size={14} />
                </a>
              </li>
              <li>
                <a href="https://sac.ieee.org.eg/" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span>IEEE Egypt Section</span>
                  <ExternalLink size={14} />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>© {new Date().getFullYear()} IEEE Menoufia Student Branch (STB20451). All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            Built with pride by the IEEE Menoufia Webmaster
          </span>
        </div>
      </div>
    </footer>
  );
}
