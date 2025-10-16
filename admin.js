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
            
            if (servicesSnapshot.empty) {
                // Não há serviços no Firebase, criar os padrão
                console.log('Nenhum serviço encontrado no Firebase, criando padrões...');
                await this.ensureServicesInFirebase();
            } else {
                // Carregar serviços existentes
                this.services = [];
                servicesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Verificar se é um documento de serviços padrão ou um serviço individual
                    if (data.services && Array.isArray(data.services)) {
                        // É um documento de serviços padrão
                        this.services = data.services;
                    } else {
                        // É um serviço individual
                        this.services.push({ id: doc.id, ...data });
                    }
                });
                
                // Se ainda não há serviços, usar os padrão
                if (this.services.length === 0) {
                    console.log('Nenhum serviço válido encontrado, criando padrões...');
                    await this.ensureServicesInFirebase();
                } else {
                    // Verificar se há serviços com IDs padrão que precisam ser migrados
                    await this.migrateDefaultServices();
                }
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
    
    // Funções do modal de reset
    showResetModal() {
        document.getElementById('resetModal').style.display = 'block';
    }
    
    closeResetModal() {
        document.getElementById('resetModal').style.display = 'none';
    }
    
    async resetData(type) {
        let confirmMessage = '';
        let actionDescription = '';
        
        switch(type) {
            case 'completed':
                confirmMessage = 'Tem certeza que deseja excluir TODOS os agendamentos concluídos?\n\n⚠️ Esta ação não pode ser desfeita!';
                actionDescription = 'agendamentos concluídos';
                break;
            case 'pending':
                confirmMessage = 'Tem certeza que deseja excluir TODOS os agendamentos pendentes?\n\n⚠️ Esta ação não pode ser desfeita!';
                actionDescription = 'agendamentos pendentes';
                break;
            case 'allAppointments':
                confirmMessage = 'Tem certeza que deseja excluir TODOS os agendamentos?\n\n⚠️ Esta ação não pode ser desfeita!';
                actionDescription = 'todos os agendamentos';
                break;
            case 'services':
                confirmMessage = 'Tem certeza que deseja resetar os serviços para o padrão?\n\n⚠️ Todos os serviços personalizados serão perdidos!';
                actionDescription = 'serviços';
                break;
            case 'hours':
                confirmMessage = 'Tem certeza que deseja resetar os horários para o padrão?\n\n⚠️ Todos os horários personalizados serão perdidos!';
                actionDescription = 'horários';
                break;
            case 'days':
                confirmMessage = 'Tem certeza que deseja resetar os dias da semana para o padrão?\n\n⚠️ Todas as configurações de dias serão perdidas!';
                actionDescription = 'dias da semana';
                break;
            case 'everything':
                confirmMessage = '🚨 ATENÇÃO: Você está prestes a excluir TODOS os dados do sistema!\n\nIsso inclui:\n• Todos os agendamentos\n• Todos os serviços personalizados\n• Todos os horários personalizados\n• Todas as configurações\n\n⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!\n\nTem certeza absoluta?';
                actionDescription = 'TODOS os dados';
                break;
        }
        
        if (confirm(confirmMessage)) {
            try {
                await this.performReset(type);
                alert(`✅ ${actionDescription} foram resetados com sucesso!`);
                this.closeResetModal();
                
                // Recarregar dados se necessário
                if (type === 'services' || type === 'hours' || type === 'days' || type === 'everything') {
                    await this.loadDataFromFirebase();
                    this.displayAppointments();
                this.updateStatistics();
                } else {
                this.displayAppointments();
                    this.updateStatistics();
                }
                
            } catch (error) {
                console.error('Erro ao resetar dados:', error);
                alert('❌ Erro ao resetar dados. Tente novamente.');
            }
        }
    }
    
    async performReset(type) {
        switch(type) {
            case 'completed':
                // Deletar agendamentos concluídos
                const completedAppointments = this.appointments.filter(apt => apt.completed);
                for (const appointment of completedAppointments) {
                    await window.firestore.deleteDoc(window.firestore.doc(window.db, 'appointments', appointment.id));
                }
                break;
                
            case 'pending':
                // Deletar agendamentos pendentes
                const pendingAppointments = this.appointments.filter(apt => !apt.completed);
                for (const appointment of pendingAppointments) {
                    await window.firestore.deleteDoc(window.firestore.doc(window.db, 'appointments', appointment.id));
                }
                break;
                
            case 'allAppointments':
                // Deletar todos os agendamentos
                for (const appointment of this.appointments) {
                    await window.firestore.deleteDoc(window.firestore.doc(window.db, 'appointments', appointment.id));
                }
                break;
                
            case 'services':
                // Resetar serviços para padrão
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'services', 'default'),
                    { services: this.getDefaultServices() }
                );
                break;
                
            case 'hours':
                // Resetar horários para padrão
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'availableHours'),
                    { hours: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'] }
                );
                break;
                
            case 'days':
                // Resetar dias para padrão
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'availableDays'),
                    { 
                        days: {
                            'monday': true,
                            'tuesday': true,
                            'wednesday': true,
                            'thursday': true,
                            'friday': true,
                            'saturday': true,
                            'sunday': false
                        }
                    }
                );
                break;
                
            case 'everything':
                // Deletar tudo
                // Deletar todos os agendamentos
                for (const appointment of this.appointments) {
                    await window.firestore.deleteDoc(window.firestore.doc(window.db, 'appointments', appointment.id));
                }
                
                // Resetar serviços
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'services', 'default'),
                    { services: this.getDefaultServices() }
                );
                
                // Resetar horários
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'availableHours'),
                    { hours: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'] }
                );
                
                // Resetar dias
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'availableDays'),
                    { 
                        days: {
                            'monday': true,
                            'tuesday': true,
                            'wednesday': true,
                            'thursday': true,
                            'friday': true,
                            'saturday': true,
                            'sunday': false
                        }
                    }
                );
                break;
        }
    }
    
    getDefaultServices() {
        return [
            { id: 'default-1', name: 'Manicure Básica', icon: '💅', price: 35, duration: 45, description: 'Manicure tradicional com esmaltação' },
            { id: 'default-2', name: 'Manicure com Gel', icon: '✨', price: 65, duration: 60, description: 'Unha em gel com acabamento profissional e duradouro' },
            { id: 'default-3', name: 'Pedicure', icon: '🦶', price: 40, duration: 60, description: 'Cuidados completos para os pés com hidratação' },
            { id: 'default-4', name: 'Mão e Pé', icon: '💎', price: 70, duration: 90, description: 'Pacote completo com manicure e pedicure' },
            { id: 'default-5', name: 'Alongamento de Unhas', icon: '🎨', price: 120, duration: 120, description: 'Alongamento em gel ou fibra de vidro' },
            { id: 'default-6', name: 'Nail Art', icon: '🌸', price: 50, duration: 45, description: 'Decoração personalizada e criativa' }
        ];
    }
    
    // Função para garantir que os serviços sejam salvos corretamente no Firebase
    async ensureServicesInFirebase() {
        try {
            const servicesSnapshot = await window.firestore.getDocs(window.firestore.collection(window.db, 'services'));
            
            if (servicesSnapshot.empty) {
                // Se não há serviços, criar os padrão
                console.log('Criando serviços padrão no Firebase...');
                const defaultServices = this.getDefaultServices();
                
                for (const service of defaultServices) {
                    // Criar serviço no Firebase com ID único
                    const docRef = await window.firestore.addDoc(
                        window.firestore.collection(window.db, 'services'),
                        {
                            name: service.name,
                            icon: service.icon,
                            description: service.description,
                            price: service.price,
                            duration: service.duration
                        }
                    );
                    
                    // Atualizar o ID local para o ID do Firebase
                    service.id = docRef.id;
                    console.log(`Serviço "${service.name}" criado com ID: ${docRef.id}`);
                }
                
                // Atualizar a lista local com os novos IDs
                this.services = defaultServices;
                console.log('Serviços padrão criados com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao garantir serviços no Firebase:', error);
        }
    }
    
    // Função para migrar serviços com IDs padrão para IDs únicos do Firebase
    async migrateDefaultServices() {
        try {
            const servicesToMigrate = this.services.filter(service => 
                service.id && service.id.startsWith('default-')
            );
            
            if (servicesToMigrate.length > 0) {
                console.log(`Migrando ${servicesToMigrate.length} serviços com IDs padrão...`);
                
                for (const service of servicesToMigrate) {
                    // Criar novo documento no Firebase
                    const docRef = await window.firestore.addDoc(
                        window.firestore.collection(window.db, 'services'),
                        {
                            name: service.name,
                            icon: service.icon,
                            description: service.description,
                            price: service.price,
                            duration: service.duration
                        }
                    );
                    
                    // Atualizar o ID local
                    const serviceIndex = this.services.findIndex(s => s.id === service.id);
                    if (serviceIndex !== -1) {
                        this.services[serviceIndex].id = docRef.id;
                        console.log(`Serviço "${service.name}" migrado para ID: ${docRef.id}`);
                    }
                }
                
                console.log('Migração de serviços concluída!');
            }
        } catch (error) {
            console.error('Erro ao migrar serviços:', error);
        }
    }
    
    // Funções do modal de adicionar agendamento
    showAddAppointmentModal() {
        const modal = document.getElementById('addAppointmentModal');
        modal.style.display = 'block';
        
        // Limpar formulário
        document.getElementById('addAppointmentForm').reset();
        
        // Configurar data mínima para hoje
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('addAppointmentDate').value = today;
        document.getElementById('addAppointmentDate').min = today;
        
        // Renderizar serviços
        this.renderAddServicesCheckboxes();
        
        // Configurar event listeners
        this.setupAddAppointmentListeners();
        
        // Configurar validação de dias da semana
        this.setupAdminAvailableDays();
        
        // Abrir calendário automaticamente
        document.getElementById('addAppointmentDate').addEventListener('click', function() {
            this.showPicker();
        });
    }
    
    closeAddAppointmentModal() {
        document.getElementById('addAppointmentModal').style.display = 'none';
    }
    
    // Configurar validação de dias da semana no painel admin
    setupAdminAvailableDays() {
        const dateInput = document.getElementById('addAppointmentDate');
        if (!dateInput) return;
        
        dateInput.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                const dayOfWeek = this.getDayOfWeek(selectedDate);
                
                if (!this.availableDays[dayOfWeek]) {
                    alert(`⚠️ A manicure não atende aos ${this.getDayName(dayOfWeek)}s.\n\nPor favor, escolha outro dia da semana.`);
                    e.target.value = '';
                }
            }
        });
    }
    
    // Obter dia da semana de uma data
    getDayOfWeek(dateString) {
        // Garantir que a data seja interpretada corretamente (formato YYYY-MM-DD)
        const [year, month, day] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[date.getDay()];
    }
    
    // Obter nome do dia em português
    getDayName(dayOfWeek) {
        const dayNames = {
            'monday': 'Segunda-feira',
            'tuesday': 'Terça-feira',
            'wednesday': 'Quarta-feira',
            'thursday': 'Quinta-feira',
            'friday': 'Sexta-feira',
            'saturday': 'Sábado',
            'sunday': 'Domingo'
        };
        return dayNames[dayOfWeek] || dayOfWeek;
    }
    
    renderAddServicesCheckboxes() {
        const container = document.getElementById('addServicesContainer');
        if (!container) return;
        
        container.innerHTML = this.services.map(service => `
            <div class="add-service-card" style="background: linear-gradient(135deg, #1A1A1A, #2A2A2A); border: 2px solid #444; border-radius: 12px; padding: 1rem; transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); opacity: 0; transition: opacity 0.3s ease; z-index: 0;"></div>
                
                <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; position: relative; z-index: 1; color: var(--white);">
                    <div style="position: relative;">
                        <input type="checkbox" class="add-service-checkbox" value="${service.name}" 
                               data-price="${service.price}" data-duration="${service.duration}" 
                               style="width: 20px; height: 20px; margin: 0; accent-color: var(--primary-color);">
                        <div class="checkmark-overlay" style="position: absolute; top: 0; left: 0; width: 20px; height: 20px; border: 2px solid var(--primary-color); border-radius: 4px; background: transparent; transition: all 0.3s ease; pointer-events: none;"></div>
                    </div>
                    
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                            <span style="font-size: 1.5rem;">${service.icon}</span>
                            <h4 style="margin: 0; color: var(--white); font-size: 1.1rem; font-weight: 600;">${service.name}</h4>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: 1rem;">
                                <span style="color: var(--primary-color); font-weight: 700; font-size: 1.1rem;">R$ ${service.price.toFixed(2)}</span>
                                <span style="color: #ccc; font-size: 0.9rem;">⏱️ ${service.duration} min</span>
                            </div>
                        </div>
                        
                        <p style="margin: 0.5rem 0 0 0; color: #ccc; font-size: 0.85rem; line-height: 1.3;">${service.description}</p>
                    </div>
                </label>
            </div>
        `).join('');
        
        // Adicionar efeitos de hover e seleção
        container.querySelectorAll('.add-service-card').forEach(card => {
            const checkbox = card.querySelector('.add-service-checkbox');
            const overlay = card.querySelector('.checkmark-overlay');
            const backgroundOverlay = card.querySelector('div[style*="opacity: 0"]');
            
            card.addEventListener('mouseenter', () => {
                if (!checkbox.checked) {
                    backgroundOverlay.style.opacity = '0.05';
                    card.style.borderColor = 'var(--primary-color)';
                    card.style.transform = 'translateY(-2px)';
                    card.style.boxShadow = '0 5px 15px rgba(255, 220, 0, 0.2)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                if (!checkbox.checked) {
                    backgroundOverlay.style.opacity = '0';
                    card.style.borderColor = '#444';
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = 'none';
                }
            });
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    backgroundOverlay.style.opacity = '0.1';
                    overlay.style.background = 'var(--primary-color)';
                    overlay.style.borderColor = 'var(--primary-color)';
                    card.style.borderColor = 'var(--primary-color)';
                    card.style.boxShadow = '0 5px 15px rgba(255, 220, 0, 0.3)';
                    
                    // Adicionar checkmark
                    overlay.innerHTML = '<span style="color: white; font-size: 12px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">✓</span>';
                } else {
                    backgroundOverlay.style.opacity = '0';
                    overlay.style.background = 'transparent';
                    overlay.style.borderColor = '#444';
                    card.style.borderColor = '#444';
                    card.style.boxShadow = 'none';
                    overlay.innerHTML = '';
                }
            });
        });
    }
    
    setupAddAppointmentListeners() {
        // Event listener para mudança de data
        document.getElementById('addAppointmentDate').addEventListener('change', (e) => {
            this.updateAvailableHoursInModal(e.target.value);
        });
        
        // Event listeners para checkboxes de serviços
        document.querySelectorAll('.add-service-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAddServiceSummary();
            });
        });
        
        // Event listener para o formulário
        document.getElementById('addAppointmentForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAppointment();
        });
        
        // Formatação de telefone
        document.getElementById('addClientPhone').addEventListener('input', (e) => {
            this.formatPhone(e);
        });
    }
    
    updateAvailableHoursInModal(selectedDate) {
        const timeSelect = document.getElementById('addAppointmentTime');
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        
        this.availableHours.forEach(hour => {
                const option = document.createElement('option');
                option.value = hour;
                option.textContent = hour;
            
            // Se for hoje, filtrar horários passados
            if (selectedDate === today) {
                const [hours, minutes] = hour.split(':').map(Number);
                const timeInMinutes = hours * 60 + minutes;
                if (timeInMinutes <= currentTime) {
            option.disabled = true;
                    option.textContent += ' (Horário já passou)';
                }
            }
            
            timeSelect.appendChild(option);
        });
    }
    
    updateAddServiceSummary() {
        const summaryContainer = document.getElementById('addServiceSummary');
        const checkboxes = document.querySelectorAll('.add-service-checkbox:checked');

        if (checkboxes.length === 0) {
            summaryContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem;">📊</span>
                    <h4 style="color: var(--primary-color); margin: 0; font-size: 1.2rem;">Resumo do Agendamento</h4>
                </div>
                <p style="color: #ccc; text-align: center; margin: 0; font-style: italic;">Nenhum serviço selecionado</p>
            `;
            return;
        }

        let totalPrice = 0;
        let totalDuration = 0;
        const selectedServices = [];
        
        checkboxes.forEach(checkbox => {
            const serviceName = checkbox.value;
            const price = parseFloat(checkbox.dataset.price);
            const duration = parseInt(checkbox.dataset.duration);
            
            selectedServices.push(serviceName);
            totalPrice += price;
            totalDuration += duration;
        });
        
        // Calcular horas e minutos
        const hours = Math.floor(totalDuration / 60);
        const minutes = totalDuration % 60;
        const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
        
        summaryContainer.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                <span style="font-size: 1.5rem;">📊</span>
                <h4 style="color: var(--primary-color); margin: 0; font-size: 1.2rem;">Resumo do Agendamento</h4>
            </div>
            
            <div style="display: grid; gap: 1rem;">
                <div style="background: rgba(255, 220, 0, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 220, 0, 0.2);">
                    <h5 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1rem;">💅 Serviços Selecionados:</h5>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${selectedServices.map(service => `
                            <span style="background: var(--primary-color); color: var(--dark-bg); padding: 0.3rem 0.8rem; border-radius: 15px; font-size: 0.85rem; font-weight: 600;">
                                ${service}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background: rgba(255, 220, 0, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 220, 0, 0.2); text-align: center;">
                        <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 0.5rem;">💰 Preço Total</div>
                        <div style="color: var(--primary-color); font-size: 1.5rem; font-weight: 700;">R$ ${totalPrice.toFixed(2)}</div>
                    </div>
                    
                    <div style="background: rgba(255, 220, 0, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 220, 0, 0.2); text-align: center;">
                        <div style="color: #ccc; font-size: 0.9rem; margin-bottom: 0.5rem;">⏱️ Duração Total</div>
                        <div style="color: var(--primary-color); font-size: 1.5rem; font-weight: 700;">${durationText}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async addAppointment() {
        const name = document.getElementById('addClientName').value;
        const phone = document.getElementById('addClientPhone').value;
        const email = document.getElementById('addClientEmail').value;
        const date = document.getElementById('addAppointmentDate').value;
        const time = document.getElementById('addAppointmentTime').value;
        
        const selectedServices = Array.from(document.querySelectorAll('.add-service-checkbox:checked'))
            .map(checkbox => ({
                name: checkbox.value,
                price: parseFloat(checkbox.dataset.price),
                duration: parseInt(checkbox.dataset.duration)
            }));
        
        if (!name || !phone || !date || !time || selectedServices.length === 0) {
            alert('❌ Por favor, preencha todos os campos obrigatórios e selecione pelo menos um serviço.');
            return;
        }

        try {
            // Calcular preço e duração totais
            const totalPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
            const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
            
            const appointmentData = {
                name: name,
                clientName: name,
                phone: phone,
                email: email || '',
                date: date,
                time: time,
            services: selectedServices,
                service: selectedServices.map(s => s.name).join(', '),
                totalPrice: totalPrice,
            price: totalPrice,
                totalDuration: totalDuration,
            duration: totalDuration,
            completed: false,
                createdAt: new Date().toISOString()
            };
            
            // Salvar no Firebase
            await window.firestore.addDoc(window.firestore.collection(window.db, 'appointments'), appointmentData);
            
            alert('✅ Agendamento adicionado com sucesso!');
        this.closeAddAppointmentModal();
        
        } catch (error) {
            console.error('Erro ao adicionar agendamento:', error);
            alert('❌ Erro ao adicionar agendamento. Tente novamente.');
        }
    }
    
    // Mostrar aba de configurações
    showSettingsTab(tab) {
        // Esconder todas as abas
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remover classe ativa de todos os botões
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar aba selecionada
        const selectedTab = document.getElementById(`${tab}Tab`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        const selectedButton = document.querySelector(`[data-tab="${tab}"]`);
        if (selectedButton) {
            selectedButton.classList.add('active');
        }
        
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
        if (!container) {
            console.error('Container servicesList não encontrado');
            return;
        }
        
        
        container.innerHTML = this.services.map(service => `
            <div class="service-item">
                <div class="service-info">
                    <div class="service-icon">${service.icon}</div>
                    <div class="service-details">
                        <h4>${service.name}</h4>
                        <p>${service.description}</p>
                        <div style="display: flex; gap: 1rem; align-items: center;">
                            <span class="service-price">R$ ${service.price.toFixed(2)}</span>
                            <span style="color: #ccc; font-size: 0.9rem;">⏱️ ${service.duration} min</span>
                        </div>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="service-btn service-btn-edit" onclick="editService('${service.id}')">
                        <span>✏️</span>
                        Editar
                    </button>
                    <button class="service-btn service-btn-delete" onclick="deleteService('${service.id}')">
                        <span>🗑️</span>
                        Excluir
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Renderizar horários
    renderHours() {
        const container = document.getElementById('hoursList');
        if (!container) return;
        
        if (this.availableHours.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #ccc; font-style: italic;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⏰</div>
                    <p style="font-size: 1.2rem; margin: 0;">Nenhum horário disponível</p>
                    <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Adicione horários usando o formulário abaixo</p>
                </div>
            `;
            return;
        }
        
        // Organizar horários em grupos (manhã, tarde, noite)
        const morningHours = this.availableHours.filter(hour => {
            const hourNum = parseInt(hour.split(':')[0]);
            return hourNum >= 6 && hourNum < 12;
        });
        
        const afternoonHours = this.availableHours.filter(hour => {
            const hourNum = parseInt(hour.split(':')[0]);
            return hourNum >= 12 && hourNum < 18;
        });
        
        const eveningHours = this.availableHours.filter(hour => {
            const hourNum = parseInt(hour.split(':')[0]);
            return hourNum >= 18 && hourNum < 24;
        });
        
        container.innerHTML = `
            <div style="display: grid; gap: 2rem;">
                ${morningHours.length > 0 ? `
                    <div class="hour-group">
                        <h4 style="color: var(--primary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.3rem;">
                            <span>🌅</span>
                            <span>Manhã</span>
                        </h4>
                        <div class="hours-grid">
                            ${morningHours.map(hour => `
                                <div class="hour-card">
                                    <div class="hour-time">
                                        <span class="hour-icon">🕒</span>
                                        <span class="hour-text">${hour}</span>
                                    </div>
                                    <button class="hour-delete-btn" onclick="deleteHour('${hour}')" title="Excluir horário">
                                        <span>🗑️</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${afternoonHours.length > 0 ? `
                    <div class="hour-group">
                        <h4 style="color: var(--primary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.3rem;">
                            <span>☀️</span>
                            <span>Tarde</span>
                        </h4>
                        <div class="hours-grid">
                            ${afternoonHours.map(hour => `
                                <div class="hour-card">
                                    <div class="hour-time">
                                        <span class="hour-icon">🕒</span>
                                        <span class="hour-text">${hour}</span>
                                    </div>
                                    <button class="hour-delete-btn" onclick="deleteHour('${hour}')" title="Excluir horário">
                                        <span>🗑️</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${eveningHours.length > 0 ? `
                    <div class="hour-group">
                        <h4 style="color: var(--primary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.3rem;">
                            <span>🌙</span>
                            <span>Noite</span>
                        </h4>
                        <div class="hours-grid">
                            ${eveningHours.map(hour => `
                                <div class="hour-card">
                                    <div class="hour-time">
                                        <span class="hour-icon">🕒</span>
                                        <span class="hour-text">${hour}</span>
                                    </div>
                                    <button class="hour-delete-btn" onclick="deleteHour('${hour}')" title="Excluir horário">
                                        <span>🗑️</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Função para adicionar novo horário
    async addNewHour() {
        const newHourInput = document.getElementById('newHour');
        const newHour = newHourInput.value;
        
        if (!newHour) {
            alert('❌ Por favor, selecione um horário para adicionar.');
            return;
        }
        
        // Verificar se o horário já existe
        if (this.availableHours.includes(newHour)) {
            alert('⚠️ Este horário já está disponível!');
            return;
        }
        
        try {
            // Adicionar ao Firebase
            const hoursRef = window.firestore.doc(window.db, 'settings', 'availableHours');
            const updatedHours = [...this.availableHours, newHour].sort();
            await window.firestore.setDoc(hoursRef, { hours: updatedHours });
            
            // Atualizar localmente
            this.availableHours = updatedHours;
            
            // Limpar o campo de input
            newHourInput.value = '';
            
            // Re-renderizar os horários
            this.renderHours();
            
            alert('✅ Horário adicionado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao adicionar horário:', error);
            alert('❌ Erro ao adicionar horário. Tente novamente.');
        }
    }
    
    // Função para deletar horário
    async deleteHour(hour) {
        const confirmMessage = `Tem certeza que deseja excluir o horário "${hour}"?\n\n⚠️ Esta ação não pode ser desfeita!`;
        
        if (confirm(confirmMessage)) {
            try {
                // Remover do Firebase
                const hoursRef = window.firestore.doc(window.db, 'settings', 'availableHours');
                const updatedHours = this.availableHours.filter(h => h !== hour);
                await window.firestore.setDoc(hoursRef, { hours: updatedHours });
                
                // Remover localmente
                this.availableHours = this.availableHours.filter(h => h !== hour);
                
                // Re-renderizar os horários
                this.renderHours();
                
                alert('✅ Horário excluído com sucesso!');
                
            } catch (error) {
                console.error('Erro ao excluir horário:', error);
                alert('❌ Erro ao excluir horário. Tente novamente.');
            }
        }
    }
    
    // Funções para gerenciar serviços
    editService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;
        
        // Criar modal de edição temporário
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2 style="color: var(--primary-color); text-align: center; margin-bottom: 2rem;">✏️ Editar Serviço</h2>
                <form id="editServiceForm">
                    <div class="form-group">
                        <label for="editServiceName" style="color: var(--white);">Nome do Serviço</label>
                        <input type="text" id="editServiceName" value="${service.name}" required style="width: 100%; padding: 12px 16px; border: 2px solid #444; border-radius: 10px; background: #1A1A1A; color: var(--white); font-size: 1rem; box-sizing: border-box;">
            </div>
                    <div class="form-group">
                        <label for="editServiceIcon" style="color: var(--white);">Ícone (emoji)</label>
                        <input type="text" id="editServiceIcon" value="${service.icon}" required maxlength="2" style="width: 100%; padding: 12px 16px; border: 2px solid #444; border-radius: 10px; background: #1A1A1A; color: var(--white); font-size: 1rem; box-sizing: border-box;">
                    </div>
                    <div class="form-group">
                        <label for="editServiceDescription" style="color: var(--white);">Descrição</label>
                        <textarea id="editServiceDescription" required style="width: 100%; padding: 12px 16px; border: 2px solid #444; border-radius: 10px; background: #1A1A1A; color: var(--white); font-size: 1rem; min-height: 80px; resize: vertical; box-sizing: border-box;">${service.description}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label for="editServicePrice" style="color: var(--white);">Preço (R$)</label>
                            <input type="number" id="editServicePrice" value="${service.price}" required min="0" step="0.01" style="width: 100%; padding: 12px 16px; border: 2px solid #444; border-radius: 10px; background: #1A1A1A; color: var(--white); font-size: 1rem; box-sizing: border-box;">
                        </div>
                        <div class="form-group">
                            <label for="editServiceDuration" style="color: var(--white);">Duração (minutos)</label>
                            <input type="number" id="editServiceDuration" value="${service.duration}" required min="15" step="15" style="width: 100%; padding: 12px 16px; border: 2px solid #444; border-radius: 10px; background: #1A1A1A; color: var(--white); font-size: 1rem; box-sizing: border-box;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                        <button type="button" class="btn btn-primary" onclick="saveEditedService('${serviceId}', this.parentElement.parentElement)" style="background: var(--primary-color); color: var(--dark-bg); border: 2px solid var(--primary-color); padding: 12px 24px; border-radius: 10px; font-weight: 600;">💾 Salvar</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="background: #666; color: var(--white); border: 2px solid #666; padding: 12px 24px; border-radius: 10px; font-weight: 600;">❌ Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async saveEditedService(serviceId, modal) {
        // Validar campos obrigatórios
        const name = document.getElementById('editServiceName').value.trim();
        const icon = document.getElementById('editServiceIcon').value.trim();
        const description = document.getElementById('editServiceDescription').value.trim();
        const price = parseFloat(document.getElementById('editServicePrice').value);
        const duration = parseInt(document.getElementById('editServiceDuration').value);
        
        if (!name || !icon || !description || isNaN(price) || isNaN(duration)) {
            alert('❌ Por favor, preencha todos os campos corretamente.');
            return;
        }
        
        if (price < 0 || duration < 15) {
            alert('❌ Preço deve ser maior que 0 e duração deve ser pelo menos 15 minutos.');
            return;
        }
        
        const serviceData = {
            name: name,
            icon: icon,
            description: description,
            price: price,
            duration: duration
        };
        
        try {
            console.log('Atualizando serviço:', serviceId, serviceData);
            
            // Verificar se o serviço existe no Firebase
            const serviceDoc = window.firestore.doc(window.db, 'services', serviceId);
            const serviceSnapshot = await window.firestore.getDoc(serviceDoc);
            
            if (serviceSnapshot.exists()) {
                // Serviço existe, atualizar
                await window.firestore.updateDoc(serviceDoc, serviceData);
                console.log('Serviço atualizado no Firebase');
            } else {
                // Serviço não existe, criar novo
                console.log('Serviço não existe, criando novo documento...');
                const newDocRef = await window.firestore.addDoc(
                    window.firestore.collection(window.db, 'services'),
                    serviceData
                );
                console.log('Novo serviço criado com ID:', newDocRef.id);
                
                // Atualizar o ID local para o novo ID do Firebase
                serviceData.id = newDocRef.id;
            }
            
            // Atualizar localmente
            const serviceIndex = this.services.findIndex(s => s.id === serviceId);
            if (serviceIndex !== -1) {
                this.services[serviceIndex] = { ...this.services[serviceIndex], ...serviceData };
            } else {
                console.warn('Serviço não encontrado localmente:', serviceId);
            }
            
            // Re-renderizar os serviços
            this.renderServices();
            
            alert('✅ Serviço atualizado com sucesso!');
            modal.closest('.modal').remove();
            
        } catch (error) {
            console.error('Erro ao atualizar serviço:', error);
            console.error('Detalhes do erro:', error.message);
            alert(`❌ Erro ao atualizar serviço: ${error.message}`);
        }
    }
    
    async deleteService(serviceId) {
        const service = this.services.find(s => s.id === serviceId);
        if (!service) return;
        
        const confirmMessage = `Tem certeza que deseja excluir o serviço "${service.name}"?\n\n⚠️ Esta ação não pode ser desfeita!`;
        
        if (confirm(confirmMessage)) {
            try {
                // Deletar do Firebase
                await window.firestore.deleteDoc(window.firestore.doc(window.db, 'services', serviceId));
                
                // Remover localmente
                this.services = this.services.filter(s => s.id !== serviceId);
                
                // Re-renderizar os serviços
                this.renderServices();
                
                alert('✅ Serviço excluído com sucesso!');
                
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                alert('❌ Erro ao excluir serviço. Tente novamente.');
            }
        }
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
}

// Inicializar gerenciador admin
const adminManager = new FirebaseAdminManager();

// Funções globais para garantir que funcionem
window.editService = function(serviceId) {
    return adminManager.editService(serviceId);
};

window.deleteService = function(serviceId) {
    return adminManager.deleteService(serviceId);
};

window.saveEditedService = function(serviceId, modal) {
    return adminManager.saveEditedService(serviceId, modal);
};

window.deleteHour = function(hour) {
    return adminManager.deleteHour(hour);
};

window.addNewHour = function() {
    return adminManager.addNewHour();
};
