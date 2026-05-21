const express = require('express');
const session = require('express-session');
const path = require('path'); 

const app = express();

app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'views')));

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[LOG - ${timestamp}] ${req.method} a la ruta ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    if (req.session.usuario) {
        console.log(`[PERSISTENCIA] Usuario "${req.session.usuario}" ya tiene sesión activa. Redirigiendo...`);
        return res.redirect('/perfil');
    }
    res.sendFile(path.join(__dirname, 'views', 'sesion.html'));
});

app.post('/login', (req, res) => {
    const { user, email, password } = req.body;

    if (user === 'admin' && password === '1234') { 
        req.session.usuario = user;
        req.session.correo = email;

        console.log(`[ACCESO PERMITIDO] Sesión iniciada con éxito para el usuario: ${user}`);
        
        res.send(`
            <h1>¡Inicio de sesión exitoso!</h1>
            <p>Bienvenido, <strong>${req.session.usuario}</strong>.</p>
            <p>Tu sesión ha sido guardada de forma segura en una cookie.</p>
            <br>
            <a href="/perfil">Ir a mi perfil protegido</a>
        `);
    } else {
        console.warn(`[ACCESO DENEGADO] Intento fallido con el usuario: "${user}"`);
        res.status(401).send(`
            <h1 style="color: red;">Acceso Denegado</h1>
            <p>Usuario o contraseña incorrectos.</p>
            <br>
            <a href="/">Volver a intentarlo</a>
        `);
    }
});

app.get('/perfil', (req, res) => {
    if (req.session.usuario) {
        console.log(`[VALIDACIÓN] Acceso AUTORIZADO a perfil para: ${req.session.usuario}`);
        res.send(`
            <h1>Perfil Protegido</h1>
            <p>Usuario activo: <strong>${req.session.usuario}</strong></p>
            <p>Correo registrado: ${req.session.correo}</p>
            <br>
            <a href="/logout">Cerrar Sesión</a>
        `);
    } else {
        console.warn(`[ACCESO DENEGADO] Intento de intrusión sin cookie en la ruta /perfil`);
        res.status(401).send(`
            <h1 style="color: red;">No autorizado</h1>
            <p>Debes iniciar sesión para ver esta sección.</p>
            <br>
            <a href="/">Ir al Login</a>
        `);
    }
});


app.get('/logout', (req, res) => {
    const usuarioSaliendo = req.session.usuario;
    req.session.destroy((err) => {
        if (err) {
            console.error('[ERROR] No se pudo destruir la sesión');
            return res.send('Error al cerrar sesión');
        }
        console.log(`[LOGOUT] Sesión destruida para el usuario: ${usuarioSaliendo}`);
        res.clearCookie('connect.sid'); 
        res.redirect('/');
    });
});

app.listen(7000, () => {
    console.log('Servidor corriendo en: http://localhost:7000');
});