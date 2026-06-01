import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { Users, Shield, ArrowLeft, RefreshCw, AlertCircle, Mail, Key, Check, Trash2, Ban, ShieldAlert, Unlock } from 'lucide-react'
import ModalAlert from '../components/ModalAlert'

export default function DashboardAdmin({ user, onBackToDashboard }) {
  const [usersList, setUsersList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingUserId, setUpdatingUserId] = useState(null)

  // Estados para alertas custom
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('')
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState('info')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setUsersList(data || [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar la lista de usuarios. Verifica tus permisos de Administrador.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      
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

  const handleResendConfirmation = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })
      if (error) throw error
      
      setAlertTitle('Correo Reenviado')
      setAlertMessage(`El correo de confirmación de registro ha sido reenviado a ${email} con éxito.`)
      setAlertType('success')
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error de Envío')
      setAlertMessage(err.message || 'No se pudo reenviar el correo de confirmación.')
      setAlertType('error')
      setAlertOpen(true)
    }
  }

  const handleManualConfirm = async (email) => {
    if (!confirm(`¿Estás seguro de confirmar manualmente el correo ${email} directamente en la base de datos?`)) return
    try {
      const { error } = await supabase.rpc('admin_confirm_user_email', { user_email: email })
      if (error) throw error
      
      setAlertTitle('Usuario Confirmado')
      setAlertMessage(`El correo de ${email} ha sido verificado y confirmado manualmente con éxito en la base de datos.`)
      setAlertType('success')
      setAlertOpen(true)
      
      setUsersList(prev => prev.map(u => u.email === email ? { ...u, email_confirmed: true } : u))
    } catch (err) {
      console.error(err)
      setAlertTitle('Error de Confirmación')
      setAlertMessage(err.message || 'No se pudo confirmar el correo del usuario.')
      setAlertType('error')
      setAlertOpen(true)
    }
  }

  const handleResetPassword = async (email) => {
    if (!confirm(`¿Estás seguro de restablecer la contraseña de ${email} al valor por defecto "Maradona2026"?`)) return
    try {
      const { error } = await supabase.rpc('admin_reset_user_password', { user_email: email })
      if (error) throw error
      
      setAlertTitle('Contraseña Restablecida')
      setAlertMessage(`La contraseña del usuario ${email} ha sido restablecida con éxito al valor por defecto "Maradona2026".`)
      setAlertType('success')
      setAlertOpen(true)
    } catch (err) {
      console.error(err)
      setAlertTitle('Error de Restablecimiento')
      setAlertMessage(err.message || 'No se pudo restablecer la contraseña del usuario.')
      setAlertType('error')
      setAlertOpen(true)
    }
  }

  const handleBanToggle = async (userId, email, currentBannedStatus) => {
    const actionText = currentBannedStatus ? 'habilitar el acceso' : 'restringir el acceso';
    if (!confirm(`¿Estás seguro de ${actionText} para el usuario ${email}?`)) return
    
    setUpdatingUserId(userId)
    try {
      const { error } = await supabase.rpc('admin_ban_user', { 
        target_user_id: userId, 
        ban_status: !currentBannedStatus 
      })
      if (error) throw error
      
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
      const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
      if (error) throw error
      
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

      {error && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-error)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
          <p style={{ color: 'var(--color-error)', fontSize: '0.9rem' }}>{error}</p>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} style={{ color: 'var(--color-primary-hover)' }} />
          <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem' }}>Usuarios de la Plataforma</h3>
        </div>
        
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Cargando usuarios...
          </div>
        ) : usersList.length === 0 ? (
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
                {usersList.map((u) => (
                  <tr key={u.id} style={{ background: u.banned ? 'rgba(239, 68, 68, 0.03)' : 'inherit' }}>
                    <td style={{ fontWeight: '500', color: u.banned ? 'var(--color-error)' : 'var(--color-text-main)' }}>
                      {u.full_name || 'Sin Nombre'}
                      {u.banned && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-error)', fontWeight: 'bold' }}>
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
          </div>
        )}
      </div>

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
