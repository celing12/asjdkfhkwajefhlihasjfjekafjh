// App State & Local Storage Initialization (Reset to empty/clean state)
let state = {
    tasks: JSON.parse(localStorage.getItem('workspace_tasks')) || [],
    savings: parseFloat(localStorage.getItem('workspace_savings')) || 0,
    targets: JSON.parse(localStorage.getItem('workspace_targets')) || [],
    history: JSON.parse(localStorage.getItem('workspace_history')) || [],
    profileImg: localStorage.getItem('workspace_profile_img') || ''
};

let currentTaskFilter = 'all';
let currentFinanceFilter = 'all';
let charts = {};

// --- Spinner Utility ---
function showSpinner(text = "Memproses data...") {
    const spinner = document.getElementById('spinnerOverlay');
    document.getElementById('spinnerText').innerText = text;
    spinner.classList.remove('hidden');
    setTimeout(() => spinner.classList.remove('opacity-0'), 10);
}

function hideSpinner() {
    const spinner = document.getElementById('spinnerOverlay');
    spinner.classList.add('opacity-0');
    setTimeout(() => spinner.classList.add('hidden'), 300);
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem('workspace_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('workspace_savings', state.savings.toString());
    localStorage.setItem('workspace_targets', JSON.stringify(state.targets));
    localStorage.setItem('workspace_history', JSON.stringify(state.history));
    localStorage.setItem('workspace_profile_img', state.profileImg);
}

// Helper: Format Rupiah
function formatRp(num) {
    return 'Rp ' + Number(num).toLocaleString('id-ID');
}

// DOM Loaded Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadProfileImage();
    renderDashboard();
    renderTasks();
    renderFinance();
});

// --- Profile Image Upload Handler ---
function handleProfileImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showSpinner("Mengunggah foto profil...");
    const reader = new FileReader();
    reader.onload = function(e) {
        state.profileImg = e.target.result;
        saveData();
        loadProfileImage();
        hideSpinner();
    };
    reader.readAsDataURL(file);
}

function loadProfileImage() {
    const imgElement = document.getElementById('sidebarProfileImg');
    const placeholderElement = document.getElementById('sidebarProfilePlaceholder');

    if (state.profileImg) {
        imgElement.src = state.profileImg;
        imgElement.classList.remove('hidden');
        placeholderElement.classList.add('hidden');
    } else {
        imgElement.classList.add('hidden');
        placeholderElement.classList.remove('hidden');
    }
}

// --- Navigation Tabs ---
function switchTab(tab) {
    showSpinner("Memuat halaman...");
    setTimeout(() => {
        ['dashboard', 'tasks', 'finance'].forEach(t => {
            document.getElementById(`view-${t}`).classList.add('hidden');
            document.getElementById(`nav-${t}`).classList.remove('active');
        });
        document.getElementById(`view-${tab}`).classList.remove('hidden');
        document.getElementById(`nav-${tab}`).classList.add('active');

        if (tab === 'dashboard') renderDashboard();
        if (tab === 'tasks') renderTasks();
        if (tab === 'finance') renderFinance();
        hideSpinner();
    }, 250);
}

// --- TASKS MODULE ---
function filterTasks(cat) {
    currentTaskFilter = cat;
    ['all', 'osis', 'kelas', 'ilmu'].forEach(c => {
        const btn = document.getElementById(`task-tab-${c}`);
        if (c === cat) {
            btn.className = "px-4 py-2 text-sm font-semibold text-emerald-600 border-b-2 border-emerald-600 transition-all";
        } else {
            btn.className = "px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-all";
        }
    });
    renderTasks();
}

function renderTasks() {
    const grid = document.getElementById('tasksGrid');
    grid.innerHTML = '';

    const filtered = state.tasks.filter(t => currentTaskFilter === 'all' || t.category === currentTaskFilter);

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-400">
                <i class="fa-regular fa-folder-open text-4xl mb-2"></i>
                <p class="text-sm">Belum ada catatan pada kategori ini.</p>
            </div>`;
        return;
    }

    filtered.forEach(task => {
        const badgeColors = {
            osis: 'bg-indigo-50 text-indigo-600 border-indigo-200',
            kelas: 'bg-blue-50 text-blue-600 border-blue-200',
            ilmu: 'bg-emerald-50 text-emerald-600 border-emerald-200'
        };
        const catLabel = { osis: 'Tugas Utama', kelas: 'Tugas Kelas', ilmu: 'Catatan Ilmu' }[task.category];
        const priorityColors = { low: 'text-slate-400', medium: 'text-amber-500', high: 'text-rose-500' };

        const card = document.createElement('div');
        card.className = `bg-white p-5 rounded-2xl border ${task.completed ? 'border-slate-200 opacity-60' : 'border-slate-200/80'} shadow-sm hover:shadow-md transition-all space-y-3 flex flex-col justify-between`;
        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start gap-2 mb-2">
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[task.category]} uppercase">${catLabel}</span>
                    <i class="fa-solid fa-flag text-xs ${priorityColors[task.priority]}"></i>
                </div>
                <h4 class="font-bold text-slate-800 text-base ${task.completed ? 'line-through text-slate-400' : ''}">${task.title}</h4>
                <p class="text-xs text-slate-500 mt-1">${task.desc || 'Tidak ada deskripsi.'}</p>
            </div>
            <div class="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span class="text-slate-400"><i class="fa-regular fa-calendar text-[10px] mr-1"></i>${task.date}</span>
                <div class="flex gap-2">
                    <button onclick="toggleTask(${task.id})" class="text-emerald-600 hover:text-emerald-700 font-semibold">
                        <i class="fa-solid ${task.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
                    </button>
                    <button onclick="deleteTask(${task.id})" class="text-rose-500 hover:text-rose-700 font-semibold">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openTaskModal() { document.getElementById('taskModal').classList.remove('hidden'); }
function closeTaskModal() { document.getElementById('taskModal').classList.add('hidden'); }

function handleTaskSubmit(e) {
    e.preventDefault();
    showSpinner("Menyimpan tugas...");
    setTimeout(() => {
        const newTask = {
            id: Date.now(),
            title: document.getElementById('taskTitle').value,
            category: document.getElementById('taskCategory').value,
            desc: document.getElementById('taskDesc').value,
            priority: document.getElementById('taskPriority').value,
            completed: false,
            date: new Date().toISOString().split('T')[0]
        };
        state.tasks.push(newTask);
        saveData();
        renderTasks();
        closeTaskModal();
        document.getElementById('taskForm').reset();
        hideSpinner();
    }, 300);
}

function toggleTask(id) {
    showSpinner("Updating status...");
    setTimeout(() => {
        const t = state.tasks.find(x => x.id === id);
        if (t) t.completed = !t.completed;
        saveData();
        renderTasks();
        hideSpinner();
    }, 200);
}

function deleteTask(id) {
    if (!confirm("Hapus catatan ini?")) return;
    showSpinner("Menghapus...");
    setTimeout(() => {
        state.tasks = state.tasks.filter(x => x.id !== id);
        saveData();
        renderTasks();
        hideSpinner();
    }, 200);
}

// --- FINANCE MODULE ---
function filterFinance(cat) {
    currentFinanceFilter = cat;
    ['all', 'tabungan', 'target'].forEach(c => {
        const btn = document.getElementById(`fin-tab-${c}`);
        if (c === cat) {
            btn.className = "px-4 py-2 text-sm font-semibold text-emerald-600 border-b-2 border-emerald-600 transition-all";
        } else {
            btn.className = "px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-all";
        }
    });

    showSpinner("Memuat filter...");
    setTimeout(() => {
        renderFinance();
        hideSpinner();
    }, 200);
}

function renderFinance() {
    const totalCollectedTarget = state.targets.reduce((acc, curr) => acc + curr.collected, 0);

    const cardTitle = document.getElementById('finCardTitle');
    const cardAmount = document.getElementById('finCardAmount');
    const wishlistSection = document.getElementById('targetBarangSection');

    if (currentFinanceFilter === 'all') {
        cardTitle.innerText = 'Total Alokasi Keuangan (Tabungan + Wishlist)';
        cardAmount.innerText = formatRp(state.savings + totalCollectedTarget);
        wishlistSection.classList.remove('hidden');
    } else if (currentFinanceFilter === 'tabungan') {
        cardTitle.innerText = 'Saldo Tabungan Jangka Panjang';
        cardAmount.innerText = formatRp(state.savings);
        wishlistSection.classList.add('hidden');
    } else if (currentFinanceFilter === 'target') {
        cardTitle.innerText = 'Total Terkumpul di Target Barang';
        cardAmount.innerText = formatRp(totalCollectedTarget);
        wishlistSection.classList.remove('hidden');
    }

    renderWishlist();
    renderFinanceHistory();
    renderFinanceCategoryChart();
}

function renderWishlist() {
    const grid = document.getElementById('wishlistGrid');
    grid.innerHTML = '';

    if (state.targets.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-8 text-center text-slate-400">
                <p class="text-sm">Belum ada target barang impian.</p>
            </div>`;
        return;
    }

    state.targets.forEach(target => {
        const sisa = Math.max(0, target.price - target.collected);
        const percent = Math.min(100, Math.round((target.collected / target.price) * 100));

        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="h-36 bg-slate-100 overflow-hidden relative">
                    <img src="${target.image || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'}" alt="${target.name}" class="w-full h-full object-cover">
                    <span class="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full">${percent}%</span>
                </div>
                <div class="p-4 space-y-3">
                    <h4 class="font-bold text-slate-800 text-base">${target.name}</h4>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-400">Harga Target:</span>
                        <span class="font-semibold text-slate-700">${formatRp(target.price)}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div class="bg-emerald-600 h-2 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                    </div>
                    <div class="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-100">
                        <div>
                            <p class="text-slate-400">Terkumpul:</p>
                            <p class="font-bold text-emerald-600">${formatRp(target.collected)}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-slate-400">Kurang:</p>
                            <p class="font-bold ${sisa === 0 ? 'text-emerald-600' : 'text-amber-600'}">${sisa === 0 ? 'Lunas!' : formatRp(sisa)}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onclick="deleteTarget(${target.id})" class="text-xs text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-trash"></i> Hapus
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderFinanceHistory() {
    const tbody = document.getElementById('financeHistoryTable');
    tbody.innerHTML = '';

    const filteredHistory = state.history.filter(h => {
        if (currentFinanceFilter === 'all') return true;
        return h.category === currentFinanceFilter;
    });

    if (filteredHistory.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">Belum ada riwayat transaksi pada kategori ini.</td></tr>`;
        return;
    }

    filteredHistory.slice().reverse().forEach(item => {
        const isMasuk = item.type === 'masuk';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-2 text-xs text-slate-400">${item.date}</td>
            <td class="py-3 px-2">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isMasuk ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} uppercase">
                    ${isMasuk ? 'Uang Masuk' : 'Penarikan'}
                </span>
            </td>
            <td class="py-3 px-2 font-medium text-slate-700">${item.category === 'tabungan' ? 'Tabungan Jangka Panjang' : item.targetName}</td>
            <td class="py-3 px-2 font-bold ${isMasuk ? 'text-emerald-600' : 'text-rose-600'}">${isMasuk ? '+' : '-'}${formatRp(item.amount)}</td>
            <td class="py-3 px-2 text-xs text-slate-500">${item.note}</td>
        `;
        tbody.appendChild(row);
    });
}

// --- MODAL & ACTION HANDLERS ---
function openFinanceModal() {
    const targetGroup = document.getElementById('targetBarangSelectGroup');
    const targetSelect = document.getElementById('finTargetId');
    targetSelect.innerHTML = '';

    if (state.targets.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.innerText = "Belum ada target barang (tambah dulu)";
        targetSelect.appendChild(opt);
    } else {
        state.targets.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = `${t.name} (Sisa: ${formatRp(Math.max(0, t.price - t.collected))})`;
            targetSelect.appendChild(opt);
        });
    }

    toggleTargetSelect();
    document.getElementById('financeModal').classList.remove('hidden');
}

function closeFinanceModal() { document.getElementById('financeModal').classList.add('hidden'); }

function toggleTargetSelect() {
    const dest = document.getElementById('finDestination').value;
    const group = document.getElementById('targetBarangSelectGroup');
    if (dest === 'target') group.classList.remove('hidden');
    else group.classList.add('hidden');
}

function handleFinanceSubmit(e) {
    e.preventDefault();
    const dest = document.getElementById('finDestination').value;
    if (dest === 'target' && state.targets.length === 0) {
        alert("Harap buat target barang impian terlebih dahulu sebelum mengalokasikan dana ke target barang.");
        return;
    }

    showSpinner("Mengalokasikan dana...");
    setTimeout(() => {
        const amount = parseFloat(document.getElementById('finAmount').value);
        const note = document.getElementById('finNote').value || 'Uang Masuk';

        let targetName = '-';

        if (dest === 'tabungan') {
            state.savings += amount;
        } else if (dest === 'target') {
            const targetId = parseInt(document.getElementById('finTargetId').value);
            const targetObj = state.targets.find(t => t.id === targetId);
            if (targetObj) {
                targetObj.collected += amount;
                targetName = targetObj.name;
            }
        }

        state.history.push({
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            type: 'masuk',
            category: dest,
            targetName: targetName,
            amount: amount,
            note: note
        });

        saveData();
        renderFinance();
        closeFinanceModal();
        document.getElementById('financeForm').reset();
        hideSpinner();
    }, 300);
}

// Withdrawal Modal Handlers
function openWithdrawModal() {
    const targetSelect = document.getElementById('withdrawTargetId');
    targetSelect.innerHTML = '';

    if (state.targets.length === 0) {
        const opt = document.createElement('option');
        opt.value = "";
        opt.innerText = "Belum ada target barang";
        targetSelect.appendChild(opt);
    } else {
        state.targets.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.innerText = `${t.name} (Terkumpul: ${formatRp(t.collected)})`;
            targetSelect.appendChild(opt);
        });
    }

    toggleWithdrawSourceSelect();
    document.getElementById('withdrawModal').classList.remove('hidden');
}

function closeWithdrawModal() { document.getElementById('withdrawModal').classList.add('hidden'); }

function toggleWithdrawSourceSelect() {
    const src = document.getElementById('withdrawSource').value;
    const group = document.getElementById('withdrawTargetSelectGroup');
    if (src === 'target') group.classList.remove('hidden');
    else group.classList.add('hidden');
}

function handleWithdrawSubmit(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const src = document.getElementById('withdrawSource').value;
    const reason = document.getElementById('withdrawReason').value;

    let targetName = '-';

    if (src === 'tabungan') {
        if (amount > state.savings) {
            alert("Saldo tabungan tidak mencukupi!");
            return;
        }
        showSpinner("Proses penarikan...");
        setTimeout(() => {
            state.savings -= amount;
            recordWithdrawal(src, targetName, amount, reason);
        }, 300);
    } else if (src === 'target') {
        if (state.targets.length === 0) {
            alert("Tidak ada target barang.");
            return;
        }
        const targetId = parseInt(document.getElementById('withdrawTargetId').value);
        const targetObj = state.targets.find(t => t.id === targetId);
        if (!targetObj) return;

        if (amount > targetObj.collected) {
            alert("Nominal penarikan melebihi saldo yang terkumpul pada barang ini!");
            return;
        }
        showSpinner("Proses penarikan...");
        setTimeout(() => {
            targetObj.collected -= amount;
            targetName = targetObj.name;
            recordWithdrawal(src, targetName, amount, reason);
        }, 300);
    }
}

function recordWithdrawal(src, targetName, amount, reason) {
    state.history.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'tarik',
        category: src,
        targetName: targetName,
        amount: amount,
        note: reason
    });

    saveData();
    renderFinance();
    closeWithdrawModal();
    document.getElementById('withdrawForm').reset();
    hideSpinner();
}

// Wishlist Target Handlers
function openTargetModal() { document.getElementById('targetModal').classList.remove('hidden'); }
function closeTargetModal() { document.getElementById('targetModal').classList.add('hidden'); }

function handleTargetSubmit(e) {
    e.preventDefault();
    showSpinner("Menambahkan target barang...");
    setTimeout(() => {
        const newTarget = {
            id: Date.now(),
            name: document.getElementById('targetName').value,
            price: parseFloat(document.getElementById('targetPrice').value),
            collected: 0,
            image: document.getElementById('targetImage').value || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'
        };
        state.targets.push(newTarget);
        saveData();
        renderFinance();
        closeTargetModal();
        document.getElementById('targetForm').reset();
        hideSpinner();
    }, 300);
}

function deleteTarget(id) {
    if (!confirm("Hapus target barang ini? Saldo terkumpul pada barang ini akan disatukan kembali ke tabungan.")) return;
    showSpinner("Menghapus target...");
    setTimeout(() => {
        const t = state.targets.find(x => x.id === id);
        if (t) {
            state.savings += t.collected;
            state.targets = state.targets.filter(x => x.id !== id);
        }
        saveData();
        renderFinance();
        hideSpinner();
    }, 300);
}

// --- EXPORT FUNCTIONS ---
function exportToCSV() {
    showSpinner("Membuat file Excel/CSV...");
    setTimeout(() => {
        let csvContent = "data:text/csv;charset=utf-8,Tanggal,Jenis,Kategori/Barang,Nominal,Catatan/Alasan\n";
        state.history.forEach(row => {
            csvContent += `${row.date},${row.type},${row.category === 'tabungan' ? 'Tabungan Jangka Panjang' : row.targetName},${row.amount},"${row.note}"\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Keuangan_Arman_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        hideSpinner();
    }, 400);
}

function exportToPDF() {
    showSpinner("Menyiapkan mode cetak/PDF...");
    setTimeout(() => {
        hideSpinner();
        window.print();
    }, 400);
}

// --- CHART INTERACTIVES (CHART.JS) ---
function renderDashboard() {
    document.getElementById('dash-savings-total').innerText = formatRp(state.savings);
    const totalTargetCol = state.targets.reduce((acc, curr) => acc + curr.collected, 0);
    document.getElementById('dash-target-total').innerText = formatRp(totalTargetCol);

    const pendingCount = state.tasks.filter(t => !t.completed).length;
    document.getElementById('dash-pending-tasks').innerText = pendingCount;

    const ctx1 = document.getElementById('financialOverviewChart').getContext('2d');
    if (charts.overview) charts.overview.destroy();

    charts.overview = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Tabungan Jangka Panjang', 'Target Barang Impian'],
            datasets: [{
                data: [state.savings, totalTargetCol],
                backgroundColor: ['#059669', '#34d399'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    const ctx2 = document.getElementById('tasksProgressChart').getContext('2d');
    if (charts.tasks) charts.tasks.destroy();

    const osisCompleted = state.tasks.filter(t => t.category === 'osis' && t.completed).length;
    const osisPending = state.tasks.filter(t => t.category === 'osis' && !t.completed).length;
    const kelasCompleted = state.tasks.filter(t => t.category === 'kelas' && t.completed).length;
    const kelasPending = state.tasks.filter(t => t.category === 'kelas' && !t.completed).length;

    charts.tasks = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Tugas Utama', 'Tugas Kelas'],
            datasets: [
                { label: 'Selesai', data: [osisCompleted, kelasCompleted], backgroundColor: '#059669' },
                { label: 'Pending', data: [osisPending, kelasPending], backgroundColor: '#f59e0b' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
            scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
    });
}

function renderFinanceCategoryChart() {
    const ctx = document.getElementById('financeCategoryChart').getContext('2d');
    const labelTag = document.getElementById('chartCategoryLabel');
    if (charts.categoryChart) charts.categoryChart.destroy();

    if (currentFinanceFilter === 'all') {
        labelTag.innerText = 'Semua Kategori';
        charts.categoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Tabungan Jangka Panjang', ...state.targets.map(t => t.name)],
                datasets: [{
                    label: 'Nominal Terkumpul (Rp)',
                    data: [state.savings, ...state.targets.map(t => t.collected)],
                    backgroundColor: ['#059669', ...state.targets.map(() => '#10b981')]
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    } else if (currentFinanceFilter === 'tabungan') {
        labelTag.innerText = 'Tabungan Jangka Panjang';
        const tarikCount = state.history.filter(h => h.category === 'tabungan' && h.type === 'tarik').reduce((a, c) => a + c.amount, 0);

        charts.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Saldo Tabungan Saat Ini', 'Total Penarikan Tabungan'],
                datasets: [{
                    data: [state.savings, tarikCount],
                    backgroundColor: ['#059669', '#f43f5e']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
        });
    } else if (currentFinanceFilter === 'target') {
        labelTag.innerText = 'Target Barang / Wishlist';
        charts.categoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: state.targets.map(t => t.name),
                datasets: [
                    { label: 'Terkumpul (Rp)', data: state.targets.map(t => t.collected), backgroundColor: '#059669' },
                    { label: 'Kekurangan (Rp)', data: state.targets.map(t => Math.max(0, t.price - t.collected)), backgroundColor: '#cbd5e1' }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
            }
        });
    }
}