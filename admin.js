// Sistema Administrativo com Firebase
class FirebaseAdminManager {
    constructor() {
        this.appointments = [];
        this.services = [];
        this.availableHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        this.availableDays = {
            'monday': true,
            'tuesday': true,
            'wednesday': true,
            'thursday': true,
            'friday': true,
            'saturday': true,
            'sunday': false
        };
        this.currentFilter = 'all';
        this.isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
        
        this.init();
    }

    async init() {
        // Aguardar Firebase carregar
        await this.waitForFirebase();
        
        if (this.isLoggedIn) {
            await this.loadDataFromFirebase();
            this.setupRealtimeListeners();
            this.showDashboard();
        } else {
            this.showLogin();
        }
        
        this.setupEventListeners();
    }
    
    async waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.db && window.firestore) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    async loadDataFromFirebase() {
        try {
            // Carregar agendamentos (sem ordenação temporariamente)
            const appointmentsQuery = window.firestore.collection(window.db, 'appointments');
            const appointmentsSnapshot = await window.firestore.getDocs(appointmentsQuery);
            this.appointments = [];
            appointmentsSnapshot.forEach((doc) => {
                this.appointments.push({ id: doc.id, ...doc.data() });
            });
            
            // Carregar serviços
            const servicesSnapshot = await window.firestore.getDocs(window.firestore.collection(window.db, 'services'));
            if (!servicesSnapshot.empty) {
                this.services = [];
                servicesSnapshot.forEach((doc) => {
                    this.services.push({ id: doc.id, ...doc.data() });
                });
            } else {
                // Usar serviços padrão se não houver no Firebase
                this.services = this.getDefaultServices();
            }
            
            // Carregar horários disponíveis
            const hoursDoc = await window.firestore.doc(window.db, 'settings', 'availableHours').get();
            if (hoursDoc.exists) {
                this.availableHours = hoursDoc.data().hours;
            }
            
            // Carregar dias disponíveis
            const daysDoc = await window.firestore.doc(window.db, 'settings', 'availableDays').get();
            if (daysDoc.exists) {
                this.availableDays = daysDoc.data().days;
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            // Usar dados padrão em caso de erro
            this.services = this.getDefaultServices();
        }
    }
    
    setupRealtimeListeners() {
        // Listener para agendamentos em tempo real (sem ordenação temporariamente)
        const appointmentsQuery = window.firestore.collection(window.db, 'appointments');
        
        window.firestore.onSnapshot(appointmentsQuery, (querySnapshot) => {
            this.appointments = [];
            querySnapshot.forEach((doc) => {
                this.appointments.push({ id: doc.id, ...doc.data() });
            });
            this.updateStatistics();
            this.displayAppointments();
        });
    }
    
    setupEventListeners() {
    // Login
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
        
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.logout();
        });
        
        // Filtros
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterAppointments(filter);
            });
        });
        
        // Modal de configurações
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
        
        // Modal de adicionar agendamento
        document.getElementById('addAppointmentBtn')?.addEventListener('click', () => {
            this.showAddAppointmentModal();
        });
        
        // Modal de reset
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            this.showResetModal();
        });
    }
    
    login() {
        const password = document.getElementById('password').value;
        
        if (password === 'admin123') {
            this.isLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
            this.loadDataFromFirebase();
            this.setupRealtimeListeners();
        } else {
            alert('Senha incorreta!');
            document.getElementById('password').value = '';
        }
    }

    logout() {
        this.isLoggedIn = false;
            sessionStorage.removeItem('adminLoggedIn');
        this.showLogin();
    }
    
    showLogin() {
        document.getElementById('loginContainer').style.display = 'flex';
            document.getElementById('adminDashboard').style.display = 'none';
    }

    showDashboard() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        this.updateStatistics();
        this.displayAppointments();
    }

    // Atualizar estatísticas
    updateStatistics() {
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // Filtrar apenas agendamentos principais (não slots de bloqueio)
        const mainAppointments = this.appointments.filter(apt => !apt.isBlockSlot);

        // Total de agendamentos
        document.getElementById('totalAppointments').textContent = mainAppointments.length;

        // Agendamentos de hoje
        const todayCount = mainAppointments.filter(apt => apt.date === today).length;
        document.getElementById('todayAppointments').textContent = todayCount;

        // Agendamentos futuros
        const upcomingCount = mainAppointments.filter(apt => {
            const aptDate = new Date(`${apt.date}T${apt.time}`);
            return aptDate > now && !apt.completed;
        }).length;
        document.getElementById('upcomingAppointments').textContent = upcomingCount;

        // Receita total
        const totalRevenue = mainAppointments
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
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.displayAppointments();
    }

    // Exibir agendamentos
    displayAppointments() {
        const container = document.getElementById('appointmentsAdminList');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        let filteredAppointments = [...this.appointments];
        
        // Filtrar apenas agendamentos principais (não mostrar slots de bloqueio)
        filteredAppointments = filteredAppointments.filter(apt => !apt.isBlockSlot);

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
            container.innerHTML = '<p style="text-align: center; color: #ccc; padding: 2rem;">Nenhum agendamento encontrado.</p>';
            return;
        }

        container.innerHTML = filteredAppointments.map(appointment => this.createAppointmentCard(appointment)).join('');
    }

    // Criar card de agendamento
    createAppointmentCard(appointment) {
        const formattedDate = this.formatDate(appointment.date);
        const servicesText = appointment.services ? 
            appointment.services.map(s => typeof s === 'object' ? s.name : s).join(', ') : 
            appointment.service;
        
        const totalDuration = appointment.totalDuration || appointment.duration || 0;
        const totalPrice = appointment.totalPrice || appointment.price || 0;

        return `
            <div class="appointment-admin-card">
                <div class="appointment-admin-header">
                    <h3>${appointment.clientName}</h3>
                    <span class="appointment-status ${appointment.completed ? 'completed' : 'pending'}">
                        ${appointment.completed ? '✅ Concluído' : '⏳ Pendente'}
                    </span>
                </div>
                <div class="appointment-admin-details">
                    <div class="detail-row">
                                <span>📅</span>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="detail-row">
                        <span>🕒</span>
                        <span>${appointment.time}</span>
                            </div>
                    <div class="detail-row">
                        <span>💅</span>
                        <span>${servicesText}</span>
                            </div>
                    <div class="detail-row">
                        <span>⏱️</span>
                        <span>${totalDuration} minutos</span>
                            </div>
                    <div class="detail-row">
                                <span>💰</span>
                        <span>R$ ${totalPrice.toFixed(2)}</span>
                            </div>
                    <div class="detail-row">
                                <span>📱</span>
                        <span>${appointment.phone}</span>
                            </div>
                    ${appointment.email ? `
                    <div class="detail-row">
                        <span>📧</span>
                        <span>${appointment.email}</span>
                    </div>
                    ` : ''}
                    </div>
                    <div class="appointment-admin-actions">
                        ${!appointment.completed ? `
                            <button class="btn-complete" onclick="adminManager.completeAppointment('${appointment.id}')">
                                ✓ Concluir
                            </button>
                        <button class="btn-delete" onclick="adminManager.deleteAppointment('${appointment.id}')">
                            🗑️ Cancelar Agendamento
                        </button>
                    ` : `
                        <div style="text-align: center; color: #4CAF50; font-weight: 600; padding: 1rem; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border: 1px solid #4CAF50;">
                            ✅ Serviço Concluído
                    </div>
                    `}
                </div>
            </div>
        `;
    }

    // Concluir agendamento
    async completeAppointment(id) {
        try {
            await window.firestore.updateDoc(window.firestore.doc(window.db, 'appointments', id), {
                completed: true
            });
            alert('✅ Agendamento concluído com sucesso!');
                } catch (error) {
            console.error('Erro ao concluir agendamento:', error);
            alert('Erro ao concluir agendamento. Tente novamente.');
        }
    }

    // Excluir agendamento
    async deleteAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            const confirmMessage = `Tem certeza que deseja cancelar o agendamento de ${appointment.clientName}?\n\n` +
                                 `📅 Data: ${this.formatDate(appointment.date)}\n` +
                                 `🕒 Horário: ${appointment.time}\n` +
                                 `💅 Serviço: ${appointment.services ? appointment.services.join(', ') : appointment.service}\n\n` +
                                 `⚠️ Esta ação não pode ser desfeita!`;
            
            if (confirm(confirmMessage)) {
                try {
                    // Deletar agendamento principal
                    await window.firestore.deleteDoc(window.firestore.doc(window.db, 'appointments', id));
                    
                    // Deletar slots de bloqueio relacionados
                    const blockSlots = this.appointments.filter(apt => 
                        apt.isBlockSlot && apt.mainAppointmentId === id
                    );
                    
                    for (const slot of blockSlots) {
                        await window.firestore.deleteDoc(window.firestore.doc(window.db, 'appointments', slot.id));
                    }
                    
                    alert(`✅ Agendamento de ${appointment.clientName} foi cancelado com sucesso!`);
                } catch (error) {
                    console.error('Erro ao cancelar agendamento:', error);
                    alert('Erro ao cancelar agendamento. Tente novamente.');
                }
            }
        }
    }
    
    // Formatar data
    formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    // Mostrar modal de configurações
    showSettingsModal() {
        document.getElementById('settingsModal').style.display = 'block';
        this.showSettingsTab('services');
    }
    
    // Fechar modal de configurações
    closeSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }
    
    // Mostrar aba de configurações
    showSettingsTab(tab) {
        // Esconder todas as abas
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        
        // Remover classe ativa de todos os botões
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        document.getElementById(`${tab}Tab`).style.display = 'block';
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        // Renderizar conteúdo da aba
        switch (tab) {
            case 'services':
                this.renderServices();
                break;
            case 'hours':
                this.renderHours();
                break;
            case 'days':
                this.renderDaysConfiguration();
                break;
        }
    }
    
    // Renderizar serviços
    renderServices() {
        const container = document.getElementById('servicesList');
        container.innerHTML = this.services.map(service => `
            <div class="service-item">
                <div class="service-info">
                    <span class="service-icon">${service.icon}</span>
                    <span class="service-name">${service.name}</span>
                    <span class="service-price">R$ ${service.price.toFixed(2)}</span>
                    <span class="service-duration">${service.duration} min</span>
                </div>
                <button class="btn-delete" onclick="adminManager.deleteService('${service.id}')">🗑️</button>
            </div>
        `).join('');
    }
    
    // Renderizar horários
    renderHours() {
        const container = document.getElementById('hoursList');
        container.innerHTML = this.availableHours.map(hour => `
            <div class="hour-item">
                <span>${hour}</span>
                <button class="btn-delete" onclick="adminManager.deleteHour('${hour}')">🗑️</button>
            </div>
        `).join('');
    }
    
    // Renderizar configuração de dias
    renderDaysConfiguration() {
        const container = document.getElementById('daysList');
        const dayNames = {
            'monday': 'Segunda-feira',
            'tuesday': 'Terça-feira',
            'wednesday': 'Quarta-feira',
            'thursday': 'Quinta-feira',
            'friday': 'Sexta-feira',
            'saturday': 'Sábado',
            'sunday': 'Domingo'
        };
        
        container.innerHTML = Object.entries(this.availableDays).map(([day, active]) => `
            <div class="day-item ${active ? 'active' : ''}" onclick="adminManager.toggleDay('${day}')">
                <div class="day-checkbox">
                    <input type="checkbox" ${active ? 'checked' : ''} class="day-checkbox-input">
                </div>
                <div class="day-info">
                    <div class="day-name">${dayNames[day]}</div>
                    <div class="day-status">${active ? 'Ativo' : 'Inativo'}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Alternar dia
    toggleDay(day) {
        this.availableDays[day] = !this.availableDays[day];
        this.renderDaysConfiguration();
        this.updateDaysSummary();
    }
    
    // Atualizar resumo de dias
    updateDaysSummary() {
        const activeDays = Object.values(this.availableDays).filter(Boolean).length;
        const summary = document.getElementById('daysSummary');
        summary.textContent = `${activeDays} dias ativos na semana`;
    }
    
    // Salvar configuração de dias
    async saveDaysConfiguration() {
        try {
            await window.firestore.setDoc(window.firestore.doc(window.db, 'settings', 'availableDays'), {
                days: this.availableDays
            });
            alert('✅ Configuração de dias salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar dias:', error);
            alert('Erro ao salvar configuração. Tente novamente.');
        }
    }
    
    // Restaurar configuração padrão de dias
    resetDaysToDefault() {
        if (confirm('Deseja restaurar a configuração padrão de dias (Segunda a Sábado)?')) {
            const defaultDays = {
                'monday': true,
                'tuesday': true,
                'wednesday': true,
                'thursday': true,
                'friday': true,
                'saturday': true,
                'sunday': false
            };
            this.availableDays = defaultDays;
            this.renderDaysConfiguration();
            alert('✅ Configuração padrão restaurada!');
        }
    }
    
    // Obter serviços padrão
    getDefaultServices() {
        return [
            { id: 1, name: 'Manicure Básica', icon: '💅', price: 35, duration: 45, description: 'Manicure tradicional com esmaltação' },
            { id: 2, name: 'Manicure com Gel', icon: '✨', price: 65, duration: 60, description: 'Unha em gel com acabamento profissional e duradouro' },
            { id: 3, name: 'Pedicure', icon: '🦶', price: 40, duration: 60, description: 'Cuidados completos para os pés com hidratação' },
            { id: 4, name: 'Mão e Pé', icon: '💎', price: 70, duration: 90, description: 'Pacote completo com manicure e pedicure' },
            { id: 5, name: 'Alongamento de Unhas', icon: '🎨', price: 120, duration: 120, description: 'Alongamento em gel ou fibra de vidro' },
            { id: 6, name: 'Nail Art', icon: '🌸', price: 50, duration: 45, description: 'Decoração personalizada e criativa' }
        ];
    }
}

// Inicializar gerenciador admin
const adminManager = new FirebaseAdminManager();