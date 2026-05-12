import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class DataErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Data error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#0e0e0e',
          color: '#ffffff',
          height: '100%'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Oops! Something went wrong</h2>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            We encountered an error while displaying game data.
            This might be due to a recent update or a network issue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'var(--color-ally-accent)',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
