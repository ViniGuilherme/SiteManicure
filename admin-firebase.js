// Painel Administrativo - Gerenciamento de Agendamentos (Versão Firebase)
class AdminManagerFirebase {
    constructor() {
        this.currentFilter = 'all';
        this.adminPassword = 'admin123'; // Altere esta senha
        this.appointments = [];
        this.init();
    }

    async init() {
        // Verificar se já está logado
        if (this.isLoggedIn()) {
            await this.showDashboard();
        }

        // Event listener para o login
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
    }

    // Aguardar Firebase estar disponível
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.db && window.firestoreFunctions) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
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
    async showDashboard() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        // Aguardar Firebase carregar
        await this.waitForFirebase();
        
        this.setupEventListeners();
        await this.loadAppointments();
        this.updateStatistics();
        this.displayAppointments();
        this.setupRealtimeListener();
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

    // Carregar agendamentos do Firebase
    async loadAppointments() {
        try {
            const appointmentsRef = window.firestoreFunctions.collection(window.db, 'appointments');
            const q = window.firestoreFunctions.query(
                appointmentsRef,
                window.firestoreFunctions.orderBy('date', 'asc'),
                window.firestoreFunctions.orderBy('time', 'asc')
            );
            
            const querySnapshot = await window.firestoreFunctions.getDocs(q);
            this.appointments = [];
            
            querySnapshot.forEach((doc) => {
                this.appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            this.appointments = [];
        }
    }

    // Configurar listener em tempo real
    setupRealtimeListener() {
        try {
            const appointmentsRef = window.firestoreFunctions.collection(window.db, 'appointments');
            const q = window.firestoreFunctions.query(
                appointmentsRef,
                window.firestoreFunctions.orderBy('date', 'asc'),
                window.firestoreFunctions.orderBy('time', 'asc')
            );
            
            window.firestoreFunctions.onSnapshot(q, (querySnapshot) => {
                this.appointments = [];
                querySnapshot.forEach((doc) => {
                    this.appointments.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                this.updateStatistics();
                this.displayAppointments();
            });
            
        } catch (error) {
            console.error('Erro ao configurar listener:', error);
        }
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
                            <div class="detail-item">
                                <span>📱</span>
                                <span>${appointment.createdBy === 'admin' ? 'Agendado pela manicure' : 'Agendado online'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="appointment-admin-actions">
                        ${!appointment.completed ? `
                            <button class="btn-complete" onclick="adminManager.completeAppointment('${appointment.id}')">
                                ✓ Concluir
                            </button>
                        ` : `
                            <span style="color: #4CAF50; font-weight: 600;">✓ Realizado</span>
                        `}
                        <button class="btn-delete" onclick="adminManager.deleteAppointment('${appointment.id}')">
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
    async completeAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            if (confirm(`Marcar agendamento de ${appointment.clientName} como concluído?`)) {
                try {
                    const appointmentRef = window.firestoreFunctions.doc(window.db, 'appointments', id);
                    await window.firestoreFunctions.updateDoc(appointmentRef, {
                        completed: true,
                        completedAt: new Date().toISOString()
                    });
                } catch (error) {
                    console.error('Erro ao marcar como concluído:', error);
                    alert('Erro ao atualizar agendamento. Tente novamente.');
                }
            }
        }
    }

    // Excluir agendamento
    async deleteAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            if (confirm(`Tem certeza que deseja excluir o agendamento de ${appointment.clientName}?`)) {
                try {
                    const appointmentRef = window.firestoreFunctions.doc(window.db, 'appointments', id);
                    await window.firestoreFunctions.deleteDoc(appointmentRef);
                } catch (error) {
                    console.error('Erro ao excluir agendamento:', error);
                    alert('Erro ao excluir agendamento. Tente novamente.');
                }
            }
        }
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
    async updateAvailableHoursInModal(selectedDate) {
        const timeSelect = document.getElementById('addAppointmentTime');
        const msgElement = document.getElementById('timeAvailabilityMsg');
        const availableHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        
        // Limpar opções existentes
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        
        try {
            // Buscar horários ocupados no Firebase
            const appointmentsRef = window.firestoreFunctions.collection(window.db, 'appointments');
            const q = window.firestoreFunctions.query(
                appointmentsRef,
                window.firestoreFunctions.where('date', '==', selectedDate),
                window.firestoreFunctions.where('completed', '==', false)
            );
            
            const querySnapshot = await window.firestoreFunctions.getDocs(q);
            const occupiedHours = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                occupiedHours.push(data.time);
            });
            
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
            
        } catch (error) {
            console.error('Erro ao carregar horários:', error);
            msgElement.textContent = '⚠️ Erro ao carregar horários';
            msgElement.style.color = '#F44336';
        }
    }

    // Adicionar agendamento manualmente
    async addManualAppointment() {
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
        const appointmentsRef = window.firestoreFunctions.collection(window.db, 'appointments');
        const q = window.firestoreFunctions.query(
            appointmentsRef,
            window.firestoreFunctions.where('date', '==', formData.date),
            window.firestoreFunctions.where('time', '==', formData.time),
            window.firestoreFunctions.where('completed', '==', false)
        );
        
        const querySnapshot = await window.firestoreFunctions.getDocs(q);
        if (!querySnapshot.empty) {
            alert('Este horário já está ocupado. Por favor, selecione outro horário.');
            this.updateAvailableHoursInModal(formData.date);
            return;
        }

        // Obter informações do serviço
        const serviceInfo = this.getServiceInfo(formData.service);
        
        // Criar agendamento
        const appointment = {
            ...formData,
            price: serviceInfo.price,
            duration: serviceInfo.duration,
            completed: false,
            createdAt: new Date().toISOString(),
            createdBy: 'admin' // Marcador para identificar que foi criado pela manicure
        };

        try {
            // Salvar no Firebase
            await window.firestoreFunctions.addDoc(appointmentsRef, appointment);

            // Fechar modal e mostrar confirmação
            this.closeAddAppointmentModal();
            
            const formattedDate = this.formatDate(appointment.date);
            alert(`✅ Agendamento criado com sucesso!\n\nCliente: ${appointment.clientName}\nServiço: ${appointment.service}\nData: ${formattedDate} às ${appointment.time}`);
            
        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            alert('Erro ao criar agendamento. Tente novamente.');
        }
    }

    // Exportar dados (para backup)
    async exportData() {
        try {
            const appointmentsRef = window.firestoreFunctions.collection(window.db, 'appointments');
            const querySnapshot = await window.firestoreFunctions.getDocs(appointmentsRef);
            const appointments = [];
            
            querySnapshot.forEach((doc) => {
                appointments.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            const dataStr = JSON.stringify(appointments, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `agendamentos_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            alert('Erro ao exportar dados. Tente novamente.');
        }
    }
}

// Inicializar gerenciador admin
const adminManager = new AdminManagerFirebase();

// Atalho para exportar dados (Ctrl+E)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'e' && adminManager.isLoggedIn()) {
        e.preventDefault();
        adminManager.exportData();
    }
});

console.log('Painel Administrativo Firebase carregado!');
console.log('Pressione Ctrl+E para exportar dados');
