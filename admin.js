// Painel Administrativo - Gerenciamento de Agendamentos
class AdminManager {
    constructor() {
        this.appointments = this.loadAppointments();
        this.currentFilter = 'all';
        this.adminPassword = 'admin123'; // Altere esta senha
        this.init();
    }

    init() {
        // Verificar se já está logado
        if (this.isLoggedIn()) {
            this.showDashboard();
        }

        // Event listener para o login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
    }

    // Configurar event listeners após login
    setupEventListeners() {
        // Formatação de telefone no formulário de adicionar
        const phoneInput = document.getElementById('addClientPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', this.formatPhone);
        }

        // Atualizar horários disponíveis quando mudar a data
        const dateInput = document.getElementById('addAppointmentDate');
        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                this.updateAvailableHoursInModal(e.target.value);
            });
        }

        // Submit do formulário de adicionar agendamento
        const addForm = document.getElementById('addAppointmentForm');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addManualAppointment();
            });
        }
    }

    // Formatar telefone
    formatPhone(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
            if (value.length <= 10) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
            } else {
                value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
            }
            e.target.value = value;
        }
    }

    // Verificar se está logado
    isLoggedIn() {
        return sessionStorage.getItem('adminLoggedIn') === 'true';
    }

    // Login
    login() {
        const password = document.getElementById('password').value;
        
        if (password === this.adminPassword) {
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
        } else {
            alert('Senha incorreta!');
        }
    }

    // Logout
    logout() {
        if (confirm('Deseja realmente sair?')) {
            sessionStorage.removeItem('adminLoggedIn');
            document.getElementById('loginScreen').style.display = 'flex';
            document.getElementById('adminDashboard').style.display = 'none';
            document.getElementById('password').value = '';
        }
    }

    // Mostrar dashboard
    showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        this.setupEventListeners();
        this.updateStatistics();
        this.displayAppointments();
    }

    // Carregar agendamentos
    loadAppointments() {
        const saved = localStorage.getItem('appointments');
        return saved ? JSON.parse(saved) : [];
    }

    // Salvar agendamentos
    saveAppointments() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    }

    // Atualizar estatísticas
    updateStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // Total de agendamentos
        document.getElementById('totalAppointments').textContent = this.appointments.length;

        // Agendamentos de hoje
        const todayCount = this.appointments.filter(apt => apt.date === today).length;
        document.getElementById('todayAppointments').textContent = todayCount;

        // Agendamentos futuros
        const upcomingCount = this.appointments.filter(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return aptDate > now && !apt.completed;
        }).length;
        document.getElementById('upcomingAppointments').textContent = upcomingCount;

        // Receita total
        const totalRevenue = this.appointments
            .filter(apt => apt.completed)
            .reduce((sum, apt) => sum + (apt.price || 0), 0);
        document.getElementById('totalRevenue').textContent = `R$ ${totalRevenue.toFixed(2)}`;
    }

    // Filtrar agendamentos
    filterAppointments(filter) {
        this.currentFilter = filter;
        
        // Atualizar botões ativos
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.displayAppointments();
    }

    // Exibir agendamentos
    displayAppointments() {
        const container = document.getElementById('appointmentsAdminList');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        let filteredAppointments = [...this.appointments];

        // Aplicar filtro
        switch (this.currentFilter) {
            case 'today':
                filteredAppointments = filteredAppointments.filter(apt => apt.date === today);
                break;
            case 'upcoming':
                filteredAppointments = filteredAppointments.filter(apt => {
                    const aptDate = new Date(`${apt.date}T${apt.time}`);
                    return aptDate > now && !apt.completed;
                });
                break;
            case 'completed':
                filteredAppointments = filteredAppointments.filter(apt => apt.completed);
                break;
        }

        // Ordenar por data e hora
        filteredAppointments.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        if (filteredAppointments.length === 0) {
            container.innerHTML = '<div class="no-appointments-admin">Nenhum agendamento encontrado.</div>';
            return;
        }

        container.innerHTML = filteredAppointments.map(apt => this.createAppointmentCard(apt)).join('');
    }

    // Criar card de agendamento
    createAppointmentCard(appointment) {
        const formattedDate = this.formatDate(appointment.date);
        const completedClass = appointment.completed ? 'appointment-completed' : '';
        const serviceInfo = this.getServiceInfo(appointment.service);

        return `
            <div class="appointment-admin-card ${completedClass}">
                <div class="appointment-admin-header">
                    <div class="appointment-admin-info">
                        <div class="client-name">${appointment.clientName}</div>
                        <span class="service-badge">${appointment.service}</span>
                        
                        <div class="appointment-details">
                            <div class="detail-item">
                                <span>📅</span>
                                <span><strong>${formattedDate}</strong> às <strong>${appointment.time}</strong></span>
                            </div>
                            <div class="detail-item">
                                <span>📞</span>
                                <span>${appointment.phone}</span>
                            </div>
                            <div class="detail-item">
                                <span>📧</span>
                                <span>${appointment.email || 'Não informado'}</span>
                            </div>
                            <div class="detail-item">
                                <span>💰</span>
                                <span><strong>R$ ${serviceInfo.price.toFixed(2)}</strong></span>
                            </div>
                            <div class="detail-item">
                                <span>⏱️</span>
                                <span>${serviceInfo.duration} minutos</span>
                            </div>
                        </div>
                    </div>
                    <div class="appointment-admin-actions">
                        ${!appointment.completed ? `
                            <button class="btn-complete" onclick="adminManager.completeAppointment(${appointment.id})">
                                ✓ Concluir
                            </button>
                        ` : `
                            <span style="color: #4CAF50; font-weight: 600;">✓ Realizado</span>
                        `}
                        <button class="btn-delete" onclick="adminManager.deleteAppointment(${appointment.id})">
                            🗑️ Excluir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Formatar data
    formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        const date = new Date(year, month - 1, day);
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const weekday = weekdays[date.getDay()];
        return `${day}/${month}/${year} (${weekday})`;
    }

    // Obter informações do serviço
    getServiceInfo(serviceName) {
        const services = {
            'Manicure Básica': { price: 35, duration: 45 },
            'Manicure com Gel': { price: 65, duration: 60 },
            'Pedicure': { price: 40, duration: 60 },
            'Mão e Pé': { price: 70, duration: 90 },
            'Alongamento de Unhas': { price: 120, duration: 120 },
            'Nail Art': { price: 50, duration: 45 }
        };
        return services[serviceName] || { price: 0, duration: 0 };
    }

    // Completar agendamento
    completeAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            if (confirm(`Marcar agendamento de ${appointment.clientName} como concluído?`)) {
                appointment.completed = true;
                appointment.completedAt = new Date().toISOString();
                this.saveAppointments();
                this.updateStatistics();
                this.displayAppointments();
            }
        }
    }

    // Excluir agendamento
    deleteAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            if (confirm(`Tem certeza que deseja excluir o agendamento de ${appointment.clientName}?`)) {
                this.appointments = this.appointments.filter(apt => apt.id !== id);
                this.saveAppointments();
                this.updateStatistics();
                this.displayAppointments();
            }
        }
    }

    // Exportar dados (para backup)
    exportData() {
        const dataStr = JSON.stringify(this.appointments, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    // Mostrar modal de adicionar agendamento
    showAddAppointmentModal() {
        const modal = document.getElementById('addAppointmentModal');
        modal.style.display = 'block';
        
        // Definir data mínima como hoje
        const dateInput = document.getElementById('addAppointmentDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
        
        // Atualizar horários para hoje
        this.updateAvailableHoursInModal(today);
    }

    // Fechar modal de adicionar agendamento
    closeAddAppointmentModal() {
        const modal = document.getElementById('addAppointmentModal');
        modal.style.display = 'none';
        document.getElementById('addAppointmentForm').reset();
    }

    // Atualizar horários disponíveis no modal
    updateAvailableHoursInModal(selectedDate) {
        const timeSelect = document.getElementById('addAppointmentTime');
        const msgElement = document.getElementById('timeAvailabilityMsg');
        const availableHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        
        // Limpar opções existentes
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        
        // Filtrar horários já ocupados
        const occupiedHours = this.appointments
            .filter(apt => apt.date === selectedDate && !apt.completed)
            .map(apt => apt.time);
        
        let availableCount = 0;
        
        // Adicionar apenas horários disponíveis
        availableHours.forEach(hour => {
            // Só adiciona se NÃO estiver ocupado
            if (!occupiedHours.includes(hour)) {
                const option = document.createElement('option');
                option.value = hour;
                option.textContent = hour;
                timeSelect.appendChild(option);
                availableCount++;
            }
        });
        
        // Atualizar mensagem
        if (availableCount === 0) {
            msgElement.textContent = '⚠️ Todos os horários estão ocupados nesta data';
            msgElement.style.color = '#F44336';
            
            // Adicionar opção desabilitada para mostrar que não há horários
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum horário disponível';
            option.disabled = true;
            option.style.color = '#999';
            timeSelect.appendChild(option);
        } else {
            msgElement.textContent = `✓ ${availableCount} horário(s) disponível(is)`;
            msgElement.style.color = '#4CAF50';
        }
    }

    // Adicionar agendamento manualmente
    addManualAppointment() {
        const formData = {
            clientName: document.getElementById('addClientName').value.trim(),
            phone: document.getElementById('addClientPhone').value.trim(),
            email: document.getElementById('addClientEmail').value.trim(),
            service: document.getElementById('addServiceSelect').value,
            date: document.getElementById('addAppointmentDate').value,
            time: document.getElementById('addAppointmentTime').value
        };

        // Validações
        if (!formData.clientName) {
            alert('Por favor, digite o nome do cliente.');
            return;
        }

        if (!formData.phone) {
            alert('Por favor, digite o telefone.');
            return;
        }

        if (!formData.service) {
            alert('Por favor, selecione um serviço.');
            return;
        }

        if (!formData.date) {
            alert('Por favor, selecione uma data.');
            return;
        }

        if (!formData.time) {
            alert('Por favor, selecione um horário.');
            return;
        }

        // Verificar disponibilidade
        const isOccupied = this.appointments.some(apt => 
            apt.date === formData.date && 
            apt.time === formData.time && 
            !apt.completed
        );

        if (isOccupied) {
            alert('Este horário já está ocupado. Por favor, selecione outro horário.');
            this.updateAvailableHoursInModal(formData.date);
            return;
        }

        // Obter informações do serviço
        const serviceInfo = this.getServiceInfo(formData.service);
        
        // Criar agendamento
        const appointment = {
            id: Date.now(),
            ...formData,
            price: serviceInfo.price,
            duration: serviceInfo.duration,
            completed: false,
            createdAt: new Date().toISOString(),
            createdBy: 'admin' // Marcador para identificar que foi criado pela manicure
        };

        // Adicionar aos agendamentos
        this.appointments.push(appointment);
        this.saveAppointments();

        // Atualizar interface
        this.updateStatistics();
        this.displayAppointments();

        // Fechar modal e mostrar confirmação
        this.closeAddAppointmentModal();
        
        const formattedDate = this.formatDate(appointment.date);
        alert(`✅ Agendamento criado com sucesso!\n\nCliente: ${appointment.clientName}\nServiço: ${appointment.service}\nData: ${formattedDate} às ${appointment.time}`);
    }
}

// Inicializar gerenciador admin
const adminManager = new AdminManager();

// Atalho para exportar dados (Ctrl+E)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'e' && adminManager.isLoggedIn()) {
        e.preventDefault();
        adminManager.exportData();
    }
});

console.log('Painel Administrativo carregado!');
console.log('Pressione Ctrl+E para exportar dados');


