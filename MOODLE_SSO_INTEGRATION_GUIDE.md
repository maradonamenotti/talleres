# Guía de Integración SSO Moodle - La Oficina del Entrenador

Esta guía explica cómo habilitar el Acceso Único (SSO) desde Moodle para que los alumnos ingresen a **Talleres / La Oficina del Entrenador** automáticamente con un solo clic.

---

## 🔑 Concepto y Seguridad

La integración utiliza una **Firma Digital (Hash)** para garantizar que los datos enviados desde Moodle no sean alterados ni falsificados.

- **Secreto Compartido (SSO_SECRET_KEY)**: `clave_secreta_moodle_sso_2026` (Configurado en el `.env` del backend de Talleres).
- **Fórmula del Hash**: `SHA256(username + email + course_id + SECRET_KEY)`

---

## 🛠️ Implementación en Moodle (Código de Redirección)

Crea un archivo llamado `ir_a_talleres.php` en tu servidor Moodle (por ejemplo, dentro de la raíz o en una carpeta de tu tema) con el siguiente código:

```php
<?php
// 1. Cargar la configuración de Moodle para inicializar la sesión
require_once('../../config.php'); 

// 2. Obligar a que el usuario esté logueado en Moodle
require_login(); 

global $USER, $COURSE;

// 3. Capturar datos del usuario actual (nombre de usuario es el DNI)
$username   = $USER->username; 
$email      = $USER->email;
$firstname  = $USER->firstname;
$lastname   = $USER->lastname;
$course_id  = $COURSE->id; // ID del curso actual de Moodle

// 4. Clave secreta compartida (debe coincidir con la del backend)
$secret = 'clave_secreta_moodle_sso_2026';

// 5. Generar la firma digital de seguridad (Hash)
// Concatenamos DNI, Email, ID de Curso y el secreto en ese orden estricto
$dataString = $username . $email . $course_id . $secret;
$hash = hash('sha256', $dataString);

// 6. Construir la URL final de Talleres
// Cambiar "localhost:5173" por el dominio de producción cuando se despliegue
$talleres_url = "https://talleres.maradonamenotti.ar/?username=" . urlencode($username)
              . "&email=" . urlencode($email)
              . "&firstname=" . urlencode($firstname)
              . "&lastname=" . urlencode($lastname)
              . "&course_id=" . urlencode($course_id)
              . "&hash=" . urlencode($hash);

// 7. Redirigir al alumno de forma inmediata
redirect($talleres_url);
```

---

## 📋 Gestión del Acceso en Talleres (Administrador)

Para que los alumnos de un curso de Moodle puedan acceder, debes habilitar su **ID de Curso Moodle** en Talleres:

1. Inicia sesión en Talleres con tu cuenta de administrador (`sistemas@maradonamenotti.ar` o `federico@suarezdelsolar.com`).
2. Dirígete a la sección de **Gestión de Roles** en la barra lateral.
3. Haz clic en la pestaña **🔑 Cursos Moodle Autorizados**.
4. Agrega el **ID numérico** del curso de Moodle y dale un nombre para identificarlo.
   - *Nota*: Puedes encontrar el ID del curso en Moodle en la barra de direcciones de tu navegador al entrar al curso (ej: `id=12` significa ID `12`).
5. ¡Listo! Solo los alumnos logueados en Moodle que provengan de cursos autorizados podrán ingresar.
