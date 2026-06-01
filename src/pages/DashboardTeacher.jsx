import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TacticalPitch from '../components/TacticalPitch'
import ModalAlert from '../components/ModalAlert'
import { Award, FileText, CheckCircle, AlertTriangle, ExternalLink, Calendar, Send, ArrowLeft, RefreshCw } from 'lucide-react'

export default function DashboardTeacher({ user, profile }) {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState(null)
  
  // Salas de Meet y Registros
  const [rooms, setRooms] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [teacherTab, setTeacherTab] = useState('cases') // 'cases' | 'rooms'

  // Formulario Sala de Meet
  const [roomName, setRoomName] = useState('')
  const [roomLink, setRoomLink] = useState('')
  const [roomTime, setRoomTime] = useState('')
  const [roomDescription, setRoomDescription] = useState('')
  const [creatingRoom, setCreatingRoom] = useState(false)
  
  // Selección de sala para asignación
  const [assignedRoomId, setAssignedRoomId] = useState('')
  
  // Estados para alertas custom
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('info')
  const [onAlertClose, setOnAlertClose] = useState(null)
  
  // Formulario de revisión
  const [feedback, setFeedback] = useState('')
  const [meetLink, setMeetLink] = useState('')
  const [meetTime, setMeetTime] = useState('')
  const [reviewStatus, setReviewStatus] = useState('approved') // 'approved' o 'observed'
  const [savingReview, setSavingReview] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'submitted', 'observed', 'approved'

  const fetchCases = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tactical_cases')
        .select(`
          *,
          student:profiles!tactical_cases_student_id_fkey (
            full_name,
            email,
            dni_passport,
            career
          )
        `)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setCases(data || [])
    } catch (err) {
      console.error('Error fetching cases:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      // Cargar salas
      const { data: roomsData, error: roomsError } = await supabase
        .from('meet_rooms')
        .select('*, creator:profiles!meet_rooms_created_by_fkey(full_name)')
        .order('meet_time', { ascending: true })
      if (roomsError) throw roomsError

      // Filtrar salas que ya hayan pasado de su fecha/hora por más de 2 horas
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const activeRooms = (roomsData || []).filter(room => new Date(room.meet_time) >= twoHoursAgo)
      setRooms(activeRooms)

      // Cargar inscripciones de alumnos oyentes
      const { data: regsData, error: regsError } = await supabase
        .from('meet_room_registrations')
        .select('*')
      if (regsError) throw regsError
      setRegistrations(regsData || [])
    } catch (err) {
      console.error('Error fetching rooms/registrations:', err)
    }
  }

  useEffect(() => {
    fetchCases()
    fetchRooms()
  }, [])

  const handleSelectCase = (tCase) => {
    setSelectedCase(tCase)
    setFeedback(tCase.teacher_feedback || '')
    setMeetLink(tCase.meet_link || '')
    setAssignedRoomId(tCase.room_id || '')
    
    // Formatear fecha para el input datetime-local
    if (tCase.meet_time) {
      const date = new Date(tCase.meet_time)
      const formatted = date.toISOString().slice(0, 16)
      setMeetTime(formatted)
    } else {
      setMeetTime('')
    }
    
    setReviewStatus(tCase.status === 'approved' ? 'approved' : 'observed')
  }

  const handleRoomSelect = (roomId) => {
    setAssignedRoomId(roomId)
    if (roomId) {
      const selected = rooms.find(r => r.id === roomId)
      if (selected) {
        setMeetLink(selected.meet_link)
        if (selected.meet_time) {
          const date = new Date(selected.meet_time)
          setMeetTime(date.toISOString().slice(0, 16))
        }
      }
    } else {
      setMeetLink('')
      setMeetTime('')
    }
  }

  const handleSaveReview = async () => {
    if (!selectedCase) return
    setSavingReview(true)
    
    const updates = {
      status: reviewStatus,
      teacher_feedback: feedback,
      teacher_id: user.id,
      room_id: reviewStatus === 'approved' ? (assignedRoomId || null) : null,
      meet_link: reviewStatus === 'approved' ? meetLink : null,
      meet_time: (reviewStatus === 'approved' && meetTime) ? new Date(meetTime).toISOString() : null,
      updated_at: new Date().toISOString()
    }

    // Si se aprueba, verificar si se cambia la fecha/link o si ya estaba rechazado, para reiniciar la confirmación
    if (reviewStatus === 'approved') {
      const dbMeetTime = selectedCase.meet_time ? new Date(selectedCase.meet_time).toISOString() : null
      const nextMeetTime = updates.meet_time
      
      const isTimeChanged = dbMeetTime !== nextMeetTime
      const isLinkChanged = (selectedCase.meet_link || null) !== (updates.meet_link || null)
      const isRejected = selectedCase.meet_schedule_status === 'rejected'

      if (isTimeChanged || isLinkChanged || isRejected) {
        updates.meet_schedule_status = 'pending'
        updates.student_schedule_comment = null
      }
    }

    try {
      const { error } = await supabase
        .from('tactical_cases')
        .update(updates)
        .eq('id', selectedCase.id)

      if (error) throw error
      
      setAlertTitle('Revisión Guardada')
      setAlertMessage('La devolución técnica ha sido guardada y notificada al alumno con éxito.')
      setAlertType('success')
      setOnAlertClose(() => () => {
        setSelectedCase(null)
        fetchCases()
      })
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage(err.message || 'Error al guardar la revisión.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setSavingReview(false)
    }
  }

  const handleCreateRoom = async (e) => {
    if (e) e.preventDefault()
    setCreatingRoom(true)
    try {
      const { error } = await supabase
        .from('meet_rooms')
        .insert({
          name: roomName,
          meet_link: roomLink,
          meet_time: new Date(roomTime).toISOString(),
          description: roomDescription,
          created_by: profile?.id || user?.id
        })
      
      if (error) throw error

      setAlertTitle('Sala Creada')
      setAlertMessage(`La sala de Meet "${roomName}" se ha creado con éxito. Ahora los alumnos pueden inscribirse.`);
      setAlertType('success')
      setAlertOpen(true)
      
      // Limpiar form
      setRoomName('')
      setRoomLink('')
      setRoomTime('')
      setRoomDescription('')
      fetchRooms()
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage(err.message || 'Error al crear la sala de Meet.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setCreatingRoom(false)
    }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('¿Estás seguro de eliminar esta sala? Se cancelarán todas las inscripciones asociadas.')) return
    try {
      const { error } = await supabase
        .from('meet_rooms')
        .delete()
        .eq('id', roomId)
      if (error) throw error
      fetchRooms()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar la sala.')
    }
  }

  const filteredCases = cases.filter(c => {
    if (filter === 'all') return true
    return c.status === filter
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '0.75rem' }}>Cargando datos del docente...</span>
      </div>
    )
  }

  return (
    <div className="main-content" style={{ maxWidth: selectedCase ? '1200px' : '900px' }}>
      
      {/* TABS DE DOCENTE (CASOS Y CREAR SALAS) */}
      {!selectedCase && (
        <div className="tabs" style={{ marginBottom: '2rem' }}>
          <button 
            className={`tab-btn ${teacherTab === 'cases' ? 'active' : ''}`}
            onClick={() => setTeacherTab('cases')}
            style={{ fontSize: '1.05rem' }}
          >
            Fichas Tácticas de Alumnos
          </button>
          <button 
            className={`tab-btn ${teacherTab === 'rooms' ? 'active' : ''}`}
            onClick={() => setTeacherTab('rooms')}
            style={{ fontSize: '1.05rem' }}
          >
            Crear y Gestionar Salas de Meet
          </button>
        </div>
      )}
      
      {/* VISTA DETALLADA DE REVISIÓN */}
      {selectedCase ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <button className="btn btn-secondary" onClick={() => setSelectedCase(null)} style={{ marginBottom: '0.5rem' }}>
                <ArrowLeft size={16} /> Volver a la Lista
              </button>
              <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)' }}>
                Revisión: {selectedCase.student?.full_name || 'Alumno'}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span>Club: {selectedCase.club_institution || 'No especificado'}</span>
                <span>|</span>
                <span>Email: {selectedCase.student?.email}</span>
                {selectedCase.student_whatsapp && (
                  <>
                    <span>|</span>
                    <span>Wsp: {selectedCase.student_whatsapp}</span>
                    <a 
                      href={`https://wa.me/${selectedCase.student_whatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ 
                        padding: '2px 8px', 
                        fontSize: '0.75rem', 
                        height: 'auto', 
                        display: 'inline-flex', 
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#34d399', 
                        background: 'rgba(16, 185, 129, 0.05)', 
                        borderColor: 'rgba(16, 185, 129, 0.2)' 
                      }}
                    >
                      💬 Enviar WhatsApp
                    </a>
                  </>
                )}
                {selectedCase.student?.dni_passport && (
                  <>
                    <span>|</span>
                    <span>DNI/Pasaporte: {selectedCase.student.dni_passport}</span>
                  </>
                )}
                {selectedCase.student?.career && (
                  <>
                    <span>|</span>
                    <span>Carrera: {selectedCase.student.career}</span>
                  </>
                )}
              </p>
            </div>
            <div>
              <span className={`badge badge-${selectedCase.status}`}>
                {selectedCase.status === 'draft' ? 'Borrador' : selectedCase.status === 'submitted' ? 'Entregado' : selectedCase.status === 'observed' ? 'Observado' : 'Aprobado'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            
            {/* Lado Izquierdo: Contenido de la Ficha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div className="card">
                <h4 className="card-title">1. Contexto Competitivo</h4>
                <p style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                  {selectedCase.competitive_context || 'Sin descripción.'}
                </p>
              </div>

              <div className="card">
                <h4 className="card-title">2. Lectura General del Plantel</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Fortalezas:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{selectedCase.team_strengths || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Limitaciones:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{selectedCase.team_limitations || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Funcionamiento:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{selectedCase.team_functioning || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="card-title">2.1 Características de Jugadores Propios</h4>
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
                <h4 className="card-title">Alineación en la Cancha</h4>
                <TacticalPitch lineup={selectedCase.tactical_lineup || []} readOnly={true} />
              </div>

              <div className="card">
                <h4 className="card-title">3. Dificultad Principal</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Problema / Dificultad:</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{selectedCase.difficulty_problem || '-'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Dudas / Consultas:</span>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                      {(selectedCase.difficulty_questions || []).map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Soluciones Pensadas:</span>
                    <ul style={{ paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                      {(selectedCase.difficulty_solutions || []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="card-title">4. Material de Video ({selectedCase.video_option === 'A' ? 'Cortes Editados' : 'Partido Segmentado'})</h4>
                {selectedCase.video_option === 'A' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(selectedCase.video_cuts || []).map((cut, idx) => (
                      <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: '6px' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--color-primary-hover)' }}>Corte {idx + 1}</div>
                        {cut.link ? (
                          <a href={cut.link} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--color-accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', margin: '0.25rem 0' }}>
                            Ver Video <ExternalLink size={12} />
                          </a>
                        ) : 'Sin enlace.'}
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}><strong>Problema:</strong> {cut.problema || '-'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {selectedCase.video_full_match?.link ? (
                      <a href={selectedCase.video_full_match.link} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Ver Partido Completo <ExternalLink size={14} />
                      </a>
                    ) : <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Sin enlace a partido completo.</p>}
                    <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Desde</th>
                          <th>Hasta</th>
                          <th>Motivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedCase.video_full_match?.fragments || []).map((frag, idx) => (
                          <tr key={idx}>
                            <td>{frag.desde || '-'}</td>
                            <td>{frag.hasta || '-'}</td>
                            <td>{frag.motivo || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

             {/* Lado Derecho: Formulario de Evaluación */}
            <div style={{ position: 'sticky', top: '1rem', height: 'fit-content' }}>
              <div className="card" style={{ border: '1px solid var(--color-primary-dark)' }}>
                <h3 className="card-title" style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}><Award size={18} /> Evaluación del Docente</h3>
                
                {/* Alerta del estado de confirmación del horario */}
                {selectedCase.meet_schedule_status === 'rejected' && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <h5 style={{ color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      ⚠️ Reprogramación Solicitada por el Alumno
                    </h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontStyle: 'italic', marginBottom: '0.5rem' }}>
                      "{selectedCase.student_schedule_comment || 'Sin comentarios.'}"
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Modifica la fecha, hora o el enlace asignado abajo para reprogramar y notificar el nuevo horario.
                    </p>
                  </div>
                )}
                {selectedCase.meet_schedule_status === 'accepted' && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <h5 style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      ✔️ Horario Aceptado por el Alumno
                    </h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      El alumno ha confirmado su asistencia para este encuentro.
                    </p>
                  </div>
                )}
                {selectedCase.status === 'approved' && (!selectedCase.meet_schedule_status || selectedCase.meet_schedule_status === 'pending') && (
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--color-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
                    <h5 style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      🕒 Confirmación Pendiente
                    </h5>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      Aún no hay respuesta del alumno para el horario propuesto.
                    </p>
                  </div>
                )}
                
                <div className="form-group">
                  <label className="form-label">Resultado de la Revisión</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="approved" 
                        checked={reviewStatus === 'approved'} 
                        onChange={() => setReviewStatus('approved')}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-success)' }}>Aprobar caso</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="reviewStatus" 
                        value="observed" 
                        checked={reviewStatus === 'observed'} 
                        onChange={() => setReviewStatus('observed')}
                      />
                      <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--color-warning)' }}>Observar (Revisión requerida)</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Devolución / Feedback</label>
                  <textarea 
                    className="form-input" 
                    rows="6" 
                    placeholder="Escribe comentarios tácticos, recomendaciones o correcciones..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  ></textarea>
                </div>

                {reviewStatus === 'approved' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Asignar Sala de Meet Existente</label>
                      <select 
                        className="form-input"
                        value={assignedRoomId}
                        onChange={(e) => handleRoomSelect(e.target.value)}
                      >
                        <option value="">-- Personalizado (escribir abajo) --</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.name} - {new Date(r.meet_time).toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Enlace de Google Meet</label>
                      <input 
                        className="form-input" 
                        placeholder="https://meet.google.com/..." 
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha y Hora de la Reunión</label>
                      <input 
                        type="datetime-local" 
                        className="form-input" 
                        value={meetTime}
                        onChange={(e) => setMeetTime(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '1rem' }} 
                  disabled={savingReview}
                  onClick={handleSaveReview}
                >
                  <Send size={16} /> Guardar Devolución
                </button>
              </div>
            </div>

          </div>
        </div>
      ) : teacherTab === 'cases' ? (
        
        // LISTADO GENERAL DE CASOS DE ALUMNOS
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Oficina del Entrenador - Docente</h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Fichas de casos presentados por alumnos para calificar</p>
            </div>
            <button className="btn btn-secondary" onClick={fetchCases} disabled={loading}>
              <RefreshCw size={16} /> Actualizar
            </button>
          </div>

          {/* Filtros */}
          <div className="tabs">
            <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
            <button className={`tab-btn ${filter === 'submitted' ? 'active' : ''}`} onClick={() => setFilter('submitted')}>Entregadas</button>
            <button className={`tab-btn ${filter === 'observed' ? 'active' : ''}`} onClick={() => setFilter('observed')}>Observadas</button>
            <button className={`tab-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Aprobadas</button>
          </div>

          <div className="card" style={{ padding: 0 }}>
            {filteredCases.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No hay fichas tácticas en esta categoría.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr>
                      <th>Alumno</th>
                      <th>Club / Institución</th>
                      <th>Última Actualización</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCases.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: '600', color: 'var(--color-text-main)' }}>
                          {c.student?.full_name || 'Alumno sin nombre'}
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>
                            {c.student?.email}
                          </span>
                        </td>
                        <td>{c.club_institution || '-'}</td>
                        <td>{new Date(c.updated_at).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${c.status}`}>
                            {c.status === 'draft' ? 'Borrador' : c.status === 'submitted' ? 'Entregado' : c.status === 'observed' ? 'Observado' : 'Aprobado'}
                          </span>
                          {c.status === 'approved' && (
                            <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {c.meet_schedule_status === 'accepted' && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-primary-hover)', fontWeight: '600' }}>
                                  ✔️ Horario Aceptado
                                </span>
                              )}
                              {c.meet_schedule_status === 'rejected' && (
                                <span style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: '600' }} title={c.student_schedule_comment}>
                                  ⚠️ Reprog. solicitada
                                </span>
                              )}
                              {(c.meet_schedule_status === 'pending' || !c.meet_schedule_status) && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                  🕒 Conf. pendiente
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }} onClick={() => handleSelectCase(c)}>
                            Revisar Caso
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // GESTIÓN DE SALAS DE MEET
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
          {/* Lado Izquierdo: Listado de Salas creadas */}
          <div className="card">
            <h3 className="card-title">Salas de Meet Activas</h3>
            {rooms.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
                No hay salas de Google Meet programadas actualmente.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rooms.map(room => {
                  const roomRegs = registrations.filter(r => r.room_id === room.id)
                  return (
                    <div key={room.id} style={{ background: 'var(--bg-tactical)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--color-primary-hover)' }}>{room.name}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                            📅 {new Date(room.meet_time).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.25rem' }}>
                            Creada por: <strong>{room.creator?.full_name || 'Profesor'}</strong>
                          </span>
                        </div>
                        <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleDeleteRoom(room.id)}>
                          Eliminar
                        </button>
                      </div>
                      {room.description && <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.5rem' }}>{room.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--color-border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          👥 Alumnos Oyentes: <strong>{roomRegs.length}</strong> inscriptos
                        </span>
                        <a href={room.meet_link} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                          Ir a Google Meet <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Lado Derecho: Formulario para crear una nueva sala */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title">Programar Nueva Sala</h3>
            <form onSubmit={handleCreateRoom}>
              <div className="form-group">
                <label className="form-label">Nombre de la Sala / Encuentro</label>
                <input 
                  type="text"
                  required
                  className="form-input"
                  placeholder="Ej.: Taller Oficina Entrenador - Grupo A"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Enlace de Google Meet</label>
                <input 
                  type="url"
                  required
                  className="form-input"
                  placeholder="https://meet.google.com/..."
                  value={roomLink}
                  onChange={(e) => setRoomLink(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha y Hora</label>
                <input 
                  type="datetime-local"
                  required
                  className="form-input"
                  value={roomTime}
                  onChange={(e) => setRoomTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción o Temario (Opcional)</label>
                <textarea 
                  className="form-input"
                  rows="3"
                  placeholder="Ej.: Análisis táctico de salida de balón y presión alta."
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={creatingRoom}>
                {creatingRoom ? 'Creando...' : 'Programar Sala de Meet'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Alerta modal premium */}
      <ModalAlert 
        isOpen={alertOpen}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => {
          setAlertOpen(false)
          if (onAlertClose) onAlertClose()
        }}
      />
    </div>
  )
}
