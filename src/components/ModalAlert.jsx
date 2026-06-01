import React from 'react'
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react'

export default function ModalAlert({ isOpen, onClose, title, message, type = 'info' }) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={44} style={{ color: 'var(--color-primary)' }} />
      case 'error':
        return <XCircle size={44} style={{ color: 'var(--color-error)' }} />
      default:
        return <AlertCircle size={44} style={{ color: 'var(--color-accent)' }} />
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'var(--color-primary)'
      case 'error':
        return 'var(--color-error)'
      default:
        return 'var(--color-accent)'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: `1px solid ${getBorderColor()}`,
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '420px',
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg), 0 0 25px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.target.style.color = 'var(--color-text-main)'}
          onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
        >
          <X size={18} />
        </button>

        {/* Icono */}
        <div style={{ marginBottom: '1.25rem' }}>
          {getIcon()}
        </div>

        {/* Título */}
        <h4 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'var(--color-text-main)',
          marginBottom: '0.75rem'
        }}>
          {title}
        </h4>

        {/* Mensaje */}
        <p style={{
          fontSize: '0.9rem',
          color: 'var(--color-text-muted)',
          lineHeight: '1.5',
          marginBottom: '1.75rem'
        }}>
          {message}
        </p>

        {/* Botón Aceptar */}
        <button 
          onClick={onClose}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.65rem',
            backgroundColor: getBorderColor(),
            color: type === 'error' ? 'white' : '#0b0f19',
            fontWeight: '700'
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
