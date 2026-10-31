import { initializeApp } from "https://gstatic.com";
import { getDatabase, ref, push, onValue, update, remove } from "https://gstatic.com";

const firebaseConfig = {
    apiKey: "AIzaSyC6yPS6Bhe8PE_-4NH_mXpXCp3zHO24skE",
    authDomain: "://firebaseapp.com",
    databaseURL: "https://firebaseio.com",
    projectId: "cyber-task-66d1f",
    storageBucket: "cyber-task-66d1f.firebasestorage.app",
    messagingSenderId: "1025274600073",
    appId: "1:1025274600073:web:e6c585f689c61dfbe5c458"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const tareasRef = ref(database, "tareas");

const taskInput = document.getElementById('task-input');
const taskDetails = document.getElementById('task-details');
const taskDateHidden = document.getElementById('task-date');
const addBtn = document.getElementById('add-btn');
const taskContainer = document.getElementById('task-container');
const notificationText = document.getElementById('notification-text');

const monthYearDisplay = document.getElementById('month-year-display');
const calendarDays = document.getElementById('calendar-days');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');

let currentDate = new Date();
let selectedDateStr = "";
let tareasGlobales = {};

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function inicializarApp() {
    renderizarCalendario();
    onValue(tareasRef, (snapshot) => {
        taskContainer.innerHTML = '';
        tareasGlobales = snapshot.exists() ? snapshot.val() : {};
        
        let listaTareasActivas = [];
        
        Object.keys(tareasGlobales).forEach((id) => {
            const data = tareasGlobales[id];
            renderizarTarea(id, data.text, data.details, data.deadline, data.completed);
            if (!data.completed) {
                listaTareasActivas.push(data);
            }
        });
        
        verificarPrecauciones(listaTareasActivas);
        renderizarCalendario();
    });
}

function renderizarCalendario() {
    const año = currentDate.getFullYear();
    const mes = currentDate.getMonth();

    monthYearDisplay.textContent = `${meses[mes]} ${año}`;
    calendarDays.innerHTML = '';

    const primerDia = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();

    for (let i = 0; i < primerDia; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'cal-day empty';
        calendarDays.appendChild(emptyDiv);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'cal-day';
        dayDiv.textContent = dia;

        const mesFormateado = (mes + 1).toString().padStart(2, '0');
        const diaFormateado = dia.toString().padStart(2, '0');
        const fechaStr = `${año}-${mesFormateado}-${diaFormateado}`;

        if (fechaStr === selectedDateStr) {
            dayDiv.classList.add('selected');
        }

        const tieneEntrega = Object.values(tareasGlobales).some(t => t.deadline === fechaStr && !t.completed);
        if (tieneEntrega) {
            dayDiv.classList.add('has-deadline');
        }

        dayDiv.addEventListener('click', () => {
            document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
            dayDiv.classList.add('selected');
            selectedDateStr = fechaStr;
            taskDateHidden.value = fechaStr;
        });

        calendarDays.appendChild(dayDiv);
    }
}

prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderizarCalendario();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderizarCalendario();
});

function verificarPrecauciones(tareasActivas) {
    if (tareasActivas.length === 0) {
        notificationText.innerHTML = "SISTEMA COMPARTIDO ACTIVO // SIN EVALUACIONES PENDIENTES.";
        return;
    }

    const hoy = new Date();
    let alertas = [];

    tareasActivas.forEach(t => {
        const entrega = new Date(t.deadline);
        const diferenciaTiempo = entrega - hoy;
        const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

        if (diferenciaDias <= 2 && diferenciaDias >= 0) {
            alertas.push(`[¡ALERTA!] "${t.text}" vence pronto.`);
        }
    });

    if (alertas.length > 0) {
        notificationText.innerHTML = `<span class="alert-highlight">${alertas.join(' // ')}</span>`;
        if (Notification.permission === "granted") {
            new Notification("CyberNET Squad", { body: "Atención: Entregas del Liceo críticas en cola." });
        }
    } else {
        notificationText.innerHTML = `SISTEMA OK // ${tareasActivas.length} ACTIVIDADES REGISTRADAS.`;
    }
}

function mostrarAlertaCyber(mensaje) {
    const modal = document.getElementById('cyber-alert-modal');
    const msgContainer = document.getElementById('cyber-alert-message');
    const btn = document.getElementById('cyber-alert-btn');

    msgContainer.textContent = mensaje;
    modal.classList.add('active');

    const cerrarModal = () => {
        modal.classList.remove('active');
        btn.removeEventListener('click', cerrarModal);
    };
    btn.addEventListener('click', cerrarModal);
}

function renderizarTarea(id, text, details, deadline, completed) {
    const li = document.createElement('li');
    li.className = 'task-item';
    if (completed) li.classList.add('completed');

    li.innerHTML = `
        <div class="task-meta">
            <span class="task-text">${text}</span>
            <span class="task-desc">${details}</span>
            <span class="task-deadline">ENTREGA: ${deadline}</span>
        </div>
        <div class="task-actions">
            <span class="action-click action-done">OK</span>
            <span class="action-click action-delete">DEL</span>
        </div>
    `;

    li.querySelector('.action-done').addEventListener('click', () => {
        const tareaEspecificaRef = ref(database, `tareas/${id}`);
        update(tareaEspecificaRef, { completed: !completed });
    });

    li.querySelector('.action-delete').addEventListener('click', () => {
        const tareaEspecificaRef = ref(database, `tareas/${id}`);
        remove(tareaEspecificaRef);
    });

    taskContainer.appendChild(li);
}

addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    const details = taskDetails.value.trim();
    const date = taskDateHidden.value;

    if (!text || !details || !date) {
        mostrarAlertaCyber("Selecciona un día en el calendario e inyecta título y detalles.");
        return;
    }

    const nuevaTarea = {
        text: text,
        details: details,
        deadline: date,
        completed: false
    };

    push(tareasRef, nuevaTarea);

    taskInput.value = '';
    taskDetails.value = '';
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js")
            .then((reg) => console.log("Terminal CyberNET Sincronizada", reg.scope))
            .catch((err) => console.log("Fallo en sincronización de entorno", err));
    });
}

function solicitarPermisoNotificaciones() {
    if ("Notification" in window) {
        Notification.requestPermission().then((permiso) => {
            if (permiso === "granted") {
                console.log("Protocolo de alertas autorizado por el usuario.");
            } else {
                console.log("Protocolo de alertas denegado.");
            }
        });
    }
}

window.addEventListener("load", solicitarPermisoNotificaciones);

inicializarApp();