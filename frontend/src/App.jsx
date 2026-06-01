import React, { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import DashboardStudent from './pages/DashboardStudent'
import DashboardTeacher from './pages/DashboardTeacher'
import DashboardAdmin from './pages/DashboardAdmin'
import DashboardStats from './pages/DashboardStats'
import { Layout, LogOut, Shield, FileText, Users, Eye, Sparkles, BarChart3 } from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [activeTab, setActiveTab] = useState('student') // 'student', 'teacher', 'admin'
  const [studentSubTab, setStudentSubTab] = useState('info')
  const [studentWantsToExpose, setStudentWantsToExpose] = useState(false)
  
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Maradona2026')
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

  // Escuchar cambios de sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Cargar perfil del usuario
  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setProfileError('')
      setLoadingProfile(false)
      return
    }

    const loadProfile = async () => {
      setLoadingProfile(true)
      setProfileError('')
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (error) throw error

        if (!data) {
          // El perfil no existe (usuario antiguo o falla del trigger). Lo creamos.
          const isSystemAdmin = session.user.email === 'sistemas@maradonamenotti.ar' || session.user.email === 'sistemas@maradonamenotti.com.ar'
          const newProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || 'Usuario',
            role: isSystemAdmin ? 'admin' : 'student',
            dni_passport: session.user.user_metadata?.dni_passport || null,
            career: session.user.user_metadata?.career || null
          }

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()

          if (insertError) throw insertError
          data = inserted
        }

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
        setProfileError(err.message || JSON.stringify(err))
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [session])

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              dni_passport: dniPassport,
              career: career
            }
          }
        })
        if (error) throw error
        alert('Registro exitoso. Revisa tu casilla si se requiere confirmación.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
      }
    } catch (err) {
      console.error(err)
      setAuthError(err.message || 'Error en el proceso de autenticación.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setPasswordChangeError('')
    setPasswordChangeSuccess('')
    if (newPassword.length < 6) {
      setPasswordChangeError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setPasswordChangeLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPasswordChangeSuccess('Contraseña cambiada con éxito.')
      setNewPassword('')
      setTimeout(() => {
        setShowPasswordChange(false)
        setPasswordChangeSuccess('')
      }, 2500)
    } catch (err) {
      console.error(err)
      setPasswordChangeError(err.message || 'Error al cambiar contraseña.')
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  if (!session) {
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
              <input
                type="password"
                required
                className="form-input"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
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
              {profile?.email || session?.user?.email}
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
      <main style={{ flexGrow: 1, backgroundColor: 'var(--bg-main)', height: '100vh', overflowY: 'auto' }}>
        {activeTab === 'student' && (
          <DashboardStudent 
            user={session.user} 
            profile={profile} 
            activeSubTab={studentSubTab} 
            setActiveSubTab={setStudentSubTab} 
            wantsToExpose={studentWantsToExpose} 
            setWantsToExpose={setStudentWantsToExpose} 
          />
        )}
        {activeTab === 'teacher' && <DashboardTeacher user={session.user} profile={profile} />}
        {activeTab === 'admin' && <DashboardAdmin user={session.user} onBackToDashboard={() => setActiveTab('student')} />}
        {activeTab === 'stats' && <DashboardStats onBackToDashboard={() => setActiveTab('student')} />}
      </main>
    </div>
  )
}
