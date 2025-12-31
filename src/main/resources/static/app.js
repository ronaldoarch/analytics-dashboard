// Detectar URL da API automaticamente
const getApiBaseUrl = () => {
    // Se estiver em produção (Railway, Render, etc), usar a URL atual
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.host}/api`;
    }
    // Desenvolvimento local
    return 'http://localhost:8080/api';
};

const API_BASE_URL = getApiBaseUrl();

let categoryChart, timeSeriesChart, topMetricsChart, categoryTotalsChart;
let authToken = localStorage.getItem('authToken');
let currentUser = null;

// Paginação
let currentPage = 1;
let itemsPerPage = 10;
let allMetrics = [];
let filteredMetrics = [];
let searchTerm = '';

// Inicializar gráficos
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupAuthHandlers();
    checkAuth();
    setupFormValidation();
    updateCharCount(); // Inicializar contador de caracteres
    loadDashboardData();
    loadMetricsTable();
    setupFormHandler();
    
    // Atualizar dados a cada 5 segundos
    setInterval(() => {
        loadDashboardData();
        // Não recarregar tabela automaticamente para manter paginação e filtros
    }, 5000);
});

// Autenticação
function setupAuthHandlers() {
    const modal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const closeBtn = document.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    
    loginBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;
        checkAuth();
    });
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                authToken = data.token;
                currentUser = data;
                localStorage.setItem('authToken', authToken);
                modal.style.display = 'none';
                checkAuth();
                showNotification('Login realizado com sucesso!', 'success');
            } else {
                showNotification('Credenciais inválidas', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            showNotification('Erro ao fazer login', 'error');
        }
    });
}

function checkAuth() {
    const loginBtn = document.getElementById('loginBtn');
    const authSection = document.getElementById('authSection');
    const userInfo = document.getElementById('userInfo');
    
    if (authToken && currentUser) {
        loginBtn.style.display = 'none';
        authSection.style.display = 'block';
        userInfo.textContent = `Olá, ${currentUser.name || currentUser.username}`;
    } else {
        loginBtn.style.display = 'block';
        authSection.style.display = 'none';
    }
}

function getAuthHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// Filtros
async function applyFilters() {
    currentPage = 1;
    applySearchAndFilters();
    renderTable();
    updatePagination();
    showNotification('Filtros aplicados', 'success');
}

function clearFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterMinValue').value = '';
    document.getElementById('filterMaxValue').value = '';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    document.getElementById('searchInput').value = '';
    searchTerm = '';
    currentPage = 1;
    applySearchAndFilters();
    renderTable();
    updatePagination();
    showNotification('Filtros limpos', 'info');
}

// Exportação
async function exportToExcel() {
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/export/excel`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'metricas.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('Excel exportado com sucesso!', 'success');
        } else if (response.status === 401 || response.status === 403) {
            showNotification('Você precisa fazer login para exportar dados.', 'error');
            document.getElementById('loginModal').style.display = 'block';
        } else {
            showNotification('Erro ao exportar Excel', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao exportar Excel', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

async function exportToPdf() {
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/export/pdf`, {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'metricas.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            showNotification('PDF exportado com sucesso!', 'success');
        } else if (response.status === 401 || response.status === 403) {
            showNotification('Você precisa fazer login para exportar dados.', 'error');
            document.getElementById('loginModal').style.display = 'block';
        } else {
            showNotification('Erro ao exportar PDF', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao exportar PDF', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

function initializeCharts() {
    // Gráfico de distribuição por categoria
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    borderColor: 'rgba(74, 144, 226, 0.5)',
                    borderWidth: 1
                }
            }
        }
    });

    // Gráfico de série temporal
    const timeSeriesCtx = document.getElementById('timeSeriesChart').getContext('2d');
    timeSeriesChart = new Chart(timeSeriesCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(232, 234, 237, 0.7)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(232, 234, 237, 0.7)'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: 'rgba(232, 234, 237, 0.9)',
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    borderColor: 'rgba(74, 144, 226, 0.5)',
                    borderWidth: 1
                }
            }
        }
    });

    // Gráfico de top métricas
    const topMetricsCtx = document.getElementById('topMetricsChart').getContext('2d');
    topMetricsChart = new Chart(topMetricsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Valor',
                data: [],
                backgroundColor: []
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(232, 234, 237, 0.7)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(232, 234, 237, 0.7)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(232, 234, 237, 0.9)'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    borderColor: 'rgba(74, 144, 226, 0.5)',
                    borderWidth: 1
                }
            }
        }
    });

    // Gráfico de totais por categoria
    const categoryTotalsCtx = document.getElementById('categoryTotalsChart').getContext('2d');
    categoryTotalsChart = new Chart(categoryTotalsCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Total',
                data: [],
                backgroundColor: '#4A90E2'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(232, 234, 237, 0.7)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: 'rgba(232, 234, 237, 0.7)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(232, 234, 237, 0.9)'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 },
                    borderColor: 'rgba(74, 144, 226, 0.5)',
                    borderWidth: 1
                }
            }
        }
    });
}

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE_URL}/metrics/dashboard`);
        if (!response.ok) throw new Error('Erro ao carregar dados');
        
        const data = await response.json();
        updateStats(data);
        updateCharts(data);
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
        // Não mostrar erro para não poluir a tela, já que atualiza a cada 5s
    }
}

function updateStats(data) {
    document.getElementById('totalMetrics').textContent = data.totalMetrics || 0;
    document.getElementById('averageValue').textContent = 
        data.averageValue ? data.averageValue.toFixed(2) : '0.00';
    
    // Encontrar categoria top
    if (data.metricsByCategory && Object.keys(data.metricsByCategory).length > 0) {
        const topCategory = Object.entries(data.metricsByCategory)
            .sort((a, b) => b[1] - a[1])[0][0];
        document.getElementById('topCategory').textContent = topCategory;
    }
    
    // Calcular valor total
    if (data.categoryTotals) {
        const total = Object.values(data.categoryTotals)
            .reduce((sum, val) => sum + val, 0);
        document.getElementById('totalValue').textContent = total.toFixed(2);
    }
}

function updateCharts(data) {
    // Atualizar gráfico de distribuição por categoria
    if (data.metricsByCategory) {
        const categories = Object.keys(data.metricsByCategory);
        const values = Object.values(data.metricsByCategory);
        const colors = ['#4A90E2', '#7B68EE', '#50C878', '#F39C12', '#E74C3C'];
        
        categoryChart.data.labels = categories;
        categoryChart.data.datasets[0].data = values;
        categoryChart.data.datasets[0].backgroundColor = 
            categories.map((_, i) => colors[i % colors.length]);
        categoryChart.update();
    }
    
    // Atualizar gráfico de série temporal
    if (data.timeSeries && data.timeSeries.length > 0) {
        const timeLabels = data.timeSeries.map(item => 
            new Date(item.timestamp).toLocaleTimeString('pt-BR')
        );
        
        const categories = [...new Set(data.timeSeries.map(item => item.category))];
        const datasets = categories.map(category => {
            const categoryData = data.timeSeries
                .filter(item => item.category === category)
                .map(item => item.value);
            
            return {
                label: category,
                data: categoryData,
                borderColor: getColorForCategory(category),
                backgroundColor: getColorForCategory(category, 0.1),
                tension: 0.4
            };
        });
        
        timeSeriesChart.data.labels = timeLabels;
        timeSeriesChart.data.datasets = datasets;
        timeSeriesChart.update();
    }
    
    // Atualizar gráfico de top métricas
    if (data.topMetrics && data.topMetrics.length > 0) {
        topMetricsChart.data.labels = data.topMetrics.map(m => m.name);
        topMetricsChart.data.datasets[0].data = data.topMetrics.map(m => m.value);
        topMetricsChart.data.datasets[0].backgroundColor = 
            data.topMetrics.map(m => m.color || '#4A90E2');
        topMetricsChart.update();
    }
    
    // Atualizar gráfico de totais por categoria
    if (data.categoryTotals) {
        categoryTotalsChart.data.labels = Object.keys(data.categoryTotals);
        categoryTotalsChart.data.datasets[0].data = Object.values(data.categoryTotals);
        categoryTotalsChart.update();
    }
}

function getColorForCategory(category, alpha = 1) {
    const colors = {
        'Vendas': `rgba(74, 144, 226, ${alpha})`,      // Azul primário
        'Marketing': `rgba(123, 104, 238, ${alpha})`,   // Roxo secundário
        'Suporte': `rgba(80, 200, 120, ${alpha})`,     // Verde accent
        'Desenvolvimento': `rgba(243, 156, 18, ${alpha})`, // Laranja warning
        'Financeiro': `rgba(231, 76, 60, ${alpha})`     // Vermelho danger
    };
    return colors[category] || `rgba(74, 144, 226, ${alpha})`;
}

async function loadMetricsTable() {
    const loadingEl = document.getElementById('tableLoading');
    const tableContainer = document.getElementById('tableContainer');
    
    try {
        loadingEl.style.display = 'flex';
        tableContainer.style.display = 'none';
        
        const response = await fetch(`${API_BASE_URL}/metrics`);
        allMetrics = await response.json();
        filteredMetrics = [...allMetrics];
        
        applySearchAndFilters();
        renderTable();
        updatePagination();
        
        loadingEl.style.display = 'none';
        tableContainer.style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar tabela de métricas:', error);
        loadingEl.style.display = 'none';
        showNotification('Erro ao carregar métricas', 'error');
    }
}

function renderTable() {
    const tbody = document.getElementById('metricsTableBody');
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageMetrics = filteredMetrics.slice(startIndex, endIndex);
    
    if (pageMetrics.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-secondary);">Nenhuma métrica encontrada</td></tr>';
        return;
    }
    
    pageMetrics.forEach(metric => {
        const row = document.createElement('tr');
        const date = new Date(metric.timestamp).toLocaleString('pt-BR');
        
        row.innerHTML = `
            <td>${metric.name}</td>
            <td><span style="color: ${metric.color || '#4A90E2'}">●</span> ${metric.category}</td>
            <td><strong>${metric.value.toFixed(2)}</strong></td>
            <td>${date}</td>
            <td>
                <button class="btn-delete" onclick="deleteMetric(${metric.id})">
                    Deletar
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(filteredMetrics.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMetrics.length);
    
    document.getElementById('paginationInfo').textContent = 
        `Mostrando ${filteredMetrics.length > 0 ? startIndex + 1 : 0} - ${endIndex} de ${filteredMetrics.length}`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages || totalPages === 0;
    
    const pageNumbersEl = document.getElementById('pageNumbers');
    pageNumbersEl.innerHTML = '';
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.onclick = () => goToPage(i);
        pageNumbersEl.appendChild(pageBtn);
    }
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredMetrics.length / itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function goToPage(page) {
    currentPage = page;
    renderTable();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSearch() {
    searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    currentPage = 1;
    applySearchAndFilters();
    renderTable();
    updatePagination();
}

function applySearchAndFilters() {
    filteredMetrics = allMetrics.filter(metric => {
        // Busca
        if (searchTerm) {
            const matchesSearch = 
                metric.name.toLowerCase().includes(searchTerm) ||
                metric.category.toLowerCase().includes(searchTerm) ||
                (metric.description && metric.description.toLowerCase().includes(searchTerm));
            if (!matchesSearch) return false;
        }
        
        // Filtros
        const category = document.getElementById('filterCategory').value;
        if (category && metric.category !== category) return false;
        
        const minValue = document.getElementById('filterMinValue').value;
        if (minValue && metric.value < parseFloat(minValue)) return false;
        
        const maxValue = document.getElementById('filterMaxValue').value;
        if (maxValue && metric.value > parseFloat(maxValue)) return false;
        
        const startDate = document.getElementById('filterStartDate').value;
        if (startDate) {
            const metricDate = new Date(metric.timestamp).toISOString().split('T')[0];
            if (metricDate < startDate) return false;
        }
        
        const endDate = document.getElementById('filterEndDate').value;
        if (endDate) {
            const metricDate = new Date(metric.timestamp).toISOString().split('T')[0];
            if (metricDate > endDate) return false;
        }
        
        return true;
    });
}

function setupFormValidation() {
    const form = document.getElementById('metricForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.id === 'description') {
                updateCharCount();
            }
            clearFieldError(input);
        });
    });
    
    const descriptionInput = document.getElementById('description');
    if (descriptionInput) {
        descriptionInput.addEventListener('input', updateCharCount);
    }
}

function updateCharCount() {
    const description = document.getElementById('description');
    const count = document.getElementById('descriptionCount');
    if (description && count) {
        count.textContent = description.value.length;
    }
}

function validateField(field) {
    const errorEl = document.getElementById(field.id + 'Error');
    let isValid = true;
    let errorMessage = '';
    
    if (field.hasAttribute('required') && !field.value.trim()) {
        isValid = false;
        errorMessage = 'Este campo é obrigatório';
    } else if (field.id === 'name' && field.value.length < 3) {
        isValid = false;
        errorMessage = 'Nome deve ter pelo menos 3 caracteres';
    } else if (field.id === 'value' && parseFloat(field.value) < 0) {
        isValid = false;
        errorMessage = 'Valor deve ser positivo';
    } else if (field.id === 'category' && !field.value) {
        isValid = false;
        errorMessage = 'Selecione uma categoria';
    }
    
    if (errorEl) {
        errorEl.textContent = errorMessage;
        field.classList.toggle('error', !isValid);
    }
    
    return isValid;
}

function clearFieldError(field) {
    const errorEl = document.getElementById(field.id + 'Error');
    if (errorEl) {
        errorEl.textContent = '';
    }
    field.classList.remove('error');
}

function setupFormHandler() {
    const form = document.getElementById('metricForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validar todos os campos
        const nameField = document.getElementById('name');
        const categoryField = document.getElementById('category');
        const valueField = document.getElementById('value');
        
        const isValid = 
            validateField(nameField) &&
            validateField(categoryField) &&
            validateField(valueField);
        
        if (!isValid) {
            showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }
        
        const formData = {
            name: nameField.value.trim(),
            category: categoryField.value,
            value: parseFloat(valueField.value),
            color: document.getElementById('color').value,
            description: document.getElementById('description').value.trim()
        };
        
        // Mostrar loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        showLoadingOverlay(true);
        
        try {
            const response = await fetch(`${API_BASE_URL}/metrics`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                form.reset();
                updateCharCount();
                loadDashboardData();
                loadMetricsTable();
                showNotification('Métrica adicionada com sucesso!', 'success');
            } else if (response.status === 401 || response.status === 403) {
                showNotification('Você precisa fazer login para adicionar métricas.', 'error');
                document.getElementById('loginModal').style.display = 'block';
            } else {
                showNotification('Erro ao adicionar métrica', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showNotification('Erro ao adicionar métrica', 'error');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            showLoadingOverlay(false);
        }
    });
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

async function deleteMetric(id) {
    if (!confirm('Tem certeza que deseja deletar esta métrica?')) {
        return;
    }
    
    showLoadingOverlay(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/metrics/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            loadDashboardData();
            loadMetricsTable();
            showNotification('Métrica deletada com sucesso!', 'success');
        } else if (response.status === 401 || response.status === 403) {
            showNotification('Você precisa fazer login para deletar métricas.', 'error');
            document.getElementById('loginModal').style.display = 'block';
        } else {
            showNotification('Erro ao deletar métrica', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showNotification('Erro ao deletar métrica', 'error');
    } finally {
        showLoadingOverlay(false);
    }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Adicionar ao body
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remover após 4 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

