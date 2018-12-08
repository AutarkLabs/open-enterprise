import React from 'react'

class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    this.setState({ error: error, errorInfo: info })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state
      // You can render any custom fallback UI
      return (
        <div
          style={{
            margin: '20px auto',
            padding: '10px',
            background: 'white',
            border: '1px solid #555',
            borderRadius: '5px',
            width: '80%',
          }}
        >
          <h2 style={{ margin: 0 }}>{'Oh-no! Something went wrong'}</h2>
          <p style={{ color: 'red' }}>{error && error.toString()}</p>
          <div>Stacktrace:</div>
          <div style={{ color: 'red', marginTop: '10px' }}>
            {errorInfo &&
              errorInfo.componentStack
                .split('\n')
                .map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
