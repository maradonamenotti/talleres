import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import TacticalPitch from '../components/TacticalPitch'
import { 
  BarChart3, Users, FileText, Calendar, Clock, RefreshCw, 
  ArrowLeft, Search, Filter, Info, Eye, X, HelpCircle, 
  Play, BookOpen, AlertTriangle, CheckCircle2, UserCheck, Video
} from 'lucide-react'

export default function DashboardStats({ onBackToDashboard }) {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [cases, setCases] = useState([])
  const [rooms, setRooms] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [accessLogs, setAccessLogs] = useState([])
  const [profiles, setProfiles] = useState([])

  // Estados de navegación e interacción del explorador
  const [explorerTab, setExplorerTab] = useState('access') // 'access' | 'expositors' | 'listeners'
  const [accessTimeframe, setAccessTimeframe] = useState('day') // 'day' | 'week' | 'month'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'draft' | 'submitted' | 'observed' | 'approved'
  const [regFilter, setRegFilter] = useState('all') // 'all' | 'registered' | 'unregistered'
  
  // Estado para el modal del visualizador del caso
  const [selectedCase, setSelectedCase] = useState(null)

  const fetchStatsData = async () => {
    setLoading(true)
    try {
      // 1. Cargar perfiles
      const { data: profs, error: profsErr } = await supabase
        .from('profiles')
        .select('*')
      if (profsErr) throw profsErr
      setProfiles(profs || [])
      setStudents((profs || []).filter(p => p.role === 'student'))

      // 2. Cargar fichas tácticas
      const { data: casesData, error: casesErr } = await supabase
        .from('tactical_cases')
        .select('*')
      if (casesErr) throw casesErr
      setCases(casesData || [])

      // 3. Cargar salas de Meet
      const { data: roomsData, error: roomsErr } = await supabase
        .from('meet_rooms')
        .select('*, creator:profiles!meet_rooms_created_by_fkey(full_name)')
      if (roomsErr) throw roomsErr
      
      // Filtrar salas que ya hayan pasado de su fecha/hora por más de 2 horas
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      const activeRooms = (roomsData || []).filter(room => new Date(room.meet_time) >= twoHoursAgo)
      setRooms(activeRooms)

      // 4. Cargar registros a salas
      const { data: regsData, error: regsErr } = await supabase
        .from('meet_room_registrations')
        .select('*')
      if (regsErr) throw regsErr
      setRegistrations(regsData || [])

      // 5. Cargar logs de acceso
      const { data: logs, error: logsErr } = await supabase
        .from('entrenador_access_logs')
        .select('*')
        .order('fecha', { ascending: false })
      if (logsErr) throw logsErr
      setAccessLogs(logs || [])

    } catch (err) {
      console.error('Error loading stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatsData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--color-text-muted)' }}>
        <RefreshCw className="animate-spin" size={32} />
        <span style={{ marginLeft: '0.75rem' }}>Cargando estadísticas de la plataforma...</span>
      </div>
    )
  }

  // --- CÁLCULOS ESTADÍSTICOS ---
  const draftsCount = cases.filter(c => c.status === 'draft').length
  const submittedCount = cases.filter(c => c.status === 'submitted').length
  const observedCount = cases.filter(c => c.status === 'observed').length
  const approvedCount = cases.filter(c => c.status === 'approved').length

  const expositorsCount = cases.length
  const nonExpositorsCount = Math.max(0, students.length - expositorsCount)

  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  const oneWeek = 7 * oneDay
  const oneMonth = 30 * oneDay

  // Accesos por rangos
  const logsToday = accessLogs.filter(log => (now - new Date(log.fecha)) < oneDay)
  const logsThisWeek = accessLogs.filter(log => (now - new Date(log.fecha)) < oneWeek)
  const logsThisMonth = accessLogs.filter(log => (now - new Date(log.fecha)) < oneMonth)

  // Unicidad de accesos (usuarios activos únicos)
  const uniqueUsersToday = new Set(logsToday.map(log => log.user_id)).size
  const uniqueUsersThisWeek = new Set(logsThisWeek.map(log => log.user_id)).size
  const uniqueUsersThisMonth = new Set(logsThisMonth.map(log => log.user_id)).size

  // Porcentajes para barras
  const calcPercent = (val) => {
    if (cases.length === 0) return '0%'
    return `${Math.round((val / cases.length) * 100)}%`
  }

  // --- FILTRADOS DE TABLAS EXPLORADORAS ---

  // 1. Filtrado de Accesos
  const getFilteredAccessData = () => {
    let logsToProcess = logsToday
    if (accessTimeframe === 'week') logsToProcess = logsThisWeek
    if (accessTimeframe === 'month') logsToProcess = logsThisMonth

    // Agrupar accesos por usuario
    const grouped = {}
    logsToProcess.forEach(log => {
      if (!grouped[log.user_id]) {
        grouped[log.user_id] = {
          user_id: log.user_id,
          email: log.email,
          count: 0,
          latestFecha: log.fecha
        }
      }
      grouped[log.user_id].count += 1
      if (new Date(log.fecha) > new Date(grouped[log.user_id].latestFecha)) {
        grouped[log.user_id].latestFecha = log.fecha
      }
    })

    const list = Object.values(grouped).map(item => {
      const prof = profiles.find(p => p.id === item.user_id)
      return {
        ...item,
        fullName: prof ? prof.full_name : 'Desconocido',
        role: prof ? prof.role : 'student'
      }
    })

    // Ordenar por más reciente y aplicar barra de búsqueda
    return list
      .filter(item => 
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.latestFecha) - new Date(a.latestFecha))
  }

  // 2. Filtrado de Expositores (Con Ficha)
  const getFilteredExpositors = () => {
    const list = students.map(student => {
      const tCase = cases.find(c => c.student_id === student.id)
      if (!tCase) return null
      return { student, case: tCase }
    }).filter(Boolean)

    return list.filter(item => {
      const matchesSearch = 
        item.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || item.case.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }

  // 3. Filtrado de Oyentes (Sin Ficha)
  const getFilteredListeners = () => {
    const list = students.map(student => {
      const tCase = cases.find(c => c.student_id === student.id)
      if (tCase) return null // Ya es expositor

      // Buscar registros de Meet de este alumno oyente
      const studentRegs = registrations.filter(r => r.student_id === student.id)
      const registeredRooms = studentRegs.map(reg => {
        const room = rooms.find(r => r.id === reg.room_id)
        return room ? { id: room.id, name: room.name, meet_time: room.meet_time } : null
      }).filter(Boolean)

      return { student, registeredRooms }
    }).filter(Boolean)

    return list.filter(item => {
      const matchesSearch = 
        item.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchQuery.toLowerCase())
      const hasRegs = item.registeredRooms.length > 0
      const matchesReg = regFilter === 'all' ||
                         (regFilter === 'registered' && hasRegs) ||
                         (regFilter === 'unregistered' && !hasRegs)
      return matchesSearch && matchesReg
    })
  }

  const filteredAccessList = getFilteredAccessData()
  const filteredExpositorsList = getFilteredExpositors()
  const filteredListenersList = getFilteredListeners()

  return (
    <div className="main-content" style={{ maxWidth: '1100px', paddingBottom: '4rem' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={32} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)' }}>Estadísticas de la Plataforma</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Métricas de acceso, participación y avance del taller</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchStatsData}>
            <RefreshCw size={16} /> Recargar
          </button>
          <button className="btn btn-secondary" onClick={onBackToDashboard}>
            <ArrowLeft size={16} /> Volver al Inicio
          </button>
        </div>
      </div>

      {/* TARJETAS KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--color-accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL ALUMNOS</span>
            <Users size={18} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem', fontFamily: 'var(--font-title)' }}>
            {students.length}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Registrados en el sistema</span>
        </div>

        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>EXPOSITORES</span>
            <FileText size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem', fontFamily: 'var(--font-title)', color: 'var(--color-primary-hover)' }}>
            {expositorsCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Iniciaron Ficha Táctica ({students.length > 0 ? Math.round((expositorsCount / students.length) * 100) : 0}%)
          </span>
        </div>

        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>OYENTES POTENCIALES</span>
            <Users size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem', fontFamily: 'var(--font-title)' }}>
            {nonExpositorsCount}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Sin ficha táctica ({students.length > 0 ? Math.round((nonExpositorsCount / students.length) * 100) : 0}%)
          </span>
        </div>

        <div className="card" style={{ marginBottom: 0, borderLeft: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>ALUMNOS ACTIVOS (24H)</span>
            <Clock size={18} style={{ color: '#a855f7' }} />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: '800', marginTop: '0.5rem', fontFamily: 'var(--font-title)', color: '#c084fc' }}>
            {uniqueUsersToday}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Usuarios únicos activos hoy ({uniqueUsersThisWeek} esta semana)
          </span>
        </div>

      </div>

      {/* RENDIMIENTO Y SALAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* AVANCE FICHAS TÁCTICAS */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <FileText size={18} style={{ color: 'var(--color-primary-hover)' }} />
            Estado de Fichas Tácticas de Expositores ({expositorsCount} total)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: '500' }}>🟢 Aprobadas (Asignado Meet)</span>
                <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>{approvedCount} ({calcPercent(approvedCount)})</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: calcPercent(approvedCount), height: '100%', background: 'var(--color-success)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: '500' }}>🟡 Observadas (Revisión requerida)</span>
                <span style={{ fontWeight: '600', color: 'var(--color-warning)' }}>{observedCount} ({calcPercent(observedCount)})</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: calcPercent(observedCount), height: '100%', background: 'var(--color-warning)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: '500' }}>🔵 Entregadas (Pendientes de evaluación)</span>
                <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>{submittedCount} ({calcPercent(submittedCount)})</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: calcPercent(submittedCount), height: '100%', background: 'var(--color-accent)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: '500' }}>⚪ Borradores (En desarrollo por alumno)</span>
                <span style={{ fontWeight: '600', color: 'var(--color-text-muted)' }}>{draftsCount} ({calcPercent(draftsCount)})</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: calcPercent(draftsCount), height: '100%', background: 'var(--color-text-muted)' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* METRICAS DE SALAS DE MEET */}
        <div className="card">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Video size={18} style={{ color: 'var(--color-primary-hover)' }} />
            Ocupación de Salas de Google Meet ({rooms.length} programadas)
          </h3>

          {rooms.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>
              No hay salas programadas activas en la base de datos.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
              {rooms.map(room => {
                const roomRegs = registrations.filter(r => r.room_id === room.id).length
                return (
                  <div 
                    key={room.id} 
                    style={{ 
                      background: 'var(--bg-tactical)', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '8px', 
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{room.name}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        📅 {new Date(room.meet_time).toLocaleDateString()} - {new Date(room.meet_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-approved" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                        👥 {roomRegs} Oyentes
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* EXPLORADOR DE DATOS DE USUARIOS (NUEVO TAB PANEL COMPLETO) */}
      <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Users size={20} style={{ color: 'var(--color-primary)' }} />
          Explorador de Datos y Detalle de Participantes
        </h3>

        {/* SELECTOR DE TABS DEL EXPLORADOR */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          borderBottom: '1px solid var(--color-border)', 
          marginBottom: '1.5rem', 
          paddingBottom: '0.5rem',
          flexWrap: 'wrap'
        }}>
          <button 
            className={`btn ${explorerTab === 'access' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => { setExplorerTab('access'); setSearchQuery(''); }}
          >
            <Clock size={16} /> Historial de Accesos
          </button>
          
          <button 
            className={`btn ${explorerTab === 'expositors' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => { setExplorerTab('expositors'); setSearchQuery(''); }}
          >
            <FileText size={16} /> Alumnos Expositores ({expositorsCount})
          </button>
          
          <button 
            className={`btn ${explorerTab === 'listeners' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            onClick={() => { setExplorerTab('listeners'); setSearchQuery(''); }}
          >
            <Users size={16} /> Alumnos Oyentes ({nonExpositorsCount})
          </button>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          
          {/* Campo de Búsqueda */}
          <div style={{ position: 'relative', flexGrow: 1, maxWidth: '400px' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.25rem', fontSize: '0.85rem' }}
              placeholder={
                explorerTab === 'access' ? "Buscar por nombre o correo de ingreso..." :
                explorerTab === 'expositors' ? "Buscar expositor por nombre o correo..." :
                "Buscar alumno oyente..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtros específicos según el Tab */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {explorerTab === 'access' && (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Filter size={14} /> Rango:
                </span>
                <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                  <button 
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '0.75rem', 
                      background: accessTimeframe === 'day' ? 'var(--color-primary)' : 'transparent', 
                      color: accessTimeframe === 'day' ? '#0b0f19' : 'var(--color-text-muted)',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600'
                    }}
                    onClick={() => setAccessTimeframe('day')}
                  >
                    Hoy ({uniqueUsersToday})
                  </button>
                  <button 
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '0.75rem', 
                      background: accessTimeframe === 'week' ? 'var(--color-primary)' : 'transparent', 
                      color: accessTimeframe === 'week' ? '#0b0f19' : 'var(--color-text-muted)',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600'
                    }}
                    onClick={() => setAccessTimeframe('week')}
                  >
                    Semana ({uniqueUsersThisWeek})
                  </button>
                  <button 
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '0.75rem', 
                      background: accessTimeframe === 'month' ? 'var(--color-primary)' : 'transparent', 
                      color: accessTimeframe === 'month' ? '#0b0f19' : 'var(--color-text-muted)',
                      border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600'
                    }}
                    onClick={() => setAccessTimeframe('month')}
                  >
                    Mes ({uniqueUsersThisMonth})
                  </button>
                </div>
              </>
            )}

            {explorerTab === 'expositors' && (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Filter size={14} /> Estado Ficha:
                </span>
                <select
                  className="form-input"
                  style={{ padding: '0.25rem 2rem 0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos ({cases.length})</option>
                  <option value="draft">Borrador ({draftsCount})</option>
                  <option value="submitted">Entregado ({submittedCount})</option>
                  <option value="observed">Observado ({observedCount})</option>
                  <option value="approved">Aprobado ({approvedCount})</option>
                </select>
              </>
            )}

            {explorerTab === 'listeners' && (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Filter size={14} /> Registro Meet:
                </span>
                <select
                  className="form-input"
                  style={{ padding: '0.25rem 2rem 0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                  value={regFilter}
                  onChange={(e) => setRegFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="registered">Registrado a Sala(s)</option>
                  <option value="unregistered">Inactivo - Sin Salas</option>
                </select>
              </>
            )}

          </div>
        </div>

        {/* TABLA PRINCIPAL DEL EXPLORADOR */}
        <div style={{ flexGrow: 1, overflowX: 'auto' }}>
          
          {/* TAB 1: HISTORIAL DE ACCESOS */}
          {explorerTab === 'access' && (
            <table className="custom-table" style={{ fontSize: '0.85rem', width: '100%', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Participante</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Frecuencia en Rango</th>
                  <th>Último Acceso Registrado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccessList.map(item => (
                  <tr key={item.user_id}>
                    <td style={{ fontWeight: '600' }}>{item.fullName}</td>
                    <td>{item.email}</td>
                    <td>
                      <span className={`badge ${
                        item.role === 'admin' ? 'badge-approved' : 
                        item.role === 'teacher' ? 'badge-submitted' : 
                        'badge-draft'
                      }`} style={{ fontSize: '0.65rem' }}>
                        {item.role === 'admin' ? 'Administrador' : item.role === 'teacher' ? 'Docente' : 'Alumno'}
                      </span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary-hover)' }}>
                      {item.count} {item.count === 1 ? 'ingreso' : 'ingresos'}
                    </td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(item.latestFecha).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredAccessList.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                      No se encontraron registros de accesos para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 2: ALUMNOS EXPOSITORES (CON FICHA) */}
          {explorerTab === 'expositors' && (
            <table className="custom-table" style={{ fontSize: '0.85rem', width: '100%', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Correo</th>
                  <th>Estado Caso</th>
                  <th>Club / Institución</th>
                  <th>Última Modificación</th>
                  <th style={{ textSelf: 'right', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpositorsList.map(item => (
                  <tr key={item.student.id}>
                    <td style={{ fontWeight: '600' }}>{item.student.full_name || 'Desconocido'}</td>
                    <td>{item.student.email}</td>
                    <td>
                      <span className={`badge badge-${item.case.status}`}>
                        {item.case.status === 'draft' ? 'Borrador' : 
                         item.case.status === 'submitted' ? 'Entregado' : 
                         item.case.status === 'observed' ? 'Observado' : 
                         'Aprobado'}
                      </span>
                    </td>
                    <td>{item.case.club_institution || 'No especificado'}</td>
                    <td style={{ color: 'var(--color-text-muted)' }}>
                      {item.case.updated_at ? new Date(item.case.updated_at).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '0.25rem' }}
                        onClick={() => setSelectedCase(item.case)}
                      >
                        <Eye size={12} /> Ver Ficha
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExpositorsList.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                      No se encontraron alumnos expositores que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* TAB 3: ALUMNOS OYENTES (SIN FICHA) */}
          {explorerTab === 'listeners' && (
            <table className="custom-table" style={{ fontSize: '0.85rem', width: '100%', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Correo</th>
                  <th>Fecha Registro Plataforma</th>
                  <th>Inscrito a Salas de Meet</th>
                  <th>Participación</th>
                </tr>
              </thead>
              <tbody>
                {filteredListenersList.map(item => {
                  const hasRegs = item.registeredRooms.length > 0
                  return (
                    <tr key={item.student.id}>
                      <td style={{ fontWeight: '600' }}>{item.student.full_name || 'Desconocido'}</td>
                      <td>{item.student.email}</td>
                      <td style={{ color: 'var(--color-text-muted)' }}>
                        {item.student.created_at ? new Date(item.student.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        {hasRegs ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {item.registeredRooms.map(room => (
                              <span 
                                key={room.id} 
                                className="badge badge-submitted" 
                                style={{ fontSize: '0.65rem', textTransform: 'none', padding: '0.15rem 0.5rem' }}
                                title={new Date(room.meet_time).toLocaleString()}
                              >
                                👥 {room.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="badge badge-draft" style={{ fontSize: '0.65rem', textTransform: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            Sin salas de Meet
                          </span>
                        )}
                      </td>
                      <td>
                        {hasRegs ? (
                          <span style={{ color: 'var(--color-primary-hover)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <UserCheck size={14} /> Oyente Activo
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Info size={14} /> Inactivo
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filteredListenersList.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                      No se encontraron alumnos oyentes que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>

      {/* MODAL DETALLADO PARA VISUALIZAR CASO DEL ALUMNO (EXPOSITOR) */}
      {selectedCase && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg), 0 10px 40px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.25s ease-out'
          }}>
            
            {/* Modal Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '1.25rem 2rem', 
              borderBottom: '1px solid var(--color-border)' 
            }}>
              <div>
                <span className={`badge badge-${selectedCase.status}`} style={{ marginBottom: '0.25rem' }}>
                  {selectedCase.status === 'draft' ? 'Borrador' : 
                   selectedCase.status === 'submitted' ? 'Entregado' : 
                   selectedCase.status === 'observed' ? 'Observado' : 
                   'Aprobado'}
                </span>
                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Ficha Técnica de Expositor: {
                    profiles.find(p => p.id === selectedCase.student_id)?.full_name || 'Alumno'
                  }
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer',
                  padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-main)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Scroll */}
            <div style={{ 
              padding: '2rem', 
              overflowY: 'auto', 
              flexGrow: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '2rem' 
            }}>
              
              {/* Sección 1: Datos de Contexto */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ marginBottom: 0, padding: '1.25rem', background: 'var(--bg-tactical)' }}>
                  <h4 style={{ color: 'var(--color-primary-hover)', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Info size={14} /> Club / Institución
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                    {selectedCase.club_institution || 'No especificado'}
                  </p>
                </div>
                
                {selectedCase.student_whatsapp && (
                  <div className="card" style={{ marginBottom: 0, padding: '1.25rem', background: 'var(--bg-tactical)' }}>
                    <h4 style={{ color: 'var(--color-primary-hover)', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ fontSize: '1rem' }}>💬</span> WhatsApp del Alumno
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)' }}>
                      <a 
                        href={`https://wa.me/${selectedCase.student_whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-primary-hover)', textDecoration: 'underline', fontWeight: '600' }}
                      >
                        {selectedCase.student_whatsapp} (Chat directo)
                      </a>
                    </p>
                  </div>
                )}
                
                <div className="card" style={{ marginBottom: 0, padding: '1.25rem', background: 'var(--bg-tactical)' }}>
                  <h4 style={{ color: 'var(--color-primary-hover)', fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={14} /> Contexto Competitivo
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                    {selectedCase.competitive_context || 'No especificado'}
                  </p>
                </div>
              </div>

              {/* Sección 2: Fortalezas, Limitaciones y Funcionamiento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ marginBottom: 0, padding: '1rem', background: 'var(--bg-input)' }}>
                  <h5 style={{ color: 'var(--color-primary-hover)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Fortalezas del Equipo</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                    {selectedCase.team_strengths || '-'}
                  </p>
                </div>
                <div className="card" style={{ marginBottom: 0, padding: '1rem', background: 'var(--bg-input)' }}>
                  <h5 style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Limitaciones</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                    {selectedCase.team_limitations || '-'}
                  </p>
                </div>
                <div className="card" style={{ marginBottom: 0, padding: '1rem', background: 'var(--bg-input)' }}>
                  <h5 style={{ color: 'var(--color-accent)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Funcionamiento General</h5>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', whiteSpace: 'pre-wrap' }}>
                    {selectedCase.team_functioning || '-'}
                  </p>
                </div>
              </div>

              {/* Sección 3: Obligaciones por puesto */}
              {selectedCase.player_characteristics && selectedCase.player_characteristics.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={16} style={{ color: 'var(--color-primary-hover)' }} />
                    Obligaciones y Características por Puesto
                  </h4>
                  <table className="custom-table" style={{ fontSize: '0.8rem', width: '100%', marginBottom: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '20%' }}>Puesto / Dorsal</th>
                        <th style={{ width: '40%' }}>Obligación Defensiva</th>
                        <th style={{ width: '40%' }}>Obligación Ofensiva</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCase.player_characteristics.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{row.player || `Jugador ${idx + 1}`}</td>
                          <td>{row.defensive_duty || '-'}</td>
                          <td>{row.offensive_duty || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sección 4: Cancha Táctica */}
              <div>
                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={16} style={{ color: 'var(--color-primary-hover)' }} />
                  Posiciones y Alineación Táctica
                </h4>
                <TacticalPitch lineup={selectedCase.tactical_lineup || []} readOnly={true} />
              </div>

              {/* Sección 5: Problema, Preguntas y Soluciones */}
              <div style={{ background: 'var(--bg-tactical)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-primary-hover)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HelpCircle size={16} />
                  Situaciones de Mayor Dificultad
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>1. Problema Identificado:</strong>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.25rem' }}>
                      {selectedCase.difficulty_problem || 'No especificado'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '0.5rem' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>2. Preguntas para el Alumno:</strong>
                      <ol style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
                        {(selectedCase.difficulty_questions || []).map((q, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{q || '-'}</li>)}
                      </ol>
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>3. Posibles Respuestas/Soluciones:</strong>
                      <ol style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '0.25rem', paddingLeft: '1.25rem' }}>
                        {(selectedCase.difficulty_solutions || []).map((s, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{s || '-'}</li>)}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección 6: Material de Video */}
              <div>
                <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Play size={16} style={{ color: 'var(--color-primary-hover)' }} />
                  Material de Video ({selectedCase.video_option === 'A' ? 'Cortes Editados' : 'Partido Segmentado'})
                </h4>
                
                {selectedCase.video_option === 'A' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(selectedCase.video_cuts || []).map((cut, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <div>
                          <strong>Corte {idx + 1}:</strong> {cut.description || 'Sin descripción'}
                        </div>
                        {cut.link && (
                          <a href={cut.link} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                            Ver Video
                          </a>
                        )}
                      </div>
                    ))}
                    {(!selectedCase.video_cuts || selectedCase.video_cuts.length === 0) && (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>No se agregaron cortes de video.</p>
                    )}
                  </div>
                ) : (
                  <div>
                    {selectedCase.video_full_match?.link ? (
                      <a href={selectedCase.video_full_match.link} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                        Ver Partido Completo
                      </a>
                    ) : (
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>No hay enlace al partido completo.</p>
                    )}
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Segmentos del Partido:</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {(selectedCase.video_full_match?.fragments || []).map((frag, idx) => (
                        <div key={idx} style={{ background: 'var(--bg-input)', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                          <strong>{frag.name || `Tramo ${idx + 1}`}:</strong> de {frag.start || '00:00'} a {frag.end || '00:00'}
                          {frag.description && <div style={{ color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{frag.description}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección 7: Devolución Docente (si existe) */}
              {(selectedCase.teacher_feedback || selectedCase.meet_link) && (
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--color-primary-hover)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} /> Devolución y Asignación de Meet
                  </h4>
                  {selectedCase.meet_link && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Enlace de Google Meet:</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <a href={selectedCase.meet_link} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary-hover)', fontSize: '0.9rem', fontWeight: '600' }}>
                          {selectedCase.meet_link}
                        </a>
                      </div>
                      {selectedCase.meet_time && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          📅 {new Date(selectedCase.meet_time).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedCase.teacher_feedback && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Comentarios del Docente:</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-main)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                        {selectedCase.teacher_feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div style={{ 
              padding: '1.25rem 2rem', 
              borderTop: '1px solid var(--color-border)', 
              display: 'flex', 
              justifyContent: 'flex-end',
              background: 'var(--bg-surface)'
            }}>
              <button className="btn btn-secondary" onClick={() => setSelectedCase(null)}>
                Cerrar Visualizador
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
