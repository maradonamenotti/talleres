import React, { useEffect, useState } from 'react'
import api from '../api'
import TacticalPitch from '../components/TacticalPitch'
import ModalAlert from '../components/ModalAlert'
import { FileText, Save, Send, Eye, Award, ExternalLink, RefreshCw, Plus, Trash2, Video, Calendar } from 'lucide-react'

export default function DashboardStudent({ user, profile, activeSubTab, setActiveSubTab, wantsToExpose, setWantsToExpose }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [caseData, setCaseData] = useState(null)

  // Estados para el flujo de reprogramación/confirmación de tutoría
  const [showRescheduleForm, setShowRescheduleForm] = useState(false)
  const [rescheduleComment, setRescheduleComment] = useState('')
  const [submittingScheduleResponse, setSubmittingScheduleResponse] = useState(false)

  // Estados para salas de Meet e inscripciones oyentes
  const [rooms, setRooms] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [registeringRoomId, setRegisteringRoomId] = useState(null)

  // Estados para alertas custom
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('info')
  
  // Datos locales del formulario
  const [clubInstitution, setClubInstitution] = useState('')
  const [studentWhatsapp, setStudentWhatsapp] = useState('')
  const [competitiveContext, setCompetitiveContext] = useState('')
  const [teamStrengths, setTeamStrengths] = useState('')
  const [teamLimitations, setTeamLimitations] = useState('')
  const [teamFunctioning, setTeamFunctioning] = useState('')
  
  // Características de jugadores (JSON array of {puesto, obligaciones, posibilidades})
  const [playerCharacteristics, setPlayerCharacteristics] = useState([
    { puesto: 'Arquero', obligaciones: '', posibilidades: '' },
    { puesto: 'Central derecho', obligaciones: '', posibilidades: '' },
    { puesto: 'Central izquierdo', obligaciones: '', posibilidades: '' },
    { puesto: 'Lateral / carrilero', obligaciones: '', posibilidades: '' },
    { puesto: 'Volante central', obligaciones: '', posibilidades: '' },
    { puesto: 'Interior / extremo', obligaciones: '', posibilidades: '' },
    { puesto: 'Delantero', obligaciones: '', posibilidades: '' },
    { puesto: 'Jugador clave', obligaciones: '', posibilidades: '' }
  ])

  // Dificultades
  const [difficultyProblem, setDifficultyProblem] = useState('')
  const [difficultyQuestions, setDifficultyQuestions] = useState(['', ''])
  const [difficultySolutions, setDifficultySolutions] = useState([''])

  // Video
  const [videoOption, setVideoOption] = useState('A') // 'A' o 'B'
  const [videoCuts, setVideoCuts] = useState([
    { link: '', problema: '' },
    { link: '', problema: '' }
  ])
  const [videoFullMatch, setVideoFullMatch] = useState({
    link: '',
    fragments: [
      { desde: '', hasta: '', motivo: '' }
    ]
  })

  // Alineación táctica
  const [tacticalLineup, setTacticalLineup] = useState([])

  // Cargar todos los datos del alumno (ficha, salas de meet, inscripciones)
  const fetchStudentData = async () => {
    setLoading(true)
    try {
      // 1. Cargar caso del alumno
      const caseRes = await api.get('/tactical-cases/my-case')
      const caseDataObj = caseRes.data

      if (caseDataObj) {
        setCaseData(caseDataObj)
        setClubInstitution(caseDataObj.club_institution || '')
        setStudentWhatsapp(caseDataObj.student_whatsapp || '')
        setCompetitiveContext(caseDataObj.competitive_context || '')
        setTeamStrengths(caseDataObj.team_strengths || '')
        setTeamLimitations(caseDataObj.team_limitations || '')
        setTeamFunctioning(caseDataObj.team_functioning || '')
        if (caseDataObj.player_characteristics && caseDataObj.player_characteristics.length > 0) {
          setPlayerCharacteristics(caseDataObj.player_characteristics)
        }
        setDifficultyProblem(caseDataObj.difficulty_problem || '')
        setDifficultyQuestions(caseDataObj.difficulty_questions || ['', ''])
        setDifficultySolutions(caseDataObj.difficulty_solutions || [''])
        setVideoOption(caseDataObj.video_option || 'A')
        if (caseDataObj.video_cuts && caseDataObj.video_cuts.length > 0) {
          setVideoCuts(caseDataObj.video_cuts)
        }
        if (caseDataObj.video_full_match && Object.keys(caseDataObj.video_full_match).length > 0) {
          setVideoFullMatch(caseDataObj.video_full_match)
        }
        setTacticalLineup(caseDataObj.tactical_lineup || [])
        setWantsToExpose(true) // Si tiene caso creado, quiere exponer
      } else {
        setCaseData(null)
      }

      // 2. Cargar salas de Meet activas
      const roomsRes = await api.get('/meet-rooms')
      setRooms(roomsRes.data || [])

      // 3. Cargar inscripciones de este alumno
      const regsRes = await api.get('/meet-rooms/registrations')
      setRegistrations(regsRes.data || [])

    } catch (err) {
      console.error('Error fetching student data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateScheduleStatus = async (status, comment = '') => {
    if (!caseData) return
    setSubmittingScheduleResponse(true)
    try {
      const response = await api.post('/tactical-cases', {
        meet_schedule_status: status,
        student_schedule_comment: comment
      })
      const data = response.data

      setCaseData(data)
      setShowRescheduleForm(false)
      setRescheduleComment('')
      
      setAlertTitle(status === 'accepted' ? 'Asistencia Confirmada' : 'Reprogramación Solicitada')
      setAlertMessage(status === 'accepted' 
        ? 'Has aceptado el horario propuesto. El docente ya ha sido notificado.' 
        : 'Tu solicitud de reprogramación fue enviada con éxito. El docente revisará tu propuesta.'
      )
      setAlertType('success')
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage(err.message || 'Error al actualizar el estado del horario.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setSubmittingScheduleResponse(false)
    }
  }

  const handleRegisterRoom = async (roomId) => {
    setRegisteringRoomId(roomId)
    try {
      await api.post(`/meet-rooms/${roomId}/register`)

      setAlertTitle('Inscripción Exitosa')
      setAlertMessage('Te has inscripto como oyente a la sala de Meet. Podrás unirte en el horario programado.')
      setAlertType('success')
      setAlertOpen(true)
      
      // Actualizar inscripciones
      const regsRes = await api.get('/meet-rooms/registrations')
      setRegistrations(regsRes.data || [])

    } catch (err) {
      console.error('Error registering for room:', err)
      setAlertTitle('Error')
      setAlertMessage(err.message || 'No se pudo realizar la inscripción.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setRegisteringRoomId(null)
    }
  }

  const handleUnregisterRoom = async (roomId) => {
    if (!confirm('¿Estás seguro de que quieres cancelar tu inscripción a esta sala?')) return
    setRegisteringRoomId(roomId)
    try {
      await api.delete(`/meet-rooms/${roomId}/register`)

      setAlertTitle('Inscripción Cancelada')
      setAlertMessage('Se ha cancelado tu inscripción como oyente a esta sala.')
      setAlertType('info')
      setAlertOpen(true)

      // Actualizar inscripciones
      const regsRes = await api.get('/meet-rooms/registrations')
      setRegistrations(regsRes.data || [])

    } catch (err) {
      console.error('Error unregistering from room:', err)
      setAlertTitle('Error')
      setAlertMessage(err.message || 'No se pudo cancelar la inscripción.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setRegisteringRoomId(null)
    }
  }

  useEffect(() => {
    fetchStudentData()
  }, [user.id])

  const handleSave = async (submitStatus = 'draft') => {
    setSaving(true)
    const payload = {
      student_id: user.id,
      club_institution: clubInstitution,
      student_whatsapp: studentWhatsapp,
      competitive_context: competitiveContext,
      team_strengths: teamStrengths,
      team_limitations: teamLimitations,
      team_functioning: teamFunctioning,
      player_characteristics: playerCharacteristics,
      difficulty_problem: difficultyProblem,
      difficulty_questions: difficultyQuestions.filter(q => q.trim() !== ''),
      difficulty_solutions: difficultySolutions.filter(s => s.trim() !== ''),
      video_option: videoOption,
      video_cuts: videoCuts,
      video_full_match: videoFullMatch,
      tactical_lineup: tacticalLineup,
      status: submitStatus,
      updated_at: new Date().toISOString()
    }

    try {
      await api.post('/tactical-cases', payload)
      
      setAlertTitle(submitStatus === 'submitted' ? 'Ficha Enviada' : 'Ficha Guardada')
      setAlertMessage(submitStatus === 'submitted' ? 'Tu ficha táctica ha sido enviada con éxito para la revisión de los docentes.' : 'Tus cambios han sido guardados como borrador.')
      setAlertType('success')
      setAlertOpen(true)
      await fetchStudentData()
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage('Ocurrió un error al intentar guardar tu ficha táctica.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setSaving(false)
    }
  }

  // activeSubTab y wantsToExpose son provistos por App.jsx como props para sincronizar con el menú lateral

  // Deshabilitar edición si está enviado o aprobado
  const isReadOnly = caseData && (caseData.status === 'submitted' || caseData.status === 'approved')

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '0.75rem' }}>Cargando ficha táctica...</span>
      </div>
    )
  }

  return (
    <div className="main-content">
      {/* Banner de Meet si está Aprobado */}
      {caseData && caseData.status === 'approved' && caseData.meet_link && (
        <div className="meet-banner" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="meet-info" style={{ flexGrow: 1 }}>
              <div className="meet-title">¡Ficha Táctica Aprobada!</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginBottom: '0.25rem' }}>
                El docente ha habilitado tu acceso a la tutoría en vivo por Google Meet.
              </div>
              {caseData.meet_time && (
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', fontWeight: '600' }}>
                  📅 Horario propuesto: {new Date(caseData.meet_time).toLocaleString()}
                </div>
              )}
            </div>

            {/* Renderizar según estado de la confirmación */}
            {(!caseData.meet_schedule_status || caseData.meet_schedule_status === 'pending') && !showRescheduleForm && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ background: 'var(--color-primary)', color: '#0b0f19', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  disabled={submittingScheduleResponse}
                  onClick={() => handleUpdateScheduleStatus('accepted')}
                >
                  ✔️ Aceptar Horario
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: 'var(--color-error)', color: '#f87171' }}
                  disabled={submittingScheduleResponse}
                  onClick={() => setShowRescheduleForm(true)}
                >
                  ❌ Solicitar Cambio
                </button>
              </div>
            )}

            {caseData.meet_schedule_status === 'accepted' && (
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="badge badge-approved" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginBottom: '0.25rem' }}>
                    Asistencia Confirmada
                  </span>
                  <button 
                    style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => setShowRescheduleForm(true)}
                  >
                    Solicitar reprogramación
                  </button>
                </div>
                <a href={caseData.meet_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ background: '#34d399', color: '#064e3b' }}>
                  Unirse al Meet <ExternalLink size={16} />
                </a>
              </div>
            )}

            {caseData.meet_schedule_status === 'rejected' && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className="badge badge-observed" style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                  Reprogramación Solicitada
                </span>
              </div>
            )}
          </div>

          {/* Formulario para proponer cambio de horario */}
          {showRescheduleForm && (
            <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                Escribe un comentario explicando tu inconveniente o proponiendo otro horario:
              </label>
              <textarea 
                className="form-input" 
                rows="2"
                style={{ fontSize: '0.85rem', marginBottom: '0.75rem', minHeight: '60px' }}
                placeholder="Ej: Hola Profe, trabajo a esa hora. ¿Es posible pasar la reunión a las 19:30 o al día siguiente?"
                value={rescheduleComment}
                onChange={(e) => setRescheduleComment(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '4px 12px', fontSize: '0.8rem', background: 'var(--color-primary)' }}
                  disabled={submittingScheduleResponse || !rescheduleComment.trim()}
                  onClick={() => handleUpdateScheduleStatus('rejected', rescheduleComment)}
                >
                  Enviar Propuesta
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                  disabled={submittingScheduleResponse}
                  onClick={() => {
                    setShowRescheduleForm(false)
                    setRescheduleComment('')
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Mostrar el comentario del alumno si está en estado rechazado */}
          {caseData.meet_schedule_status === 'rejected' && (
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', borderLeft: '3px solid var(--color-warning)', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.85rem' }}>
              <span style={{ fontWeight: '600', color: 'var(--color-warning)' }}>Tu propuesta de cambio:</span>
              <p style={{ fontStyle: 'italic', marginTop: '0.25rem', color: 'var(--color-text-main)' }}>
                "{caseData.student_schedule_comment}"
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                El docente revisará este comentario para reprogramar el encuentro.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TÍTULO PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>La Oficina del Entrenador</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Taller práctico de análisis, debate y planificación</p>
        </div>
        {caseData && (
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>Estado de tu ficha:</span>
            <span className={`badge badge-${caseData.status}`}>
              {caseData.status === 'draft' ? 'Borrador' : caseData.status === 'submitted' ? 'Entregado' : caseData.status === 'observed' ? 'Observado' : 'Aprobado'}
            </span>
          </div>
        )}
      </div>

      {/* PESTAÑAS PRINCIPALES DEL ALUMNO */}
      <div className="tabs" style={{ marginBottom: '2rem' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('info')}
          style={{ fontSize: '1.05rem', paddingBottom: '0.5rem' }}
        >
          1. Presentación e Información General
        </button>
        {wantsToExpose && (
          <button 
            className={`tab-btn ${activeSubTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('form')}
            style={{ fontSize: '1.05rem', paddingBottom: '0.5rem' }}
          >
            2. Completar Ficha Táctica
          </button>
        )}
      </div>

      {/* CONTENIDO DE PESTAÑA 1: INFORMACIÓN GENERAL DEL TALLER */}
      {activeSubTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Vimeo Video */}
          <div className="card vimeo-section" style={{ marginBottom: 0 }}>
            <h3 className="card-title" style={{ borderBottom: 'none', marginBottom: '0.5rem' }}>
              🎥 Presentación y Explicación del Profesor
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Mira la explicación del docente antes de comenzar a completar tu ficha de presentación de caso.
            </p>
            <div className="video-responsive">
              <iframe 
                src="https://player.vimeo.com/video/1196670096?h=12dfe7b009&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" 
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                title="Presentación del taller"
              ></iframe>
            </div>
          </div>

          {/* Salas de Meet (Oyentes) */}
          <div className="card">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} style={{ color: 'var(--color-primary-hover)' }} />
              Salas de Meet Disponibles (Participación como Oyente)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
              Inscríbete en las siguientes salas programadas para participar de las tutorías en vivo únicamente como oyente, sin necesidad de completar la Ficha Táctica.
            </p>

            {rooms.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--bg-tactical)', borderRadius: '8px', border: '1px dashed var(--color-border)' }}>
                No hay salas de Meet programadas en este momento. Vuelve a consultar más tarde.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {rooms.map(room => {
                  const isRegistered = registrations.some(r => r.room_id === room.id)
                  return (
                    <div 
                      key={room.id} 
                      style={{ 
                        background: isRegistered ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-tactical)', 
                        padding: '1.25rem', 
                        borderRadius: '10px', 
                        border: `1px solid ${isRegistered ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isRegistered ? 'var(--shadow-glow)' : 'none',
                        transition: 'var(--transition-normal)'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-text-main)', fontSize: '1.1rem' }}>
                            {room.name}
                          </h4>
                          {isRegistered && (
                            <span className="badge badge-approved" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>
                              Inscripto
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-primary-hover)', display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>
                          📅 {new Date(room.meet_time).toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                          Docente: <strong>{room.creator?.full_name || 'Profesor'}</strong>
                        </span>
                        {room.description && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', lineHeight: '1.4' }}>
                            {room.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)' }}>
                        {isRegistered ? (
                          <>
                            <a 
                              href={room.meet_link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-primary" 
                              style={{ flexGrow: 1, padding: '0.5rem', fontSize: '0.85rem', background: 'var(--color-primary-hover)', color: '#064e3b' }}
                            >
                              Unirse al Meet <ExternalLink size={14} />
                            </a>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => handleUnregisterRoom(room.id)}
                              disabled={registeringRoomId === room.id}
                              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--color-error)' }}
                            >
                              Salir
                            </button>
                          </>
                        ) : (
                          <button 
                            className="btn btn-primary" 
                            onClick={() => handleRegisterRoom(room.id)}
                            disabled={registeringRoomId === room.id}
                            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                          >
                            {registeringRoomId === room.id ? 'Inscribiendo...' : 'Inscribirse como Oyente'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Información Taller General */}
          <div className="card" style={{ marginBottom: 0 }}>
            <h3 className="card-title">📖 Dinámica y Objetivos del Taller</h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-main)', marginBottom: '1.5rem' }}>
              La Oficina del Entrenador es una propuesta pensada para acercar a los estudiantes a una dinámica profesional de análisis, debate y toma de decisiones propia de un cuerpo técnico. El objetivo es analizar, junto a expertos en actividad, diferentes problemáticas vinculadas al juego, la planificación, el entrenamiento y la intervención del entrenador.
            </p>

            <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-primary-hover)', marginBottom: '1rem' }}>⏱️ Dinámica de los Encuentros</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>20 min</div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Presentación del Caso</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>El alumno expositor presenta el caso, contexto, dificultad principal y clips de video.</p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>20 min</div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Mini Cuerpos Técnicos</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Los alumnos se dividen en grupos por Meet para debatir y analizar el caso.</p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>15/20 min</div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Puesta en Común</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Cada grupo expone brevemente su mirada, prioridades e ideas de entrenamiento.</p>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '0.25rem' }}>15 min</div>
                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>Propuesta del Experto</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>El experto invitado modera, ordena las ideas y comparte su mirada profesional.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card" style={{ marginBottom: 0 }}>
              <h3 className="card-title">⚽ Modalidades de Trabajo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                <div>
                  <strong style={{ color: 'var(--color-primary-hover)' }}>1. Alumnos con Equipos Propios:</strong>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Alumnos que dirigen y cuentan con imágenes de partidos (cámara táctica/VEO) que permitan observar el funcionamiento colectivo.</p>
                </div>
                <div>
                  <strong style={{ color: 'var(--color-primary-hover)' }}>2. Casos Propuestos por Experto:</strong>
                  <p style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>El docente experto selecciona un caso práctico de AFA o ligas de interés y los alumnos se incorporan simulando integrar su cuerpo técnico.</p>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 0 }}>
              <h3 className="card-title">📝 Formato Fijo de la Exposición</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                Para que la dinámica sea provechosa, el expositor completará y expondrá según los siguientes apartados:
              </p>
              <ul style={{ fontSize: '0.85rem', paddingLeft: '1.25rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                <li>Contexto competitivo del equipo.</li>
                <li>Lectura general del plantel (Fortalezas y limitaciones).</li>
                <li>Características tácticas de los jugadores propios.</li>
                <li>Alineación táctica detallada (Esquema).</li>
                <li>Dificultad principal observada (Dudas y soluciones pensadas).</li>
                <li>Material de video clips segmentados o partido completo.</li>
              </ul>
            </div>
          </div>

          {/* Postulación a Expositor */}
          <div className="card" style={{ border: wantsToExpose ? '1px solid var(--color-primary)' : '1px solid var(--color-border)' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎤 Exposición de Caso Táctico (Opcional)
            </h3>
            <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', marginBottom: '1rem', lineHeight: '1.5' }}>
              ¿Estás dirigiendo un equipo y quieres presentar un análisis táctico en vivo en la tutoría para debatir con los profesores y tus compañeros? 
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
              Al habilitar la opción de Expositor, tendrás acceso a la <strong>Ficha Táctica</strong>. Deberás completarla con el contexto de tu equipo, alineación y cortes de video para que los docentes la revisen. Tras la aprobación, se te asignará un Meet exclusivo para exponer.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-input)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <input 
                type="checkbox" 
                id="wantsToExposeToggle"
                checked={wantsToExpose}
                onChange={(e) => {
                  const val = e.target.checked
                  if (!val && caseData) {
                    setAlertTitle('Acción no permitida')
                    setAlertMessage('No puedes desactivar el modo expositor si ya has guardado o iniciado una Ficha Táctica en la plataforma.')
                    setAlertType('warning')
                    setAlertOpen(true)
                  } else {
                    setWantsToExpose(val)
                    if (val) {
                      setActiveSubTab('form')
                    } else {
                      setActiveSubTab('info')
                    }
                  }
                }}
                disabled={!!caseData}
                style={{ width: '1.25rem', height: '1.25rem', cursor: caseData ? 'not-allowed' : 'pointer' }}
              />
              <label htmlFor="wantsToExposeToggle" style={{ fontSize: '0.95rem', fontWeight: '600', cursor: caseData ? 'not-allowed' : 'pointer', color: 'var(--color-text-main)' }}>
                Quiero exponer mi propio caso práctico (Habilitar Ficha Táctica)
              </label>
            </div>
            {caseData && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-primary-hover)', marginTop: '0.5rem' }}>
                ✓ Ya has guardado datos en tu Ficha Táctica. El modo Expositor se mantiene activo de manera permanente.
              </p>
            )}
          </div>

          {/* Video Ejemplo de Ficha Técnica */}
          <div className="card vimeo-section" style={{ borderStyle: 'dashed', marginBottom: 0 }}>
            <h4 style={{ fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--color-primary-hover)' }}>
              🎥 Ejemplo del Trabajo a Realizar
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Mira este ejemplo del profesor explicando cómo presentar el caso práctico, exponer los clips tácticos y rellenar la plantilla.
            </p>
            <div className="video-responsive">
              <iframe 
                src="https://player.vimeo.com/video/1196670095?h=7b6a75533a&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" 
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                title="Ejemplo del Trabajo a Realizar"
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA 2: FORMULARIO INTERACTIVO (FICHA TÁCTICA) */}
      {activeSubTab === 'form' && (
        <div>
          {/* Devolución del Docente en caso de Observaciones o Aprobación */}
          {caseData && caseData.teacher_feedback && (
            <div className="card" style={{ borderLeft: `4px solid ${caseData.status === 'approved' ? 'var(--color-success)' : 'var(--color-warning)'}` }}>
              <h4 style={{ fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: caseData.status === 'approved' ? 'var(--color-success)' : 'var(--color-warning)' }}>
                <Award size={20} /> Devolución del Docente
              </h4>
              <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                "{caseData.teacher_feedback}"
              </p>
            </div>
          )}

          {/* 0. DATOS GENERALES */}
          <div className="card">
            <h3 className="card-title"><FileText size={18} /> 0. Datos Generales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Nombre del Alumno</label>
                <input className="form-input" value={profile?.full_name || ''} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Club / Institución</label>
                <input 
                  className="form-input" 
                  placeholder="Ej.: Club Atlético Maradona" 
                  value={clubInstitution}
                  onChange={(e) => setClubInstitution(e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp del Alumno</label>
                <input 
                  type="tel"
                  className="form-input" 
                  placeholder="Ej.: 5491178544032" 
                  value={studentWhatsapp}
                  onChange={(e) => setStudentWhatsapp(e.target.value)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* 1. CONTEXTO COMPETITIVO */}
          <div className="card">
            <h3 className="card-title"><FileText size={18} /> 1. Contexto Competitivo</h3>
            <div className="form-group">
              <label className="form-label">
                Describir brevemente en qué competencia participa el equipo y cuál es el nivel del torneo.
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                Ejemplos: liga local, torneo AFA, competencia formativa, amistosos, torneo regional, torneo escolar, liga barrial, etc.
              </span>
              <textarea 
                className="form-input" 
                rows="3" 
                placeholder="Respuesta del alumno..."
                value={competitiveContext}
                onChange={(e) => setCompetitiveContext(e.target.value)}
                disabled={isReadOnly}
              ></textarea>
            </div>
          </div>

          {/* 2. LECTURA GENERAL DEL PLANTEL */}
          <div className="card">
            <h3 className="card-title"><FileText size={18} /> 2. Lectura General del Plantel</h3>
            <div className="form-group">
              <label className="form-label">Fortalezas principales del equipo</label>
              <textarea 
                className="form-input" 
                rows="2" 
                value={teamStrengths}
                onChange={(e) => setTeamStrengths(e.target.value)}
                disabled={isReadOnly}
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Limitaciones principales del equipo</label>
              <textarea 
                className="form-input" 
                rows="2" 
                value={teamLimitations}
                onChange={(e) => setTeamLimitations(e.target.value)}
                disabled={isReadOnly}
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">¿Qué tipo de funcionamiento permite este grupo?</label>
              <textarea 
                className="form-input" 
                rows="2" 
                value={teamFunctioning}
                onChange={(e) => setTeamFunctioning(e.target.value)}
                disabled={isReadOnly}
              ></textarea>
            </div>
          </div>

          {/* 2.1 CARACTERÍSTICAS DE LOS JUGADORES PROPIOS */}
          <div className="card">
            <h3 className="card-title"><FileText size={18} /> 2.1 Características de los Jugadores Propios</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Completar por jugador, puesto o línea específica (Arquero, central, lateral, volante, delantero, jugador clave, etc.).
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Jugador / Puesto</th>
                    <th style={{ width: '37%' }}>Obligaciones (por qué lo pongo)</th>
                    <th style={{ width: '38%' }}>Posibilidades (qué variantes me permite)</th>
                  </tr>
                </thead>
                <tbody>
                  {playerCharacteristics.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500' }}>{row.puesto}</td>
                      <td>
                        <textarea 
                          className="form-input" 
                          style={{ padding: '0.4rem', fontSize: '0.85rem' }} 
                          rows="2"
                          value={row.obligaciones}
                          onChange={(e) => {
                            const updated = [...playerCharacteristics]
                            updated[idx].obligaciones = e.target.value
                            setPlayerCharacteristics(updated)
                          }}
                          disabled={isReadOnly}
                        ></textarea>
                      </td>
                      <td>
                        <textarea 
                          className="form-input" 
                          style={{ padding: '0.4rem', fontSize: '0.85rem' }} 
                          rows="2"
                          value={row.posibilidades}
                          onChange={(e) => {
                            const updated = [...playerCharacteristics]
                            updated[idx].posibilidades = e.target.value
                            setPlayerCharacteristics(updated)
                          }}
                          disabled={isReadOnly}
                        ></textarea>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CANCHA TÁCTICA INTERACTIVA */}
          <div className="card">
            <h3 className="card-title"><Eye size={18} /> Cancha Táctica de Alineación</h3>
            <TacticalPitch lineup={tacticalLineup} onChange={setTacticalLineup} readOnly={isReadOnly} />
          </div>

          {/* 3. DIFICULTAD PRINCIPAL DEL CASO */}
          <div className="card">
            <h3 className="card-title"><FileText size={18} /> 3. Dificultad Principal del Caso</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Explicar de manera concreta cuál es la situación que desea trabajar con los profesores (dificultad futbolística observable).
            </p>
            <div className="form-group">
              <label className="form-label">¿Qué problema o dificultad le gustaría abordar?</label>
              <textarea 
                className="form-input" 
                rows="3" 
                value={difficultyProblem}
                onChange={(e) => setDifficultyProblem(e.target.value)}
                disabled={isReadOnly}
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">¿Qué dudas concretas quiere llevar al taller? (Máx. 3 consultas)</label>
              {difficultyQuestions.map((q, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ alignSelf: 'center', color: 'var(--color-text-muted)', fontWeight: '600' }}>{idx + 1}.</span>
                  <input 
                    className="form-input" 
                    value={q} 
                    onChange={(e) => {
                      const updated = [...difficultyQuestions]
                      updated[idx] = e.target.value
                      setDifficultyQuestions(updated)
                    }}
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && difficultyQuestions.length > 1 && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0 0.5rem' }} 
                      onClick={() => setDifficultyQuestions(difficultyQuestions.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {!isReadOnly && difficultyQuestions.length < 3 && (
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setDifficultyQuestions([...difficultyQuestions, ''])}>
                  <Plus size={12} /> Agregar consulta
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">¿Qué soluciones ha pensado?</label>
              {difficultySolutions.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ alignSelf: 'center', color: 'var(--color-text-muted)', fontWeight: '600' }}>{idx + 1}.</span>
                  <input 
                    className="form-input" 
                    value={s} 
                    onChange={(e) => {
                      const updated = [...difficultySolutions]
                      updated[idx] = e.target.value
                      setDifficultySolutions(updated)
                    }}
                    disabled={isReadOnly}
                  />
                  {!isReadOnly && difficultySolutions.length > 1 && (
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0 0.5rem' }} 
                      onClick={() => setDifficultySolutions(difficultySolutions.filter((_, i) => i !== idx))}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {!isReadOnly && difficultySolutions.length < 3 && (
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setDifficultySolutions([...difficultySolutions, ''])}>
                  <Plus size={12} /> Agregar solución
                </button>
              )}
            </div>
          </div>

          {/* 4. MATERIAL DE VIDEO */}
          <div className="card">
            <h3 className="card-title"><Video size={18} /> 4. Material de Video</h3>
            
            <div className="tabs" style={{ marginBottom: '1.25rem' }}>
              <button 
                className={`tab-btn ${videoOption === 'A' ? 'active' : ''}`}
                onClick={() => !isReadOnly && setVideoOption('A')}
              >
                Opción A: Cortes editados (Máx. 5 min total)
              </button>
              <button 
                className={`tab-btn ${videoOption === 'B' ? 'active' : ''}`}
                onClick={() => !isReadOnly && setVideoOption('B')}
              >
                Opción B: Partido completo segmentado
              </button>
            </div>

            {videoOption === 'A' ? (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                  Pega los enlaces de tus cortes editados (ej. YouTube, Drive, Vimeo) y describe el problema de cada corte.
                </p>
                {videoCuts.map((cut, idx) => (
                  <div key={idx} className="card" style={{ background: 'var(--bg-input)', padding: '1rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--color-primary-hover)' }}>Corte {idx + 1}</span>
                      {!isReadOnly && videoCuts.length > 1 && (
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', color: 'var(--color-error)' }} onClick={() => setVideoCuts(videoCuts.filter((_, i) => i !== idx))}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Link del corte</label>
                      <input 
                        className="form-input" 
                        placeholder="https://..." 
                        value={cut.link} 
                        onChange={(e) => {
                          const updated = [...videoCuts]
                          updated[idx].link = e.target.value
                          setVideoCuts(updated)
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Qué problema o situación desea plantear</label>
                      <input 
                        className="form-input" 
                        placeholder="Descripción táctica..." 
                        value={cut.problema} 
                        onChange={(e) => {
                          const updated = [...videoCuts]
                          updated[idx].problema = e.target.value
                          setVideoCuts(updated)
                        }}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                ))}
                {!isReadOnly && videoCuts.length < 4 && (
                  <button className="btn btn-secondary" onClick={() => setVideoCuts([...videoCuts, { link: '', problema: '' }])}>
                    <Plus size={14} /> Agregar otro corte
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Enlace del partido completo</label>
                  <input 
                    className="form-input" 
                    placeholder="https://youtube.com/..." 
                    value={videoFullMatch.link || ''}
                    onChange={(e) => setVideoFullMatch({ ...videoFullMatch, link: e.target.value })}
                    disabled={isReadOnly}
                  />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', marginTop: '1rem' }}>
                  Detalla los minutos a observar y el motivo de análisis de cada fragmento.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '15%' }}>Desde (Min)</th>
                        <th style={{ width: '15%' }}>Hasta (Min)</th>
                        <th style={{ width: '60%' }}>Motivo de Análisis</th>
                        <th style={{ width: '10%' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(videoFullMatch.fragments || []).map((frag, idx) => (
                        <tr key={idx}>
                          <td>
                            <input 
                              className="form-input" 
                              placeholder="00:00" 
                              value={frag.desde} 
                              onChange={(e) => {
                                const frags = [...videoFullMatch.fragments]
                                frags[idx].desde = e.target.value
                                setVideoFullMatch({ ...videoFullMatch, fragments: frags })
                              }}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td>
                            <input 
                              className="form-input" 
                              placeholder="00:00" 
                              value={frag.hasta} 
                              onChange={(e) => {
                                const frags = [...videoFullMatch.fragments]
                                frags[idx].hasta = e.target.value
                                setVideoFullMatch({ ...videoFullMatch, fragments: frags })
                              }}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td>
                            <input 
                              className="form-input" 
                              placeholder="Ej.: Transición defensiva lenta tras córner" 
                              value={frag.motivo} 
                              onChange={(e) => {
                                const frags = [...videoFullMatch.fragments]
                                frags[idx].motivo = e.target.value
                                setVideoFullMatch({ ...videoFullMatch, fragments: frags })
                              }}
                              disabled={isReadOnly}
                            />
                          </td>
                          <td>
                            {!isReadOnly && videoFullMatch.fragments.length > 1 && (
                              <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => {
                                const frags = videoFullMatch.fragments.filter((_, i) => i !== idx)
                                setVideoFullMatch({ ...videoFullMatch, fragments: frags })
                              }}>
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!isReadOnly && (
                  <button className="btn btn-secondary" onClick={() => {
                    const frags = [...videoFullMatch.fragments, { desde: '', hasta: '', motivo: '' }]
                    setVideoFullMatch({ ...videoFullMatch, fragments: frags })
                  }}>
                    <Plus size={14} /> Agregar fragmento
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción del alumno */}
          {!isReadOnly && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>
                <Save size={18} /> Guardar Borrador
              </button>
              <button className="btn btn-primary" onClick={() => handleSave('submitted')} disabled={saving}>
                <Send size={18} /> Enviar para Revisión
              </button>
            </div>
          )}

          {isReadOnly && caseData.status === 'submitted' && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem', border: '1px dashed var(--color-primary)' }}>
              <h4 style={{ color: 'var(--color-primary-hover)', fontFamily: 'var(--font-title)', marginBottom: '0.5rem' }}>
                Ficha en revisión
              </h4>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                Has enviado tu ficha táctica para la revisión de los docentes. Recibirás un feedback aquí pronto y se te habilitará el link de Meet tras la aprobación.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Alerta modal premium */}
      <ModalAlert 
        isOpen={alertOpen}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertOpen(false)}
      />
    </div>
  )
}
