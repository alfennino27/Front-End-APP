import React from 'react';

/**
 * Tanpa error boundary, satu error saat render bikin React meng-unmount SELURUH
 * app — layar jadi kosong / modal yang lagi dibuka hilang begitu saja tanpa jejak.
 * Boundary ini menahan error itu, menampilkan pesannya, dan menyimpan detail
 * terakhir di localStorage ('lastAppError') supaya bisa dicek belakangan.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('App error:', error, info?.componentStack);
    try {
      localStorage.setItem('lastAppError', JSON.stringify({
        message: String(error?.message || error),
        stack: String(error?.stack || '').slice(0, 2000),
        componentStack: String(info?.componentStack || '').slice(0, 2000),
        url: window.location.href,
        time: new Date().toISOString(),
      }));
    } catch (_) { /* localStorage penuh / private mode — abaikan */ }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
        <h4 style={{ marginBottom: '8px' }}>Terjadi error di halaman ini</h4>
        <p style={{ color: '#666', marginBottom: '12px' }}>
          Screenshot pesan di bawah ini lalu kirim ke tim IT, supaya bisa diperbaiki.
        </p>
        <pre style={{
          background: '#f6f6f6', border: '1px solid #ddd', borderRadius: '6px',
          padding: '12px', whiteSpace: 'pre-wrap', fontSize: '12px', maxHeight: '40vh',
          overflow: 'auto',
        }}>
          {String(this.state.error?.message || this.state.error)}
          {this.state.info?.componentStack || ''}
        </pre>
        <button
          className="btn btn-primary mt-2"
          onClick={() => window.location.reload()}
        >
          Muat Ulang Halaman
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
