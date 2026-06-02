// CONFIGURACIÓN DE FIREBASE
var firebaseConfig = {
    apiKey: "AIzaSyBbjxZKuEUhwEZZQZmofBhz2Vh71HKiK4",
    authDomain: "lincedex.firebaseapp.com",
    databaseURL: "https://lincedex-default-rtdb.firebaseio.com",
    projectId: "lincedex",
    storageBucket: "lincedex.firebasestorage.app",
    messagingSenderId: "491789546096",
    appId: "1:491789546096:web:44643d0a49cbbafaf3fab5",
    measurementId: "G-Q2Z90P93M9"
};

firebase.initializeApp(firebaseConfig);
var database = firebase.database();
var CLAVE_ADMIN = "Gary08*"; 

// Nodos DOM
var chatContainer = document.getElementById('chatContainer');
var chatMessages = document.getElementById('chatMessages');
var usernameInput = document.getElementById('usernameInput');
var messageInput = document.getElementById('messageInput');
var sendBtn = document.getElementById('sendBtn');
var imageInput = document.getElementById('imageInput');
var appBody = document.getElementById('appBody');
var myStatusGemma = document.getElementById('myStatusGemma');
var typingIndicator = document.getElementById('typingIndicator');
var counterText = document.getElementById('counterText');

// Variables locales globales
var miSessionId = Math.random().toString(36).substring(2, 9);
var estadosDisponibles = ["disponible", "ausente", "ocupado"];
var estadoActualIndice = 0;

// 🏆 MÁQUINA DEL TIEMPO: ARREGLO DE TEMAS HISTÓRICOS
var fondosDisponibles = [
    "bg-aqua",         // 1. Frutiger Aero (Original)
    "bg-aurora",       // 2. Frutiger Verde
    "bg-cosmic",       // 3. Frutiger Espacial
    "bg-symbian",      // 4. Symbian OS (Nokia)
    "bg-blackberry",   // 5. BlackBerry (Corporativo)
    "bg-wphone",       // 6. Windows Phone (Metro)
    "bg-flat",         // 7. Flat Design (WhatsApp Clásico)
    "bg-material",     // 8. Material Design (2015)
    "bg-darkmode",     // 9. Modo Oscuro (2019)
    "bg-glassmodern"   // 10. Material You / Glassmorphism
];

var nombresFondos = [
    "🫧 Frutiger Aero (2005)",
    "🌿 Eco Aero (2008)",
    "🌌 Cosmic Aero (2009)",
    "📱 Symbian OS (2010)",
    "💼 BlackBerry (2011)",
    "⬛ Windows Phone (2012)",
    "🟢 Flat Design / iOS 7 (2013)",
    "📐 Material Design (2015)",
    "🌙 Modo Oscuro (2019)",
    "✨ Material You (Actualidad)"
];

var fondoActualIndice = 0;
var typingTimeout;
var miAvatarActual = "🦋"; 
var toastTimeout;

// 🏆 ROTAR FONDO Y MOSTRAR TOAST
function rotarFondo() {
    appBody.className = "";
    fondoActualIndice = (fondoActualIndice + 1) % fondosDisponibles.length;
    appBody.classList.add(fondosDisponibles[fondoActualIndice]);
    
    var toast = document.getElementById('themeToast');
    toast.innerText = nombresFondos[fondoActualIndice];
    toast.style.display = "block";
    
    setTimeout(function() { toast.style.opacity = "1"; }, 10);
    clearTimeout(toastTimeout);
    
    toastTimeout = setTimeout(function() {
        toast.style.opacity = "0";
        setTimeout(function() { toast.style.display = "none"; }, 400);
    }, 2000);
}

function reproducirSonido(tipo) {
    try {
        var AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        var ctx = new AudioContext();
        if (tipo === 'msg') { 
            var osc = ctx.createOscillator(); var gain = ctx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
            osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.12);
        } else if (tipo === 'zumbido') { 
            var osc1 = ctx.createOscillator(); var gain1 = ctx.createGain();
            osc1.type = 'sawtooth'; osc1.frequency.setValueAtTime(120, ctx.currentTime);
            gain1.gain.setValueAtTime(0.3, ctx.currentTime); gain1.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
            osc1.connect(gain1); gain1.connect(ctx.destination); osc1.start(); osc1.stop(ctx.currentTime + 0.4);
        }
    } catch(e) { console.log("Audio", e); }
}

function obtenerAvatarPorNombre(nombre) {
    var hash = 0;
    for (var i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    var avatares = ["🦋", "🐱", "🐟", "🐥", "⚽", "🌀", "🍀", "🫧", "💎", "🐸", "🌟"];
    return avatares[Math.abs(hash) % avatares.length];
}

function obtenerColorPorNombre(nombre) {
    if (nombre === "🛡️ ADMINISTRADOR") return "#0a4b66"; 
    var hash = 0;
    for (var i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    var colores = ["#0074a6", "#0099b8", "#00a896", "#028090", "#2ec4b6", "#1e90ff", "#00b4d8", "#7209b7", "#f72585", "#4361ee"];
    return colores[Math.abs(hash) % colores.length];
}

function formatearHora(timestamp) {
    if (!timestamp) return "";
    var fecha = new Date(timestamp);
    var horas = fecha.getHours();
    var minutos = fecha.getMinutes();
    if (horas < 10) horas = '0' + horas;
    if (minutos < 10) minutos = '0' + minutos;
    return horas + ':' + minutes;
}

function toggleAvatarPicker() {
    var picker = document.getElementById('avatarPicker');
    picker.style.display = (picker.style.display === 'none' || picker.style.display === '') ? 'flex' : 'none';
}

function seleccionarAvatar(avatar) {
    miAvatarActual = avatar;
    document.getElementById('myAvatarPreview').innerText = avatar;
    toggleAvatarPicker();
    actualizarPresencia();
}

function renderizarMensaje(snapshot) {
    try {
        var datos = snapshot.val();
        if (!datos) return;
        
        datos.usuario = datos.usuario || "Anónimo";
        datos.timestamp = datos.timestamp || Date.now();
        var idMensaje = snapshot.key;
        var miNombre = usernameInput.value.trim(); 

        var row = document.getElementById("row_" + idMensaje) || document.createElement('div');
        row.id = "row_" + idMensaje;
        
        var esMio = (datos.usuario === miNombre || (miNombre === CLAVE_ADMIN && datos.usuario === "🛡️ ADMINISTRADOR"));
        row.className = esMio ? "msg-row mismo-usuario" : "msg-row";

        var divBubble = document.getElementById(idMensaje) || document.createElement('div');
        divBubble.id = idMensaje;
        
        var estiloBase = "padding: 12px 14px; border-radius: 20px; max-width: 80%; position: relative; box-shadow: 0 6px 15px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); ";
        var estiloAlineacion = esMio ? 
            "background: linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(200,247,192,0.6) 40%, rgba(162,238,150,0.7) 100%); border: 1px solid rgba(135,220,120,0.8); border-top: 1.5px solid rgba(255,255,255,0.9);" : 
            "background: linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(245,249,250,0.6) 45%, rgba(230,240,245,0.7) 100%); border: 1px solid rgba(200,220,230,0.8); border-top: 1.5px solid rgba(255,255,255,0.9);";
        
        divBubble.style.cssText = estiloBase + estiloAlineacion;
        var color = obtenerColorPorNombre(datos.usuario);
        
        var contenido = datos.mensaje ? 
            "<div style='font-size: 14.5px; font-weight: 500; word-break: break-word; line-height: 1.4;'>" + datos.mensaje + "</div>" :
            "<img src='" + datos.imagenSubida + "' style='max-width: 150px; max-height: 150px; border-radius: 12px; display: block; margin-top: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.5);'>";
            
        var HTMLHora = "<div style='font-size: 9.5px; opacity: 0.6; text-align: right; margin-top: 3px; font-weight: 600;'>" + formatearHora(datos.timestamp) + "</div>";
            
        var botonBorrar = (miNombre === CLAVE_ADMIN) ? 
            "<span onclick='eliminarMensaje(\"" + idMensaje + "\")' style='cursor:pointer; position:absolute; top:-4px; right:-4px; background: rgba(255,70,70,0.85); width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; color:white !important; font-weight:bold; font-size:10px; border:1px solid rgba(255,255,255,0.8); box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index:5;'>×</span>" : "";

        // AQUÍ CORREGÍ EL ERROR SINTÁCTICO DE DECLARACIÓN (USANDO = EN LUGAR DE +=)
        var htmlReacciones = "<div style='margin-top:4px; display:flex; align-items:center; flex-wrap:wrap; gap:2px;'>";
        if (datos.reacciones) {
            Object.keys(datos.reacciones).forEach(function(emoji) {
                var conteo = Object.keys(datos.reacciones[emoji]).length;
                if (conteo > 0) {
                    htmlReacciones += "<span class='reaction-badge' onclick='enviarReaccion(\""+idMensaje+"\",\""+emoji+"\")'>"+emoji+" <span style='color:inherit !important;'>"+conteo+"</span></span>";
                }
            });
        }
        
        htmlReacciones += "<div style='position:relative; display:inline-block; margin-left:4px;'>";
        htmlReacciones += "  <span style='cursor:pointer; font-size:12px; opacity:0.5; padding:2px;' onclick='togglePicker(\""+idMensaje+"\")'>➕</span>";
        htmlReacciones += "  <div id='picker_"+idMensaje+"' style='display:none; position:absolute; bottom:22px; left:0; background:rgba(255,255,255,0.92); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.6); border-radius:14px; padding:5px 8px; gap:10px; z-index:999; box-shadow:0 4px 12px rgba(0,60,90,0.15); border-top: 1.5px solid #fff;'>";
        htmlReacciones += "    <span style='cursor:pointer; font-size:16px; transition:transform 0.1s;' onclick='enviarReaccion(\""+idMensaje+"\",\"👍\"); togglePicker(\""+idMensaje+"\")'>👍</span>";
        htmlReacciones += "    <span style='cursor:pointer; font-size:16px; transition:transform 0.1s;' onclick='enviarReaccion(\""+idMensaje+"\",\"❤️\"); togglePicker(\""+idMensaje+"\")'>❤️</span>";
        htmlReacciones += "    <span style='cursor:pointer; font-size:16px; transition:transform 0.1s;' onclick='enviarReaccion(\""+idMensaje+"\",\"😂\"); togglePicker(\""+idMensaje+"\")'>😂</span>";
        htmlReacciones += "    <span style='cursor:pointer; font-size:16px; transition:transform 0.1s;' onclick='enviarReaccion(\""+idMensaje+"\",\"😮\"); togglePicker(\""+idMensaje+"\")'>😮</span>";
        htmlReacciones += "    <span style='cursor:pointer; font-size:16px; transition:transform 0.1s;' onclick='enviarReaccion(\""+idMensaje+"\",\"🫪\"); togglePicker(\""+idMensaje+"\")'>🫪</span>";
        htmlReacciones += "  </div></div></div>";

        divBubble.innerHTML = "<div style='font-weight:700; color:"+color+"; font-size:11px; margin-bottom:4px;'>" + datos.usuario + "</div>" + 
                              contenido + HTMLHora + htmlReacciones + botonBorrar;
        
        var avatarFinal = datos.avatar ? datos.avatar : obtenerAvatarPorNombre(datos.usuario);
        
        var divAvatar = row.querySelector('.avatar-glass');
        if (!divAvatar) { divAvatar = document.createElement('div'); divAvatar.className = "avatar-glass"; row.appendChild(divAvatar); }
        divAvatar.innerText = avatarFinal;
        
        row.appendChild(divBubble);

        if (!document.getElementById("row_" + idMensaje)) {
            chatMessages.appendChild(row);
            reproducirSonido('msg'); 
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch(errorRenderizado) {
        console.error("Error silencioso al mostrar un mensaje:", errorRenderizado);
    }
}

function togglePicker(idMensaje) {
    var picker = document.getElementById('picker_' + idMensaje);
    if (picker) { picker.style.display = (picker.style.display === 'none' || picker.style.display === '') ? 'flex' : 'none'; }
}

function enviarReaccion(idMensaje, emoji) {
    var nombre = usernameInput.value.trim() || "Anónimo";
    database.ref('mensajes/' + idMensaje + '/reacciones/' + emoji + '/' + miSessionId).set(nombre);
}

document.getElementById('nudgeBtn').addEventListener('click', function() {
    var nombre = usernameInput.value.trim() || "Anónimo";
    if (nombre === CLAVE_ADMIN) nombre = "🛡️ ADMINISTRADOR";
    database.ref('zumbidos').push({ usuario: nombre, timestamp: Date.now() });
});

function actualizarPresencia() {
    var nombre = usernameInput.value.trim() || "Anónimo";
    if (nombre === CLAVE_ADMIN) nombre = "🛡️ ADMINISTRADOR";
    var refUser = database.ref('presence/' + miSessionId);
    refUser.set({ usuario: nombre, estado: estadosDisponibles[estadoActualIndice], avatar: miAvatarActual });
    refUser.onDisconnect().remove();
}

database.ref('.info/connected').on('value', function(snapshot) { if (snapshot.val() === true) actualizarPresencia(); });

database.ref('presence').on('value', function(snapshot) {
    var onlineCount = snapshot.numChildren();
    counterText.innerText = onlineCount + (onlineCount === 1 ? " en línea" : " en línea");
});

function ciclarEstado() {
    myStatusGemma.className = "status-gemma";
    estadoActualIndice = (estadoActualIndice + 1) % estadosDisponibles.length;
    myStatusGemma.classList.add(estadosDisponibles[estadoActualIndice]);
    actualizarPresencia();
}

messageInput.addEventListener('input', function() {
    var nombre = usernameInput.value.trim() || "Anónimo";
    if (nombre === CLAVE_ADMIN) nombre = "🛡️ ADMINISTRADOR";
    database.ref('typing/' + miSessionId).set({ usuario: nombre, escribiendo: true });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(function() { database.ref('typing/' + miSessionId).remove(); }, 2000);
});

database.ref('typing').on('value', function(snapshot) {
    var listaEscribiendo = [];
    snapshot.forEach(function(child) { if (child.key !== miSessionId) listaEscribiendo.push(child.val().usuario); });
    if (listaEscribiendo.length > 0) {
        typingIndicator.innerText = listaEscribiendo.join(', ') + " está escribiendo..."; typingIndicator.style.display = "block";
    } else { typingIndicator.style.display = "none"; }
});

usernameInput.addEventListener('input', function() {
    actualizarPresencia();
    chatMessages.innerHTML = '';
    database.ref('mensajes').once('value', function(snapshot) { snapshot.forEach(function(childSnapshot) { renderizarMensaje(childSnapshot); }); });
});

function enviarMensaje() {
    var nombre = usernameInput.value.trim() || "Anónimo";
    var texto = messageInput.value.trim();
    if (texto === "") return; 
    if (nombre === CLAVE_ADMIN) nombre = "🛡️ ADMINISTRADOR";
    
    database.ref('mensajes').push({ usuario: nombre, mensaje: texto, timestamp: Date.now(), avatar: miAvatarActual });
    database.ref('typing/' + miSessionId).remove(); messageInput.value = ""; 
}

imageInput.addEventListener('change', function(e) {
    var file = e.target.files[0]; if (!file) return;
    var nombre = usernameInput.value.trim() || "Anónimo"; if (nombre === CLAVE_ADMIN) nombre = "🛡️ ADMINISTRADOR";
    var reader = new FileReader();
    reader.onload = function(event) { database.ref('mensajes').push({ usuario: nombre, imagenSubida: event.target.result, timestamp: Date.now(), avatar: miAvatarActual }); };
    reader.readAsDataURL(file); imageInput.value = "";
});

sendBtn.addEventListener('click', enviarMensaje);
messageInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') enviarMensaje(); });

function eliminarMensaje(idMensaje) { if (usernameInput.value.trim() === CLAVE_ADMIN) database.ref('mensajes/' + idMensaje).remove(); }

database.ref('mensajes').on('child_added', function(snapshot) { renderizarMensaje(snapshot); });
database.ref('mensajes').on('child_changed', function(snapshot) { renderizarMensaje(snapshot); });
database.ref('mensajes').on('child_removed', function(snapshot) {
    var rowAEliminar = document.getElementById("row_" + snapshot.key); if (rowAEliminar) rowAEliminar.remove();
});

database.ref('zumbidos').on('child_added', function(snapshot) {
    var datos = snapshot.val();
    if (Date.now() - datos.timestamp < 5000) {
        reproducirSonido('zumbido'); chatContainer.classList.add('shake');
        setTimeout(function() { chatContainer.classList.remove('shake'); }, 500);
    }
});
