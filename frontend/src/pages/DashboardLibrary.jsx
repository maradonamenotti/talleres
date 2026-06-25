import React, { useEffect, useState } from 'react'
import api from '../api'
import TacticalPitch from '../components/TacticalPitch'
import { BookOpen, Search, ArrowLeft, ExternalLink, Calendar, User, Eye, RefreshCw, Film } from 'lucide-react'

export default function DashboardLibrary() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState(null)
  
  // Buscador y ordenamiento
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // 'date' | 'name'

  const fetchApprovedCases = async () => {
    setLoading(true)
    try {
      const response = await api.get('/tactical-cases/approved')
      setCases(response.data || [])
    } catch (err) {
      console.error('Error fetching approved cases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovedCases()
  }, [])

  // Extraer ID de Vimeo para el player
  const getVimeoId = (url) => {
    if (!url) return null
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|showcase\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/
    const match = url.match(regExp)
    return match ? match[4] : null
  }

  // Filtrado y ordenamiento de casos
  const filteredCases = cases.filter(c => {
    const term = searchTerm.toLowerCase()
    const studentName = (c.student?.full_name || '').toLowerCase()
    const club = (c.club_institution || '').toLowerCase()
    const problem = (c.difficulty_problem || '').toLowerCase()
    return studentName.includes(term) || club.includes(term) || problem.includes(term)
  })

  const sortedCases = [...filteredCases].sort((a, b) => {
    if (sortBy === 'name') {
      const nameA = (a.student?.full_name || '').toLowerCase()
      const nameB = (b.student?.full_name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    } else {
      // Ordenar por fecha de última actualización / aprobación (más recientes primero)
      const dateA = new Date(a.updated_at || a.created_at).getTime()
      const dateB = new Date(b.updated_at || b.created_at).getTime()
      return dateB - dateA
    }
  })

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '0.75rem', fontFamily: 'var(--font-body)', fontWeight: '500' }}>Cargando biblioteca de casos...</span>
      </div>
    )
  }

  return (
    <div className="main-content" style={{ maxWidth: selectedCase ? '1200px' : '960px' }}>
      
      {selectedCase ? (
        // DETALLE COMPLETO DEL CASO APROBADO
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <button className="btn btn-secondary" onClick={() => setSelectedCase(null)} style={{ marginBottom: '0.5rem' }}>
                <ArrowLeft size={16} /> Volver a la Biblioteca
              </button>
              <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)' }}>
                Ficha Técnica: {selectedCase.student?.full_name || 'Alumno'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Club: {selectedCase.club_institution || 'No especificado'}</span>
                <span>|</span>
                <span>Aprobado: {formatDate(selectedCase.updated_at)}</span>
              </p>
            </div>
            <div>
              <span className="badge badge-approved" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: '700' }}>
                Caso Aprobado
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedCase.vimeo_recording_url ? '1fr 1fr' : '1.2fr 1fr', gap: '2rem' }}>
            
            {/* LADO IZQUIERDO: DETALLES TÁCTICOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <h4 className="card-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>1. Contexto Competitivo</h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {selectedCase.competitive_context || 'Sin descripción.'}
                </p>
              </div>

              <div className="card">
                <h4 className="card-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>2. Lectura General del Plantel</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Fortalezas:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>{selectedCase.team_strengths || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Limitaciones:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>{selectedCase.team_limitations || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Funcionamiento:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>{selectedCase.team_functioning || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="card-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>3. Características de Jugadores Propios</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Puesto</th>
                        <th>Obligaciones</th>
                        <th>Posibilidades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCase.player_characteristics || []).map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>{row.puesto}</td>
                          <td>{row.obligaciones || '-'}</td>
                          <td>{row.posibilidades || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h4 className="card-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>4. Dificultad Principal</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Problema / Dificultad:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>{selectedCase.difficulty_problem || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Dudas / Consultas:</span>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                      {(selectedCase.difficulty_questions || []).map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Soluciones Pensadas:</span>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.2rem' }}>
                      {(selectedCase.difficulty_solutions || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* LADO DERECHO: PITCH Y VIDEO GRABACIÓN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* VIDEO DE PRESENTACIÓN (VIMEO EMBEDDED) */}
              {selectedCase.vimeo_recording_url && (
                <div className="card" style={{ border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(16, 185, 129, 0.02)' }}>
                  <h4 className="card-title" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '0.5rem' }}>
                    <Film size={18} /> Grabación de la Defensa del Caso
                  </h4>
                  {getVimeoId(selectedCase.vimeo_recording_url) ? (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#000', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)' }}>
                      <iframe 
                        src={`https://player.vimeo.com/video/${getVimeoId(selectedCase.vimeo_recording_url)}?h=0&title=0&byline=0&portrait=0`} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                        Enlace de grabación no compatible para reproductor integrado.
                      </p>
                      <a 
                        href={selectedCase.vimeo_recording_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="btn btn-primary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        Ver grabación externa <ExternalLink size={14} />
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="card">
                <h4 className="card-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>Alineación en la Cancha</h4>
                <TacticalPitch lineup={selectedCase.tactical_lineup || []} readOnly={true} />
              </div>

              {selectedCase.teacher_feedback && (
                <div className="card" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <h4 className="card-title" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>Devolución Técnica del Docente</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap', fontStyle: 'italic', lineHeight: '1.4' }}>
                    "{selectedCase.teacher_feedback}"
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        // BUSCADOR Y LISTADO EN GRID
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <BookOpen size={28} style={{ color: 'var(--color-accent)' }} /> Biblioteca de Casos
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Explora las resoluciones tácticas aprobadas por el equipo docente.
              </p>
            </div>
            <button className="btn btn-secondary" onClick={fetchApprovedCases}>
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>

          {/* BUSCADOR Y CONTROLES */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem', 
            background: 'var(--card-bg)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid var(--border-light)',
            backdropFilter: 'blur(12px)',
            flexWrap: 'wrap'
          }}>
            <div style={{ flexGrow: 1, position: 'relative', minWidth: '280px' }}>
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} 
              />
              <input 
                className="form-input"
                style={{ paddingLeft: '2.5rem', width: '100%', marginBottom: 0 }}
                placeholder="Buscar por alumno, club o problema táctico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Ordenar por:</span>
              <select 
                className="form-input" 
                style={{ width: 'auto', marginBottom: 0, cursor: 'pointer', paddingRight: '2rem' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Fecha de Aprobación</option>
                <option value="name">Nombre de Alumno</option>
              </select>
            </div>
          </div>

          {/* LISTADO EN GRID */}
          {sortedCases.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {sortedCases.map((c) => (
                <div 
                  key={c.id} 
                  className="card"
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                    height: '240px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.borderColor = 'var(--color-primary)'
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onClick={() => setSelectedCase(c)}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ 
                        fontFamily: 'var(--font-title)', 
                        fontWeight: '700', 
                        fontSize: '1.15rem', 
                        color: 'var(--color-text-main)' 
                      }}>
                        {c.student?.full_name || 'Alumno'}
                      </div>
                      {c.vimeo_recording_url && (
                        <span 
                          style={{ 
                            fontSize: '0.7rem', 
                            color: '#34d399', 
                            background: 'rgba(16, 185, 129, 0.08)', 
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: '600'
                          }}
                          title="Tiene grabación de video"
                        >
                          <Film size={10} /> Grabación
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <User size={12} /> Club: {c.club_institution || 'No especificado'}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Calendar size={12} /> Aprobado: {formatDate(c.updated_at)}
                      </span>
                    </div>

                    <p style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--color-text-main)', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      display: '-webkit-box', 
                      WebkitLineClamp: 3, 
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.4'
                    }}>
                      <strong>Dificultad:</strong> {c.difficulty_problem || 'Sin problema especificado.'}
                    </p>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    fontSize: '0.85rem', 
                    color: 'var(--color-primary-hover)', 
                    fontWeight: '600',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    paddingTop: '0.75rem',
                    marginTop: '1rem'
                  }}>
                    <Eye size={14} /> Ver análisis táctico completo
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', color: 'var(--color-text-muted)' }}>
              <BookOpen size={48} style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', opacity: '0.3' }} />
              <h3>No se encontraron casos aprobados</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {searchTerm ? 'Prueba refinando los términos de búsqueda.' : 'Las resoluciones aprobadas aparecerán aquí una vez que los docentes las validen.'}
              </p>
            </div>
          )}
        </div>
      )}
      
    </div>
  )
}
