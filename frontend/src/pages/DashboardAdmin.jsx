import React, { useEffect, useState } from 'react'
import api from '../api'
import { Users, Shield, ArrowLeft, RefreshCw, AlertCircle, Mail, Key, Check, Trash2, Ban, ShieldAlert, Unlock } from 'lucide-react'
import ModalAlert from '../components/ModalAlert'

export default function DashboardAdmin({ user, onBackToDashboard }) {
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newUserFormData, setNewUserFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student',
    dni: '',
    career: ''
  })
  const [creatingUser, setCreatingUser] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 30

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Sub-tabs de administración
  const [adminTab, setAdminTab] = useState('users') // 'users' | 'courses'

  // Estados para cursos Moodle autorizados
  const [coursesList, setCoursesList] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [newCourseId, setNewCourseId] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [savingCourse, setSavingCourse] = useState(false)

  // Estados para alertas custom
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('info')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/users')
      setUsersList(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar la lista de usuarios. Verifica tus permisos de Administrador.')
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    setLoadingCourses(true)
    setError('')
    try {
      const res = await api.get('/auth/courses')
      setCoursesList(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar la lista de cursos autorizados.')
    } finally {
      setLoadingCourses(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchCourses()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId)
    try {
      await api.put(`/users/${userId}/role`, { role: newRole })
      
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      
      setAlertTitle('Rol Actualizado')
      setAlertMessage('El rol del usuario se ha modificado correctamente.')
      setAlertType('success')
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage('Ocurrió un error al intentar cambiar el rol del usuario.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreatingUser(true)
    try {
      await api.post('/users', newUserFormData)
      
      setAlertTitle('Usuario Creado')
      setAlertMessage('El usuario ha sido creado correctamente.')
      setAlertType('success')
      setAlertOpen(true)
      
      setShowCreateModal(false)
      setNewUserFormData({
        full_name: '',
        email: '',
        password: '',
        role: 'student',
        dni: '',
        career: ''
      })
      
      fetchUsers()
    } catch (err) {
      console.error(err)
      setAlertTitle('Error al Crear')
      setAlertMessage(err.response?.data?.error || err.message || 'No se pudo crear el usuario.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setCreatingUser(false)
    }
  }

  const handleResendConfirmation = async (email) => {
    setAlertTitle('Aviso')
    setAlertMessage('La autenticación ahora se maneja exclusivamente a través de Moodle SSO. El correo no necesita ser confirmado.')
    setAlertType('info')
    setAlertOpen(true)
  }

  const handleManualConfirm = async (email) => {
    setAlertTitle('Aviso')
    setAlertMessage('La autenticación ahora se maneja exclusivamente a través de Moodle SSO. Esta acción ya no es necesaria.')
    setAlertType('info')
    setAlertOpen(true)
  }

  const handleResetPassword = async (email) => {
    setAlertTitle('Aviso')
    setAlertMessage('La autenticación ahora se maneja exclusivamente a través de Moodle SSO. La contraseña se gestiona en Moodle.')
    setAlertType('info')
    setAlertOpen(true)
  }

  const handleBanToggle = async (userId, email, currentBannedStatus) => {
    const actionText = currentBannedStatus ? 'habilitar el acceso' : 'restringir el acceso';
    if (!confirm(`¿Estás seguro de ${actionText} para el usuario ${email}?`)) return
    
    setUpdatingUserId(userId)
    try {
      await api.put(`/users/${userId}/ban`, { banned: !currentBannedStatus })
      
      setAlertTitle(currentBannedStatus ? 'Acceso Habilitado' : 'Acceso Restringido')
      setAlertMessage(currentBannedStatus 
        ? `Se ha habilitado nuevamente el acceso a la plataforma para ${email}.` 
        : `Se ha restringido el acceso a la plataforma para ${email} de forma permanente.`
      )
      setAlertType('success')
      setAlertOpen(true)
      
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentBannedStatus } : u))
    } catch (err) {
      console.error(err)
      setAlertTitle('Error de Acceso')
      setAlertMessage(err.message || 'No se pudo modificar el estado de restricción del usuario.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userId, email) => {
    if (!confirm(`⚠️ ¡ATENCIÓN! ¿Estás completamente seguro de ELIMINAR al usuario ${email} de forma definitiva? \n\nEsta acción borrará toda su cuenta, perfil y fichas tácticas asociadas. No se puede deshacer.`)) return
    
    setUpdatingUserId(userId)
    try {
      await api.delete(`/users/${userId}`)
      
      setAlertTitle('Usuario Eliminado')
      setAlertMessage(`La cuenta y todos los datos asociados de ${email} han sido eliminados de forma permanente.`)
      setAlertType('success')
      setAlertOpen(true)
      
      setUsersList(prev => prev.filter(u => u.id !== userId))
    } catch (err) {
      console.error(err)
      setAlertTitle('Error al Eliminar')
      setAlertMessage(err.message || 'No se pudo eliminar el usuario de la plataforma.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleAddCourse = async (e) => {
    e.preventDefault()
    if (!newCourseId || !newCourseName) return
    setSavingCourse(true)
    try {
      await api.post('/auth/courses', {
        moodleCourseId: parseInt(newCourseId),
        courseName: newCourseName
      })
      
      setCoursesList(prev => [...prev, { moodle_course_id: parseInt(newCourseId), course_name: newCourseName }])
      setNewCourseId('')
      setNewCourseName('')
      
      setAlertTitle('Curso Autorizado')
      setAlertMessage('El curso ha sido añadido con éxito a la lista de accesos permitidos.')
      setAlertType('success')
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage(err.message || 'Error al intentar autorizar el curso.')
      setAlertType('error')
      setAlertOpen(true)
    } finally {
      setSavingCourse(false)
    }
  }

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('¿Estás seguro de desautorizar este curso? Los alumnos de este curso de Moodle ya no podrán ingresar a la plataforma.')) return
    try {
      await api.delete(`/auth/courses/${courseId}`)
      
      setCoursesList(prev => prev.filter(c => c.moodle_course_id !== courseId))
      
      setAlertTitle('Curso Eliminado')
      setAlertMessage('El curso ha sido eliminado de la lista de accesos permitidos.')
      setAlertType('success')
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error')
      setAlertMessage('Error al intentar eliminar el curso de la lista.')
      setAlertType('error')
      setAlertOpen(true)
    }
  }

  const filteredUsers = usersList.filter(u => {
    const term = searchTerm.toLowerCase()
    const nameMatch = u.full_name && u.full_name.toLowerCase().includes(term)
    const emailMatch = u.email && u.email.toLowerCase().includes(term)
    return nameMatch || emailMatch
  })

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  return (
    <div className="main-content" style={{ maxWidth: '1200px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={32} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)' }}>Panel de Administración</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Gestión de permisos y asignación de roles de usuario</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Recargar
          </button>
          <button className="btn btn-secondary" onClick={onBackToDashboard}>
            <ArrowLeft size={16} /> Volver al Inicio
          </button>
        </div>
      </div>

      {/* Selectores de sub-pestañas de Administración */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${adminTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setAdminTab('users')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
        >
          <Users size={16} /> Usuarios Registrados
        </button>
        <button 
          className={`btn ${adminTab === 'courses' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setAdminTab('courses')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
        >
          🔑 Cursos Moodle Autorizados
        </button>
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-error)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
          <p style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      {adminTab === 'users' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} style={{ color: 'var(--color-primary-hover)' }} />
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', margin: 0 }}>Usuarios de la Plataforma</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input, rgba(0,0,0,0.05))', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '0.25rem 0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, apellido o correo..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--color-text-main)', fontSize: '0.85rem', width: '250px' }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                onClick={() => setShowCreateModal(true)}
              >
                ➕ Nuevo Usuario
              </button>
            </div>
          </div>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Cargando usuarios...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No se encontraron usuarios registrados.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ marginBottom: 0 }}>
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>Correo Electrónico</th>
                    <th>Fecha de Registro</th>
                    <th>Estado Correo</th>
                    <th>Rol Actual</th>
                    <th>Seguridad / Acciones</th>
                    <th style={{ textAlign: 'right' }}>Cambiar Permiso</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} style={{ background: u.banned ? 'rgba(239, 68, 68, 0.03)' : 'inherit' }}>
                      <td style={{ fontWeight: '500', color: u.banned ? 'var(--color-error)' : 'var(--color-text-main)' }}>
                        <div>{u.full_name || 'Sin Nombre'}</div>
                        {(u.dni_passport || u.career) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 'normal', marginTop: '0.25rem' }}>
                            {u.dni_passport && `DNI: ${u.dni_passport}`}
                            {u.dni_passport && u.career && ' | '}
                            {u.career && `Carrera: ${u.career}`}
                          </div>
                        )}
                        {u.banned && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 'bold', marginTop: '0.25rem' }}>
                            ⚠️ ACCESO RESTRINGIDO
                          </span>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {u.email_confirmed ? (
                            <span className="badge badge-approved" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Check size={10} /> Confirmado
                            </span>
                          ) : (
                            <>
                              <span className="badge badge-observed" style={{ fontSize: '0.7rem' }}>
                                Pendiente
                              </span>
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', height: '22px', background: 'var(--bg-input)' }}
                                  title="Reenviar correo de confirmación"
                                  onClick={() => handleResendConfirmation(u.email)}
                                >
                                  Reenviar
                                </button>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '2px 6px', fontSize: '0.7rem', height: '22px', background: 'var(--color-primary-dark)', color: 'white' }}
                                  title="Confirmar directamente en la base de datos sin enviar correo"
                                  onClick={() => handleManualConfirm(u.email)}
                                >
                                  Confirmar Manual
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-approved' : u.role === 'teacher' ? 'badge-submitted' : 'badge-draft'}`} style={{ fontSize: '0.7rem' }}>
                          {u.role === 'admin' ? 'Administrador' : u.role === 'teacher' ? 'Docente' : 'Alumno'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-warning)', border: '1px solid var(--color-border)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            title="Restablecer contraseña del usuario a Maradona2026"
                            onClick={() => handleResetPassword(u.email)}
                          >
                            <Key size={12} /> Resetear clave
                          </button>
                          
                          {u.id !== user.id ? (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '0.75rem', 
                                  color: u.banned ? 'var(--color-success)' : 'var(--color-warning)', 
                                  border: '1px solid var(--color-border)', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem',
                                  background: u.banned ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)'
                                }}
                                title={u.banned ? 'Habilitar acceso a la plataforma' : 'Restringir/Bloquear acceso a la plataforma'}
                                onClick={() => handleBanToggle(u.id, u.email, u.banned)}
                                disabled={updatingUserId === u.id}
                              >
                                {u.banned ? <Unlock size={12} /> : <Ban size={12} />}
                                {u.banned ? 'Habilitar' : 'Restringir'}
                              </button>
                              
                              <button 
                                className="btn btn-secondary" 
                                style={{ 
                                  padding: '4px 8px', 
                                  fontSize: '0.75rem', 
                                  color: 'var(--color-error)', 
                                  border: '1px solid var(--color-border)', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '0.25rem',
                                  background: 'rgba(239, 68, 68, 0.05)'
                                }}
                                title="Eliminar usuario permanentemente de la base de datos"
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                disabled={updatingUserId === u.id}
                              >
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                              (Tu cuenta)
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <select
                          className="form-input"
                          style={{ width: 'auto', display: 'inline-block', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                          value={u.role}
                          disabled={updatingUserId === u.id || u.id === user.id}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        >
                          <option value="student">Alumno</option>
                          <option value="teacher">Docente</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {totalPages > 1 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1rem 1.5rem',
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    Mostrando {(currentPage - 1) * rowsPerPage + 1} a {Math.min(currentPage * rowsPerPage, filteredUsers.length)} de {filteredUsers.length} usuarios
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem' }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      &laquo; Anterior
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 500, padding: '0 0.5rem' }}>
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem' }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Siguiente &raquo;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {adminTab === 'courses' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Formulario Agregar */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔑 Autorizar Curso Moodle</span>
            </h3>
            <form onSubmit={handleAddCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>ID del Curso Moodle (Numérico)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 12"
                  className="form-input"
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Nombre del Curso / Cohorte</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Taller La Oficina del Entrenador - Mayo"
                  className="form-input"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={savingCourse}>
                {savingCourse ? 'Autorizando...' : 'Autorizar Acceso'}
              </button>
            </form>
          </div>

          {/* Tabla Listado */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', margin: 0 }}>Cursos Permitidos</h3>
              <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }} onClick={fetchCourses} disabled={loadingCourses}>
                <RefreshCw size={12} className={loadingCourses ? 'animate-spin' : ''} /> Actualizar
              </button>
            </div>

            {loadingCourses ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Cargando cursos autorizados...
              </div>
            ) : coursesList.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                No hay cursos Moodle autorizados. Todos los accesos vía SSO Moodle serán denegados.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ marginBottom: 0, fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>ID Curso Moodle</th>
                      <th>Nombre del Curso / Cohorte</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursesList.map((c) => (
                      <tr key={c.moodle_course_id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--color-primary-hover)' }}>{c.moodle_course_id}</td>
                        <td style={{ fontWeight: '500' }}>{c.course_name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--color-error)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--color-border)' }}
                            onClick={() => handleDeleteCourse(c.moodle_course_id)}
                          >
                            <Trash2 size={12} /> Desautorizar
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
      )}

      {/* Modal Nuevo Usuario */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '400px', padding: '1.5rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', marginBottom: '1.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>➕ Crear Nuevo Usuario</span>
            </h3>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Nombre Completo</label>
                <input type="text" className="form-input" required placeholder="Ej: Juan Pérez" value={newUserFormData.full_name} onChange={e => setNewUserFormData({...newUserFormData, full_name: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Correo Electrónico</label>
                <input type="email" className="form-input" required placeholder="Ej: correo@ejemplo.com" value={newUserFormData.email} onChange={e => setNewUserFormData({...newUserFormData, email: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Contraseña Temporal</label>
                <input type="password" className="form-input" required placeholder="Mínimo 6 caracteres" value={newUserFormData.password} onChange={e => setNewUserFormData({...newUserFormData, password: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Rol de la Cuenta</label>
                <select className="form-input" value={newUserFormData.role} onChange={e => setNewUserFormData({...newUserFormData, role: e.target.value})}>
                  <option value="student">Alumno</option>
                  <option value="teacher">Docente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>DNI (Opcional)</label>
                  <input type="text" className="form-input" placeholder="Ej: 12345678" value={newUserFormData.dni} onChange={e => setNewUserFormData({...newUserFormData, dni: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Carrera (Opcional)</label>
                  <input type="text" className="form-input" placeholder="Ej: DT" value={newUserFormData.career} onChange={e => setNewUserFormData({...newUserFormData, career: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={creatingUser}>{creatingUser ? 'Guardando...' : 'Crear Cuenta'}</button>
              </div>
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
        onClose={() => setAlertOpen(false)}
      />
    </div>
  )
}
