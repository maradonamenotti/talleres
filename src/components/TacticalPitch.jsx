import React, { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check } from 'lucide-react'

export default function TacticalPitch({ lineup = [], onChange, readOnly = false }) {
  const pitchRef = useRef(null)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editNumber, setEditNumber] = useState('')
  const dragItem = useRef(null)

  // Pre-cargar posiciones por defecto de un 4-4-2 si el lineup inicial está vacío
  useEffect(() => {
    if (lineup.length === 0 && !readOnly) {
      const defaultPositions = [
        { id: '1', x: 50, y: 92, name: 'Arquero', number: '1' },
        { id: '2', x: 75, y: 75, name: 'Lateral Derecho', number: '4' },
        { id: '3', x: 60, y: 78, name: 'Central Derecho', number: '2' },
        { id: '4', x: 40, y: 78, name: 'Central Izquierdo', number: '6' },
        { id: '5', x: 25, y: 75, name: 'Lateral Izquierdo', number: '3' },
        { id: '6', x: 65, y: 55, name: 'Volante Derecho', number: '8' },
        { id: '7', x: 55, y: 58, name: 'Volante Central Der', number: '5' },
        { id: '8', x: 45, y: 58, name: 'Volante Central Izq', number: '10' },
        { id: '9', x: 35, y: 55, name: 'Volante Izquierdo', number: '11' },
        { id: '10', x: 55, y: 25, name: 'Delantero Derecho', number: '7' },
        { id: '11', x: 45, y: 25, name: 'Delantero Izquierdo', number: '9' }
      ]
      onChange(defaultPositions)
    }
  }, [lineup])

  // Manejar el inicio del arrastre
  const handleMouseDown = (e, player) => {
    if (readOnly) return
    e.preventDefault()
    setSelectedPlayerId(player.id)
    setEditName(player.name)
    setEditNumber(player.number)

    const rect = pitchRef.current.getBoundingClientRect()
    dragItem.current = {
      playerId: player.id,
      offsetX: e.clientX - (player.x * rect.width / 100),
      offsetY: e.clientY - (player.y * rect.height / 100)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Manejar el movimiento
  const handleMouseMove = (e) => {
    if (!dragItem.current) return
    const rect = pitchRef.current.getBoundingClientRect()
    
    // Calcular porcentaje de posición relativo al contenedor
    let x = ((e.clientX - dragItem.current.offsetX) / rect.width) * 100
    let y = ((e.clientY - dragItem.current.offsetY) / rect.height) * 100

    // Limitar al área de la cancha
    x = Math.max(5, Math.min(95, x))
    y = Math.max(5, Math.min(95, y))

    const updatedLineup = lineup.map(p => {
      if (p.id === dragItem.current.playerId) {
        return { ...p, x: Math.round(x), y: Math.round(y) }
      }
      return p
    })
    onChange(updatedLineup)
  }

  // Finalizar arrastre
  const handleMouseUp = () => {
    dragItem.current = null
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
  }

  // Agregar jugador personalizado
  const addNewPlayer = () => {
    if (readOnly) return
    const newId = Date.now().toString()
    const newPlayer = {
      id: newId,
      x: 50,
      y: 50,
      name: `Jugador ${lineup.length + 1}`,
      number: `${lineup.length + 1}`
    }
    const updated = [...lineup, newPlayer]
    onChange(updated)
    setSelectedPlayerId(newId)
    setEditName(newPlayer.name)
    setEditNumber(newPlayer.number)
  }

  // Eliminar jugador
  const deletePlayer = (id) => {
    if (readOnly) return
    const updated = lineup.filter(p => p.id !== id)
    onChange(updated)
    if (selectedPlayerId === id) {
      setSelectedPlayerId(null)
    }
  }

  // Guardar cambios en el nombre/número
  const savePlayerEdits = () => {
    if (!selectedPlayerId) return
    const updated = lineup.map(p => {
      if (p.id === selectedPlayerId) {
        return { ...p, name: editName, number: editNumber }
      }
      return p
    })
    onChange(updated)
  }

  const selectedPlayer = lineup.find(p => p.id === selectedPlayerId)

  return (
    <div className="tactical-pitch-container">
      <div className="pitch-side">
        <div className="pitch-canvas" ref={pitchRef}>
          {/* Líneas reglamentarias de la cancha */}
          <div className="pitch-line pitch-midline"></div>
          <div className="pitch-line pitch-center-circle"></div>
          <div className="pitch-line pitch-center-spot"></div>
          <div className="pitch-line pitch-penalty-top"></div>
          <div className="pitch-line pitch-penalty-bottom"></div>
          <div className="pitch-line pitch-goal-top"></div>
          <div className="pitch-line pitch-goal-bottom"></div>

          {/* Tokens de jugadores */}
          {lineup.map(player => (
            <div
              key={player.id}
              className="player-token"
              style={{
                left: `${player.x}%`,
                top: `${player.y}%`,
                boxShadow: selectedPlayerId === player.id ? '0 0 12px #10b981, 0 4px 8px rgba(0,0,0,0.5)' : '0 4px 8px rgba(0,0,0,0.4)',
                background: selectedPlayerId === player.id ? 'radial-gradient(circle at 30% 30%, #10b981, #047857)' : 'radial-gradient(circle at 30% 30%, #ef4444, #991b1b)'
              }}
              onMouseDown={(e) => handleMouseDown(e, player)}
            >
              {player.number}
              <div className="player-name-tag">{player.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="pitch-controls">
        <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-primary-hover)' }}>Alineación Táctica</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          {readOnly 
            ? 'Vista de lectura de la alineación táctica.' 
            : 'Arrastra las fichas en la cancha para definir sus posiciones. Haz clic en una ficha para editar su número y nombre.'}
        </p>

        {!readOnly && (
          <button className="btn btn-secondary" onClick={addNewPlayer} style={{ alignSelf: 'flex-start' }}>
            <Plus size={16} /> Agregar Jugador
          </button>
        )}

        {selectedPlayer && (
          <div className="card" style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-input)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h5 style={{ fontFamily: 'var(--font-title)' }}>Editar Ficha</h5>
              {!readOnly && (
                <button 
                  className="btn btn-secondary" 
                  onClick={() => deletePlayer(selectedPlayerId)} 
                  style={{ padding: '4px 8px', color: 'var(--color-error)' }}
                  title="Eliminar Jugador"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            
            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Dorsal / Número</label>
              <input
                className="form-input"
                style={{ padding: '0.5rem' }}
                value={editNumber}
                disabled={readOnly}
                onChange={(e) => {
                  setEditNumber(e.target.value)
                  onChange(lineup.map(p => p.id === selectedPlayerId ? { ...p, number: e.target.value } : p))
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Nombre del Puesto / Jugador</label>
              <input
                className="form-input"
                style={{ padding: '0.5rem' }}
                value={editName}
                disabled={readOnly}
                onChange={(e) => {
                  setEditName(e.target.value)
                  onChange(lineup.map(p => p.id === selectedPlayerId ? { ...p, name: e.target.value } : p))
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
