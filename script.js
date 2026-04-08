lucide.createIcons();

// --- DATA LOGIC ---
let tasks = JSON.parse(localStorage.getItem('routine_db')) || [];
// We use "Local String" to avoid Timezone bugs
const getTodayStr = (dateObj = new Date()) => {
    return dateObj.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD
};

let selectedDate = getTodayStr(); 
let calendarMonth = new Date(); // Controls the month shown in calendar view
let chartInstance = null;

window.onload = () => {
    refreshApp();
};

function saveToStorage() {
    localStorage.setItem('routine_db', JSON.stringify(tasks));
}

// --- NAVIGATION ---
function showView(viewId, btn) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(viewId + '-view').style.display = 'block';
    
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');

    if (viewId === 'dashboard') updateDashboard();
    if (viewId === 'calendar') renderCalendar();
    
    document.getElementById('current-view-title').innerText = 
        viewId === 'tasks' ? `Date: ${selectedDate}` : viewId.toUpperCase();
}

// --- CALENDAR LOGIC ---
function changeMonth(step) {
    calendarMonth.setMonth(calendarMonth.getMonth() + step);
    renderCalendar();
}


function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('month-label');
    grid.innerHTML = '';

    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    monthLabel.innerText = calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Days of Week Header
    ['S','M','T','W','T','F','S'].forEach(d => {
        grid.innerHTML += `<div class="weekday">${d}</div>`;
    });

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Padding for previous month
    for (let i = 0; i < firstDay; i++) grid.innerHTML += `<div></div>`;

    // Fill days
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = getTodayStr(new Date(year, month, day));
        const hasTask = tasks.some(t => t.date === dateStr);
        const isSelected = dateStr === selectedDate;

        const dayBtn = document.createElement('div');
        dayBtn.className = `cal-day ${hasTask ? 'has-task' : ''} ${isSelected ? 'selected' : ''}`;
        dayBtn.innerText = day;
        dayBtn.onclick = () => {
            selectedDate = dateStr;
            renderCalendar();
            showView('tasks', document.querySelectorAll('.nav-item')[0]);
            refreshApp();
        };
        grid.appendChild(dayBtn);
    }
}

// --- TASK LOGIC ---
function handleSaveTask() {
    const name = document.getElementById('task-input').value;
    const priority = document.getElementById('priority-input').value;
    const duration = parseInt(document.getElementById('duration-input').value) || 1;

    if (!name) return alert("Enter a name!");

    const baseDate = new Date(selectedDate);

    for (let i = 0; i < duration; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + i);
        
        tasks.push({
            id: Date.now() + Math.random(),
            title: name,
            priority: priority,
            date: getTodayStr(nextDate),
            done: false
        });
    }

    saveToStorage();
    closeModal();
    document.getElementById('task-input').value = '';
    refreshApp();
}

function renderTasks() {
    const container = document.getElementById('task-list-container');
    container.innerHTML = '';
    
    const todays = tasks.filter(t => t.date === selectedDate);

    if (todays.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:gray; margin-top:40px;">No tasks for this date.</p>`;
        return;
    }

    todays.forEach(t => {
        const card = document.createElement('div');
        card.className = `task-card ${t.done ? 'done' : ''}`;
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; cursor:pointer" onclick="toggleTask(${t.id})">
                <div style="width:20px; height:20px; border:2px solid var(--primary); border-radius:4px; background:${t.done ? 'var(--primary)':''}"></div>
                <div>
                    <h4 style="margin:0">${t.title}</h4>
                    <small style="color:var(--primary)">${t.priority.toUpperCase()}</small>
                </div>
            </div>
            <button onclick="deleteTask(${t.id})" style="border:none; background:none; color:red; cursor:pointer">✕</button>
        `;
        container.appendChild(card);
    });
}

function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
    saveToStorage();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveToStorage();
    refreshApp();
}

// --- UTILS ---
function refreshApp() {
    renderTasks();
    renderCalendar();
    document.getElementById('current-view-title').innerText = `Date: ${selectedDate}`;
}

function updateDashboard() {
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-done').innerText = done;

    const ctx = document.getElementById('statsChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Done', 'Pending'],
            datasets: [{
                data: [done, total - done],
                backgroundColor: ['#6366f1', '#e2e8f0']
            }]
        },
        options: { animation: false }
    });
}

function openModal() { document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }