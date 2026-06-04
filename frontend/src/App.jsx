import React, { useEffect, useState, useRef } from 'react'
import api from './api'
import DashboardStudent from './pages/DashboardStudent'
import DashboardTeacher from './pages/DashboardTeacher'
import DashboardAdmin from './pages/DashboardAdmin'
import DashboardStats from './pages/DashboardStats'
import { Layout, LogOut, Shield, FileText, Users, Eye, EyeOff, Sparkles, BarChart3, RefreshCw } from 'lucide-react'

export default function App() {
  const [sessionToken, setSessionToken] = useState(localStorage.getItem('token') || null)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [activeTab, setActiveTab] = useState('student') // 'student', 'teacher', 'admin'
  const [studentSubTab, setStudentSubTab] = useState('info')
  const [studentWantsToExpose, setStudentWantsToExpose] = useState(false)
  
  // SSO Moodle State
  const [ssoLoading, setSsoLoading] = useState(false)
  const [ssoError, setSsoError] = useState('')
  const ssoStarted = useRef(false)

  // Moodle Connection State
  const [lastMoodleSync, setLastMoodleSync] = useState(null)
  const [loadingSync, setLoadingSync] = useState(false)

  const fetchMoodleStatus = async () => {
    if (!sessionToken) return
    setLoadingSync(true)
    try {
      const response = await api.get('/stats/moodle-status')
      setLastMoodleSync(response.data.last_access)
    } catch (err) {
      console.error('Error al obtener estado de Moodle:', err)
    } finally {
      setLoadingSync(false)
    }
  }

  useEffect(() => {
    if (sessionToken) {
      fetchMoodleStatus()
      const interval = setInterval(fetchMoodleStatus, 180000) // 3 minutos
      return () => clearInterval(interval)
    }
  }, [sessionToken])

  const getMoodleStatusDetails = () => {
    if (!lastMoodleSync) {
      return {
        color: '#ef4444', // Rojo
        shadow: '0 0 10px rgba(239, 68, 68, 0.4)',
        text: 'Desconectado',
        timeText: 'Sin registros de accesos'
      }
    }

    const lastSyncDate = new Date(lastMoodleSync)
    const now = new Date()
    const elapsedMs = now.getTime() - lastSyncDate.getTime()
    const elapsedHours = elapsedMs / (1000 * 60 * 60)

    const day = String(lastSyncDate.getDate()).padStart(2, '0')
    const month = String(lastSyncDate.getMonth() + 1).padStart(2, '0')
    const year = lastSyncDate.getFullYear()
    const hours = String(lastSyncDate.getHours()).padStart(2, '0')
    const minutes = String(lastSyncDate.getMinutes()).padStart(2, '0')
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`

    if (elapsedHours <= 2) {
      return {
        color: '#10b981', // Verde
        shadow: '0 0 10px rgba(16, 185, 129, 0.4)',
        text: 'Moodle Activo',
        timeText: `Sincronizado: ${formattedDate}`
      }
    } else if (elapsedHours <= 5) {
      return {
        color: '#f59e0b', // Naranja
        shadow: '0 0 10px rgba(245, 158, 11, 0.4)',
        text: 'Moodle Demorado',
        timeText: `Último acceso: ${formattedDate}`
      }
    } else {
      return {
        color: '#ef4444', // Rojo
        shadow: '0 0 10px rgba(239, 68, 68, 0.4)',
        text: 'Moodle Inactivo',
        timeText: `Último acceso: ${formattedDate}`
      }
    }
  }

  const MoodleStatusBadge = () => {
    const details = getMoodleStatusDetails()
    return (
      <div style={{
        position: 'fixed',
        top: '1.25rem',
        right: '2.5rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.25rem',
        pointerEvents: 'auto'
      }}>
        <button 
          onClick={fetchMoodleStatus}
          disabled={loadingSync}
          style={{
            background: 'rgba(19, 26, 46, 0.7)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${details.color}80`,
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.85rem',
            color: 'var(--color-text-main)',
            fontFamily: 'var(--font-title)',
            fontWeight: '600',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            boxShadow: `0 4px 12px rgba(0, 0, 0, 0.3), ${details.shadow}`,
            transition: 'var(--transition-normal)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.borderColor = details.color;
            e.currentTarget.style.background = 'rgba(26, 35, 61, 0.85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.borderColor = `${details.color}80`;
            e.currentTarget.style.background = 'rgba(19, 26, 46, 0.7)';
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: details.color,
            boxShadow: `0 0 8px ${details.color}`,
            display: 'inline-block'
          }}></span>
          Moodle
          {loadingSync && <RefreshCw className="animate-spin" size={12} style={{ marginLeft: '4px', color: 'var(--color-text-muted)' }} />}
        </button>
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-body)',
          fontWeight: '500',
          letterSpacing: '0.2px',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          {details.timeText}
        </span>
      </div>
    )
  }

  // Auth Form State (Fallback)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Maradona2026')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [dniPassport, setDniPassport] = useState('')
  const [career, setCareer] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Estados para cambiar contraseña
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')

  // Capturar e iniciar sesión vía SSO desde Moodle
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const username = params.get('username')
    const emailParam = params.get('email')
    const firstname = params.get('firstname')
    const lastname = params.get('lastname')
    const courseId = params.get('course_id')
    const hash = params.get('hash')

    if (username && emailParam && firstname && lastname && courseId && hash) {
      if (ssoStarted.current) return
      ssoStarted.current = true
      const runSSO = async () => {
        setSsoLoading(true)
        setSsoError('')
        try {
          const response = await api.post('/auth/sso', {
            username,
            email: emailParam,
            firstname,
            lastname,
            course_id: courseId,
            hash
          })

          const { token, user } = response.data
          if (token) {
            localStorage.setItem('token', token)
            setSessionToken(token)
            setProfile(user)
          }

          // Limpiar parámetros de la URL para una navegación limpia
          window.history.replaceState({}, document.title, window.location.pathname)

        } catch (err) {
          console.error('Error en SSO de Moodle:', err)
          setSsoError(err.response?.data?.error || err.message || 'Error desconocido al validar acceso.')
        } finally {
          setSsoLoading(false)
        }
      }

      runSSO()
    }
  }, [])

  // Cargar perfil del usuario
  useEffect(() => {
    if (!sessionToken) {
      setProfile(null)
      setProfileError('')
      setLoadingProfile(false)
      return
    }

    const loadProfile = async () => {
      setLoadingProfile(true)
      setProfileError('')
      try {
        const response = await api.get('/users/profile')
        const data = response.data

        setProfile(data)
        // Redirigir a su pestaña principal según su rol
        if (data.role === 'admin') {
          setActiveTab('admin')
        } else if (data.role === 'teacher') {
          setActiveTab('teacher')
        } else {
          setActiveTab('student')
        }
      } catch (err) {
        console.error('Error loading profile:', err)
        setProfileError(err.response?.data?.error || err.message)
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout()
        }
      } finally {
        setLoadingProfile(false)
      }
    }

    // Si ya lo tenemos (del SSO login), no lo cargamos dos veces
    if (!profile) {
      loadProfile()
    } else {
      setLoadingProfile(false)
    }
  }, [sessionToken])

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user } = response.data
      if (token) {
        localStorage.setItem('token', token)
        setSessionToken(token)
        setProfile(user)
        
        if (user.role === 'admin') setActiveTab('admin')
        else if (user.role === 'teacher') setActiveTab('teacher')
        else setActiveTab('student')
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Error al iniciar sesión.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setSessionToken(null)
    setProfile(null)
    setActiveTab('student')
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordChangeError('Cambio de clave no disponible temporalmente.')
    // TODO: Implementar PATCH /api/users/password en el backend
  }

  if (ssoLoading) {
    return (
      <div className="auth-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="brand-logo" style={{ fontSize: '3rem', display: 'block', animation: 'pulse 1.5s infinite' }}>⚽</span>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', marginTop: '1rem' }}>Sincronizando acceso con Moodle...</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Validando tu matrícula y firma de seguridad</p>
        </div>
      </div>
    )
  }

  if (ssoError) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: '450px', borderLeft: '4px solid var(--color-error)' }}>
          <div className="brand-header">
            <span className="brand-logo">⚠️</span>
            <h1 className="brand-name" style={{ color: 'var(--color-error)' }}>Acceso Denegado</h1>
            <p className="brand-tagline">Validación de Moodle Fallida</p>
          </div>
          <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--color-text-main)' }}>
              {ssoError}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              Por favor, asegúrate de acceder al taller ingresando mediante los enlaces oficiales provistos dentro de tu curso de Moodle.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <a 
                href="https://wa.me/5491178544032" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary" 
                style={{ flexGrow: 1, justifyContent: 'center', color: '#34d399', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
              >
                💬 Soporte WhatsApp
              </a>
              <button 
                onClick={() => setSsoError('')} 
                className="btn btn-secondary"
                style={{ flexGrow: 1, justifyContent: 'center' }}
              >
                Volver al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionToken) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand-header">
            <span className="brand-logo">⚽</span>
            <h1 className="brand-name">La Oficina del Entrenador</h1>
            <p className="brand-tagline">Escuela Maradona Menotti</p>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', textAlign: 'center', marginBottom: '0.5rem' }}>
              {isSignUp ? 'Crear una cuenta de Alumno' : 'Iniciar Sesión'}
            </h3>

            {authError && (
              <div style={{ color: 'var(--color-error)', fontSize: '0.85rem', textAlign: 'center', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
                {authError}
              </div>
            )}

            {isSignUp && (
              <>
                <div style={{ 
                  color: 'var(--color-accent)', 
                  fontSize: '0.8rem', 
                  textAlign: 'center', 
                  padding: '0.5rem 0.75rem', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '6px',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  lineHeight: '1.4'
                }}>
                  📢 <strong>Favor de ingresar los mismos datos que utiliza en Quintttos</strong>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">DNI o Pasaporte</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: 12345678"
                    value={dniPassport}
                    onChange={(e) => setDniPassport(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Carrera que Cursa</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="Ej: Director Técnico de Fútbol"
                    value={career}
                    onChange={(e) => setCareer(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="alumno@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="form-input"
                  style={{ paddingRight: '2.5rem' }}
                  placeholder="******"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={authLoading}>
              {authLoading ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Ingresar'}
            </button>

            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', border: 'none' }}
              onClick={() => {
                setIsSignUp(!isSignUp)
                setAuthError('')
              }}
            >
              {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loadingProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: 'var(--color-text-muted)' }}>
        Cargando perfil...
      </div>
    )
  }

  return (
    <div className="app-container">
      {/* SIDEBAR TÁCTICO */}
      <aside className="sidebar">
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.75rem' }}>⚽</span>
            <span style={{ fontFamily: 'var(--font-title)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.5px' }}>OFICINA</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: '700', textTransform: 'uppercase', tracking: '1px' }}>
            Escuela Maradona Menotti
          </span>
        </div>

        <nav style={{ flexGrow: 1 }}>
          {/* Navegación según Rol */}
          <div className="nav-item active" style={{ cursor: 'default', background: 'transparent', paddingLeft: 0, color: 'var(--color-text-main)' }}>
            Menú de Navegación
          </div>

          <div 
            className={`nav-item ${activeTab === 'student' && studentSubTab === 'info' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('student')
              setStudentSubTab('info')
            }}
          >
            <FileText size={18} /> Presentación
          </div>

          {studentWantsToExpose && (
            <div 
              className={`nav-item ${activeTab === 'student' && studentSubTab === 'form' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('student')
                setStudentSubTab('form')
              }}
            >
              <FileText size={18} /> Mi Ficha Técnica
            </div>
          )}

          {(profile?.role === 'teacher' || profile?.role === 'admin') && (
            <div 
              className={`nav-item ${activeTab === 'teacher' ? 'active' : ''}`}
              onClick={() => setActiveTab('teacher')}
            >
              <Eye size={18} /> Revisión de Casos
            </div>
          )}

          {profile?.role === 'admin' && (
            <>
              <div 
                className={`nav-item ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <Shield size={18} /> Gestión de Roles
              </div>

              <div 
                className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                <BarChart3 size={18} /> Estadísticas
              </div>
            </>
          )}
        </nav>

        {/* Info del usuario logueado en pie de sidebar */}
        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name || 'Usuario'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.email}
            </div>
            {profileError && (
              <div style={{ fontSize: '0.7rem', color: 'var(--color-error)', marginTop: '0.25rem', wordBreak: 'break-all', background: 'rgba(239, 68, 68, 0.1)', padding: '4px', borderRadius: '4px' }}>
                Error DB: {profileError}
              </div>
            )}
            <div style={{ marginTop: '0.25rem' }}>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-approved' : profile?.role === 'teacher' ? 'badge-submitted' : 'badge-draft'}`} style={{ fontSize: '0.65rem' }}>
                {profile?.role === 'admin' ? 'Administrador' : profile?.role === 'teacher' ? 'Docente' : 'Alumno'}
              </span>
            </div>
          </div>

          {/* Formulario de cambio de contraseña */}
          {showPasswordChange ? (
            <form onSubmit={handleUpdatePassword} style={{ background: 'var(--bg-tactical)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-primary-hover)' }}>Nueva Contraseña</span>
              <input
                type="password"
                required
                placeholder="Mín. 6 caracteres"
                className="form-input"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {passwordChangeError && <span style={{ fontSize: '0.65rem', color: 'var(--color-error)' }}>{passwordChangeError}</span>}
              {passwordChangeSuccess && <span style={{ fontSize: '0.65rem', color: 'var(--color-success)' }}>{passwordChangeSuccess}</span>}
              
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem', flexGrow: 1 }} disabled={passwordChangeLoading}>
                  {passwordChangeLoading ? 'Guardando...' : 'Cambiar'}
                </button>
                <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setShowPasswordChange(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowPasswordChange(true)} 
              style={{ justifyContent: 'flex-start', padding: '0.4rem 0.75rem', fontSize: '0.8rem', borderStyle: 'dashed' }}
            >
              🔒 Cambiar Contraseña
            </button>
          )}

          <a 
            href="https://wa.me/5491178544032" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-secondary" 
            style={{ 
              justifyContent: 'flex-start', 
              padding: '0.5rem 0.75rem', 
              fontSize: '0.85rem',
              color: '#34d399',
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}
          >
            <span style={{ fontSize: '1.1rem', marginRight: '4px' }}>💬</span> Soporte WhatsApp
          </a>

          <button className="btn btn-secondary" onClick={handleLogout} style={{ justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ flexGrow: 1, backgroundColor: 'var(--bg-main)', height: '100vh', overflowY: 'auto', position: 'relative' }}>
        {sessionToken && <MoodleStatusBadge />}
        {activeTab === 'student' && (
          <DashboardStudent 
            user={profile} 
            profile={profile} 
            activeSubTab={studentSubTab} 
            setActiveSubTab={setStudentSubTab} 
            wantsToExpose={studentWantsToExpose} 
            setWantsToExpose={setStudentWantsToExpose} 
          />
        )}
        {activeTab === 'teacher' && <DashboardTeacher user={profile} profile={profile} />}
        {activeTab === 'admin' && <DashboardAdmin user={profile} onBackToDashboard={() => setActiveTab('student')} />}
        {activeTab === 'stats' && <DashboardStats onBackToDashboard={() => setActiveTab('student')} />}
      </main>
    </div>
  )
}
