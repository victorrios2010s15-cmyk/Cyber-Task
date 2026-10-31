const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};

let db = null;
if (firebaseConfig.apiKey !== "TU_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
}

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
let localTasks = JSON.parse(localStorage.getItem('squadTasks')) || [];

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function inicializarApp() {
    renderizarCalendario();
    
    if (db) {
        db.collection('tareas').orderBy('deadline').onSnapshot(snapshot => {
            taskContainer.innerHTML = '';
            let tareas = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                renderizarTarea(doc.id, data.text, data.details, data.deadline, data.completed);
                if (!data.completed) tareas.push(data);
            });
            verificarPrecauciones(tareas);
            renderizarCalendario();
        });
    } else {
        actualizarListaLocal();
    }
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

    const tareasActivas = db ? [] : localTasks.filter(t => !t.completed);

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

        if (db) {
        } else {
            const tieneEntrega = tareasActivas.some(t => t.deadline === fechaStr);
            if (tieneEntrega) dayDiv.classList.add('has-deadline');
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
        if (db) {
            db.collection('tareas').doc(id).update({ completed: !completed });
        } else {
            localTasks[id].completed = !localTasks[id].completed;
            localStorage.setItem('squadTasks', JSON.stringify(localTasks));
            actualizarListaLocal();
        }
    });

    li.querySelector('.action-delete').addEventListener('click', () => {
        if (db) {
            db.collection('tareas').doc(id).delete();
        } else {
            localTasks.splice(id, 1);
            localStorage.setItem('squadTasks', JSON.stringify(localTasks));
            actualizarListaLocal();
        }
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

    if (db) {
        db.collection('tareas').add({ text, details, deadline: date, completed: false });
    } else {
        localTasks.push({ text, details, deadline: date, completed: false });
        localStorage.setItem('squadTasks', JSON.stringify(localTasks));
        actualizarListaLocal();
    }

    taskInput.value = '';
    taskDetails.value = '';
});

function actualizarListaLocal() {
    taskContainer.innerHTML = '';
    localTasks = JSON.parse(localStorage.getItem('squadTasks')) || [];
    localTasks.forEach((t, i) => renderizarTarea(i, t.text, t.details, t.deadline, t.completed));
    verificarPrecauciones(localTasks.filter(t => !t.completed));
    renderizarCalendario();
}

if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

document.addEventListener('DOMContentLoaded', inicializarApp);