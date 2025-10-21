// Sistema Administrativo com Firebase
class FirebaseAdminManager {
    constructor() {
        this.appointments = [];
        this.services = [];
        // Horários para dias da semana (segunda a sexta)
        this.weekdayHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        
        // Horários para sábados
        this.saturdayHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
        
        // Manter compatibilidade com código existente
        this.availableHours = this.weekdayHours;
        
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
        console.log('Inicializando sistema administrativo...');
        // Aguardar Firebase carregar
        await this.waitForFirebase();
        console.log('Firebase carregado');
        
        if (this.isLoggedIn) {
            console.log('Usuário já logado, carregando dashboard...');
            await this.loadDataFromFirebase();
            this.setupRealtimeListeners();
            this.showDashboard();
        } else {
            console.log('Usuário não logado, mostrando tela de login...');
            this.showLogin();
        }
        
        console.log('Configurando event listeners...');
        this.setupEventListeners();
        console.log('Sistema administrativo inicializado');
    }
    
    async waitForFirebase() {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 100; // 10 segundos máximo
            
            const checkFirebase = () => {
                attempts++;
                console.log(`Tentativa ${attempts} de carregar Firebase...`);
                
                if (window.db && window.firestore) {
                    console.log('Firebase carregado com sucesso!');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('Timeout ao carregar Firebase');
                    resolve(); // Continuar mesmo sem Firebase
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
                    
                    // Limpar serviços duplicados
                    await this.cleanupDuplicateServices();
                }
            }
            
            // Carregar horários para dias da semana
            const weekdayDoc = await window.firestore.doc(window.db, 'settings', 'weekdayHours').get();
            if (weekdayDoc.exists) {
                this.weekdayHours = weekdayDoc.data().hours;
            }
            
            // Carregar horários para sábados
            const saturdayDoc = await window.firestore.doc(window.db, 'settings', 'saturdayHours').get();
            if (saturdayDoc.exists) {
                this.saturdayHours = saturdayDoc.data().hours;
            }
            
            // Manter compatibilidade com código existente
            this.availableHours = this.weekdayHours;
            
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
        
        // Listener para serviços em tempo real
        const servicesQuery = window.firestore.collection(window.db, 'services');
        
        window.firestore.onSnapshot(servicesQuery, (querySnapshot) => {
            this.services = [];
            querySnapshot.forEach((doc) => {
                this.services.push({ id: doc.id, ...doc.data() });
            });
            
            // Re-renderizar serviços se estiver na aba de serviços
            const servicesTab = document.getElementById('servicesTab');
            if (servicesTab && servicesTab.classList.contains('active')) {
                this.renderServices();
            }
        });
    }
    
    setupEventListeners() {
        // Login
        const loginForm = document.getElementById('loginForm');
        console.log('Login form encontrado:', loginForm);
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('Formulário de login submetido');
                this.login();
            });
            
            // Adicionar listener adicional no botão para garantir que funcione
            const submitButton = loginForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Botão de login clicado');
                    this.login();
                });
            }
        } else {
            console.error('Formulário de login não encontrado!');
        }
        
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
        console.log('Função login chamada');
        const password = document.getElementById('password').value;
        console.log('Senha digitada:', password);
        
        if (password === 'admin123') {
            console.log('Senha correta, fazendo login...');
            this.isLoggedIn = true;
            sessionStorage.setItem('adminLoggedIn', 'true');
            this.showDashboard();
            
            // Carregar dados do Firebase de forma assíncrona
            this.loadDataFromFirebase().then(() => {
                this.setupRealtimeListeners();
            }).catch(error => {
                console.error('Erro ao carregar dados do Firebase:', error);
                // Continuar mesmo com erro no Firebase
            });
        } else {
            console.log('Senha incorreta');
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
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Nenhum agendamento encontrado.</p>';
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
        console.log('Tentando abrir modal de configurações...');
        console.log('DOM completo?', document.readyState);
        console.log('Body carregado?', document.body);
        
        // Função para tentar abrir o modal
        const tryOpenModal = () => {
            // Tentar diferentes formas de encontrar o modal
            let modal = document.getElementById('settingsModal');
            
            if (!modal) {
                // Tentar por classe
                modal = document.querySelector('.modal[id="settingsModal"]');
            }
            
            if (!modal) {
                // Tentar por seletor mais amplo
                modal = document.querySelector('[id*="settings"]');
            }
            
            console.log('Modal encontrado:', modal);
            console.log('Todos os elementos com ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            console.log('Todos os modais:', Array.from(document.querySelectorAll('.modal')).map(el => el.id || 'sem-id'));
            
            if (modal) {
                modal.style.display = 'block';
                this.showSettingsTab('services');
                console.log('Modal aberto com sucesso!');
            } else {
                console.error('Modal de configurações não encontrado!');
                console.log('Criando modal dinamicamente...');
                this.createSettingsModal();
            }
        };
        
        // Aguardar um pouco mais para garantir que tudo está carregado
        setTimeout(tryOpenModal, 500);
    }
    
    // Criar modal de configurações dinamicamente
    createSettingsModal() {
        console.log('Criando modal de configurações dinamicamente...');
        
        const modal = document.createElement('div');
        modal.id = 'settingsModal';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1400px; max-height: 88vh; overflow-y: auto; padding: 3rem;">
                <span class="close" onclick="window.adminManager.closeSettingsModal()">&times;</span>
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 3.5rem; margin-bottom: 0.5rem;">⚙️</div>
                    <h2 style="color: var(--primary-color); margin-bottom: 0.5rem; font-size: 2.5rem;">Configurações do Sistema</h2>
                    <p style="color: var(--text-light); font-size: 1.1rem; margin-top: 0.5rem;">Gerencie serviços, horários e dias de funcionamento</p>
                </div>

                <div class="settings-tabs" style="margin-bottom: 2rem;">
                    <button class="settings-tab" onclick="window.adminManager.showSettingsTab('services')" data-tab="services">
                        <span style="font-size: 1.8rem; margin-right: 0.8rem;">💅</span>
                        <span style="font-size: 1.1rem; font-weight: 600;">Serviços Disponíveis</span>
                    </button>
                    <button class="settings-tab" onclick="window.adminManager.showSettingsTab('hours')" data-tab="hours">
                        <span style="font-size: 1.8rem; margin-right: 0.8rem;">🕒</span>
                        <span style="font-size: 1.1rem; font-weight: 600;">Horários Disponíveis</span>
                    </button>
                    <button class="settings-tab" onclick="window.adminManager.showSettingsTab('days')" data-tab="days">
                        <span style="font-size: 1.8rem; margin-right: 0.8rem;">📅</span>
                        <span style="font-size: 1.1rem; font-weight: 600;">Dias de Funcionamento</span>
                    </button>
                </div>

                <!-- Services Tab -->
                <div id="servicesTab" class="settings-tab-content">
                    <h3 style="color: var(--primary-color); margin-bottom: 2.5rem; text-align: center; font-size: 2.2rem;">
                        <span style="font-size: 2.5rem;">💅</span>
                        <span>Serviços Disponíveis</span>
                    </h3>
                    <div id="servicesList">
                        <!-- Serviços serão carregados dinamicamente -->
                    </div>
                </div>

                <!-- Hours Tab -->
                <div id="hoursTab" class="settings-tab-content">
                    <h3 style="color: var(--primary-color); margin-bottom: 2.5rem; text-align: center; font-size: 2.2rem;">
                        <span style="font-size: 2.5rem;">🕒</span>
                        <span>Horários Disponíveis</span>
                    </h3>
                    <div id="hoursList">
                        <!-- Horários serão carregados dinamicamente -->
                    </div>
                </div>

                <!-- Days Tab -->
                <div id="daysTab" class="settings-tab-content">
                    <h3 style="color: var(--primary-color); margin-bottom: 2.5rem; text-align: center; font-size: 2.2rem;">
                        <span style="font-size: 2.5rem;">📅</span>
                        <span>Dias de Funcionamento</span>
                    </h3>
                    <div id="daysList">
                        <!-- Dias serão carregados dinamicamente -->
                    </div>
                </div>

                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid #444; text-align: center;">
                    <button onclick="window.adminManager.closeSettingsModal()" class="btn btn-primary" style="min-width: 150px; background: var(--primary-color); color: var(--dark-bg); border: 2px solid var(--primary-color);">Fechar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('Modal criado e adicionado ao DOM');
        
        // Mostrar a aba de serviços
        this.showSettingsTab('services');
    }
    
    // Fechar modal de configurações
    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Modal de configurações não encontrado para fechar!');
        }
    }
    
    // Funções do modal de reset
    showResetModal() {
        const modal = document.getElementById('resetModal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('Modal de reset não encontrado!');
        }
    }
    
    closeResetModal() {
        const modal = document.getElementById('resetModal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Modal de reset não encontrado para fechar!');
        }
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
                const defaultWeekdayHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
                const defaultSaturdayHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
                
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'weekdayHours'),
                    { hours: defaultWeekdayHours }
                );
                
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'saturdayHours'),
                    { hours: defaultSaturdayHours }
                );
                
                // Atualizar localmente
                this.weekdayHours = defaultWeekdayHours;
                this.saturdayHours = defaultSaturdayHours;
                this.availableHours = this.weekdayHours;
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
                
                // Resetar horários (reutilizar as variáveis já declaradas)
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'weekdayHours'),
                    { hours: defaultWeekdayHours }
                );
                
                await window.firestore.setDoc(
                    window.firestore.doc(window.db, 'settings', 'saturdayHours'),
                    { hours: defaultSaturdayHours }
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
                    // Verificar se já existe um serviço com o mesmo nome
                    const existingServices = await window.firestore.getDocs(
                        window.firestore.collection(window.db, 'services')
                    );
                    
                    let serviceExists = false;
                    existingServices.forEach((doc) => {
                        const data = doc.data();
                        if (data.name === service.name) {
                            serviceExists = true;
                            service.id = doc.id;
                            console.log(`Serviço "${service.name}" já existe com ID: ${doc.id}`);
                        }
                    });
                    
                    if (!serviceExists) {
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
                }
                
                // Atualizar a lista local com os novos IDs
                this.services = defaultServices;
                console.log('Serviços padrão processados com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao garantir serviços no Firebase:', error);
        }
    }
    
    // Função para limpar serviços duplicados no Firebase
    async cleanupDuplicateServices() {
        try {
            console.log('Verificando serviços duplicados...');
            const servicesSnapshot = await window.firestore.getDocs(
                window.firestore.collection(window.db, 'services')
            );
            
            const servicesByName = {};
            const duplicatesToDelete = [];
            
            servicesSnapshot.forEach((doc) => {
                const data = doc.data();
                const serviceName = data.name;
                
                if (servicesByName[serviceName]) {
                    // Serviço duplicado encontrado
                    duplicatesToDelete.push(doc.id);
                    console.log(`Serviço duplicado encontrado: "${serviceName}" (ID: ${doc.id})`);
                } else {
                    servicesByName[serviceName] = doc.id;
                }
            });
            
            // Deletar serviços duplicados
            for (const duplicateId of duplicatesToDelete) {
                await window.firestore.deleteDoc(
                    window.firestore.doc(window.db, 'services', duplicateId)
                );
                console.log(`Serviço duplicado removido: ${duplicateId}`);
            }
            
            if (duplicatesToDelete.length > 0) {
                console.log(`${duplicatesToDelete.length} serviços duplicados removidos`);
                // Recarregar serviços após limpeza
                await this.loadDataFromFirebase();
            } else {
                console.log('Nenhum serviço duplicado encontrado');
            }
            
        } catch (error) {
            console.error('Erro ao limpar serviços duplicados:', error);
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
                    // Verificar se já existe um serviço com o mesmo nome no Firebase
                    const existingServices = await window.firestore.getDocs(
                        window.firestore.collection(window.db, 'services')
                    );
                    
                    let serviceExists = false;
                    existingServices.forEach((doc) => {
                        const data = doc.data();
                        if (data.name === service.name) {
                            serviceExists = true;
                            // Atualizar o ID local para o ID existente
                            const serviceIndex = this.services.findIndex(s => s.id === service.id);
                            if (serviceIndex !== -1) {
                                this.services[serviceIndex].id = doc.id;
                                console.log(`Serviço "${service.name}" já existe, usando ID: ${doc.id}`);
                            }
                        }
                    });
                    
                    if (!serviceExists) {
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
        const modal = document.getElementById('addAppointmentModal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Modal de adicionar agendamento não encontrado para fechar!');
        }
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
            <div class="add-service-card" style="background: var(--white); border: 2px solid #E0E0E0; border-radius: 12px; padding: 1rem; transition: all 0.3s ease; cursor: pointer; position: relative; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, var(--primary-color), var(--primary-light)); opacity: 0; transition: opacity 0.3s ease; z-index: 0;"></div>
                
                <label style="display: flex; align-items: center; gap: 1rem; cursor: pointer; position: relative; z-index: 1; color: var(--text-dark);">
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
                                <span style="color: var(--text-light); font-size: 0.9rem;">⏱️ ${service.duration} min</span>
                            </div>
                        </div>
                        
                        <p style="margin: 0.5rem 0 0 0; color: var(--text-light); font-size: 0.85rem; line-height: 1.3;">${service.description}</p>
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
                <p style="color: var(--text-light); text-align: center; margin: 0; font-style: italic;">Nenhum serviço selecionado</p>
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
                        <div style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 0.5rem;">💰 Preço Total</div>
                        <div style="color: var(--primary-color); font-size: 1.5rem; font-weight: 700;">R$ ${totalPrice.toFixed(2)}</div>
                    </div>
                    
                    <div style="background: rgba(255, 220, 0, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(255, 220, 0, 0.2); text-align: center;">
                        <div style="color: var(--text-light); font-size: 0.9rem; margin-bottom: 0.5rem;">⏱️ Duração Total</div>
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
                            <span style="color: var(--text-light); font-size: 0.9rem;">⏱️ ${service.duration} min</span>
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
        
        // Verificar se há horários configurados
        const hasWeekdayHours = this.weekdayHours && this.weekdayHours.length > 0;
        const hasSaturdayHours = this.saturdayHours && this.saturdayHours.length > 0;
        
        if (!hasWeekdayHours && !hasSaturdayHours) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-light); font-style: italic;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⏰</div>
                    <p style="font-size: 1.2rem; margin: 0;">Nenhum horário configurado</p>
                    <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Configure os horários para dias da semana e sábados</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="display: grid; gap: 3rem;">
                <!-- Horários dos Dias da Semana -->
                <div style="background: var(--white); padding: 2rem; border-radius: 15px; border: 2px solid var(--primary-color);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                        <h3 style="color: var(--primary-color); margin: 0; display: flex; align-items: center; gap: 0.8rem; font-size: 1.5rem;">
                            <span style="font-size: 2rem;">📅</span>
                            <span>Dias da Semana (Segunda a Sexta)</span>
                        </h3>
                        <button onclick="adminManager.showAddHourModal('weekday')" class="btn btn-primary" style="background: var(--primary-color); color: var(--dark-bg); border: 2px solid var(--primary-color); padding: 8px 16px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                            <span>➕</span>
                            <span>Adicionar</span>
                        </button>
                    </div>
                    
                    ${hasWeekdayHours ? `
                        <div class="hours-grid">
                            ${this.weekdayHours.map(hour => `
                                <div class="hour-card">
                                    <div class="hour-time">
                                        <span class="hour-icon">🕒</span>
                                        <span class="hour-text">${hour}</span>
                                    </div>
                                    <button class="hour-delete-btn" onclick="adminManager.deleteHourFromType('${hour}', 'weekday')" title="Excluir horário">
                                        <span>🗑️</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 2rem; color: var(--text-light); font-style: italic;">
                            <p>Nenhum horário configurado para dias da semana</p>
                        </div>
                    `}
                </div>
                
                <!-- Horários dos Sábados -->
                <div style="background: var(--white); padding: 2rem; border-radius: 15px; border: 2px solid var(--primary-color);">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem;">
                        <h3 style="color: var(--primary-color); margin: 0; display: flex; align-items: center; gap: 0.8rem; font-size: 1.5rem;">
                            <span style="font-size: 2rem;">🗓️</span>
                            <span>Sábados</span>
                        </h3>
                        <button onclick="adminManager.showAddHourModal('saturday')" class="btn btn-primary" style="background: var(--primary-color); color: var(--dark-bg); border: 2px solid var(--primary-color); padding: 8px 16px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                            <span>➕</span>
                            <span>Adicionar</span>
                        </button>
                    </div>
                    
                    ${hasSaturdayHours ? `
                        <div class="hours-grid">
                            ${this.saturdayHours.map(hour => `
                                <div class="hour-card">
                                    <div class="hour-time">
                                        <span class="hour-icon">🕒</span>
                                        <span class="hour-text">${hour}</span>
                                    </div>
                                    <button class="hour-delete-btn" onclick="adminManager.deleteHourFromType('${hour}', 'saturday')" title="Excluir horário">
                                        <span>🗑️</span>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 2rem; color: var(--text-light); font-style: italic;">
                            <p>Nenhum horário configurado para sábados</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    
    // Função para adicionar novo horário (compatibilidade)
    async addNewHour() {
        const newHourInput = document.getElementById('newHour');
        const newHour = newHourInput.value;
        
        if (!newHour) {
            alert('❌ Por favor, selecione um horário para adicionar.');
            return;
        }
        
        // Adicionar aos horários dos dias da semana por padrão
        await this.addHourToType(newHour, 'weekday');
    }
    
    // Mostrar modal para adicionar horário por tipo
    showAddHourModal(type) {
        const typeName = type === 'weekday' ? 'Dias da Semana' : 'Sábados';
        const typeIcon = type === 'weekday' ? '📅' : '🗓️';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2 style="color: var(--primary-color); text-align: center; margin-bottom: 2rem; display: flex; align-items: center; justify-content: center; gap: 0.8rem;">
                    <span style="font-size: 2rem;">${typeIcon}</span>
                    <span>Adicionar Horário - ${typeName}</span>
                </h2>
                <form id="addHourForm">
                    <div class="form-group">
                        <label for="newHourInput" style="color: var(--text-dark); font-weight: 600; margin-bottom: 0.5rem; display: block;">Horário</label>
                        <input type="time" id="newHourInput" required style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;">
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                        <button type="button" class="btn btn-primary" onclick="adminManager.addHourToTypeFromModal('${type}')" style="background: var(--primary-color); color: var(--dark-bg); border: 2px solid var(--primary-color); padding: 12px 24px; border-radius: 10px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem;">
                            <span>➕</span>
                            <span>Adicionar</span>
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="background: #666; color: var(--white); border: 2px solid #666; padding: 12px 24px; border-radius: 10px; font-weight: 600;">
                            ❌ Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Adicionar horário a um tipo específico
    async addHourToType(hour, type) {
        const targetArray = type === 'weekday' ? this.weekdayHours : this.saturdayHours;
        const docName = type === 'weekday' ? 'weekdayHours' : 'saturdayHours';
        
        // Verificar se o horário já existe
        if (targetArray.includes(hour)) {
            alert('⚠️ Este horário já está disponível para ' + (type === 'weekday' ? 'dias da semana' : 'sábados') + '!');
            return;
        }
        
        try {
            // Adicionar ao array local
            targetArray.push(hour);
            targetArray.sort();
            
            // Salvar no Firebase
            const hoursRef = window.firestore.doc(window.db, 'settings', docName);
            await window.firestore.setDoc(hoursRef, { hours: targetArray });
            
            // Atualizar availableHours para compatibilidade
            this.availableHours = this.weekdayHours;
            
            // Re-renderizar os horários
            this.renderHours();
            
            alert('✅ Horário adicionado com sucesso!');
            
        } catch (error) {
            console.error('Erro ao adicionar horário:', error);
            alert('❌ Erro ao adicionar horário. Tente novamente.');
        }
    }
    
    // Adicionar horário do modal
    async addHourToTypeFromModal(type) {
        const newHourInput = document.getElementById('newHourInput');
        const newHour = newHourInput.value;
        
        if (!newHour) {
            alert('❌ Por favor, selecione um horário para adicionar.');
            return;
        }
        
        await this.addHourToType(newHour, type);
        
        // Fechar modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Função para deletar horário (compatibilidade)
    async deleteHour(hour) {
        // Verificar em qual tipo o horário existe
        if (this.weekdayHours.includes(hour)) {
            await this.deleteHourFromType(hour, 'weekday');
        } else if (this.saturdayHours.includes(hour)) {
            await this.deleteHourFromType(hour, 'saturday');
        } else {
            alert('❌ Horário não encontrado!');
        }
    }
    
    // Deletar horário de um tipo específico
    async deleteHourFromType(hour, type) {
        const typeName = type === 'weekday' ? 'dias da semana' : 'sábados';
        const confirmMessage = `Tem certeza que deseja excluir o horário "${hour}" dos ${typeName}?\n\n⚠️ Esta ação não pode ser desfeita!`;
        
        if (confirm(confirmMessage)) {
            try {
                const targetArray = type === 'weekday' ? this.weekdayHours : this.saturdayHours;
                const docName = type === 'weekday' ? 'weekdayHours' : 'saturdayHours';
                
                // Remover do array local
                const updatedHours = targetArray.filter(h => h !== hour);
                
                // Salvar no Firebase
                const hoursRef = window.firestore.doc(window.db, 'settings', docName);
                await window.firestore.setDoc(hoursRef, { hours: updatedHours });
                
                // Atualizar array local
                if (type === 'weekday') {
                    this.weekdayHours = updatedHours;
                    this.availableHours = this.weekdayHours; // Atualizar para compatibilidade
                } else {
                    this.saturdayHours = updatedHours;
                }
                
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
    showAddServiceModal() {
        // Criar modal de adição de serviço
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2 style="color: var(--primary-color); text-align: center; margin-bottom: 2rem;">➕ Adicionar Novo Serviço</h2>
                <form id="addServiceForm">
                    <div class="form-group">
                        <label for="addServiceName" style="color: var(--white);">Nome do Serviço</label>
                        <input type="text" id="addServiceName" required style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;" placeholder="Ex: Manicure Premium">
                    </div>
                    <div class="form-group">
                        <label for="addServiceIcon" style="color: var(--white);">Ícone (emoji)</label>
                        <input type="text" id="addServiceIcon" required maxlength="2" style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;" placeholder="💅">
                    </div>
                    <div class="form-group">
                        <label for="addServiceDescription" style="color: var(--white);">Descrição</label>
                        <textarea id="addServiceDescription" required style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; min-height: 80px; resize: vertical; box-sizing: border-box;" placeholder="Descreva o serviço oferecido..."></textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label for="addServicePrice" style="color: var(--white);">Preço (R$)</label>
                            <input type="number" id="addServicePrice" required min="0" step="0.01" style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;" placeholder="0.00">
                        </div>
                        <div class="form-group">
                            <label for="addServiceDuration" style="color: var(--white);">Duração (minutos)</label>
                            <input type="number" id="addServiceDuration" required min="15" step="15" style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;" placeholder="60">
                        </div>
                    </div>
                    <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                        <button type="button" class="btn btn-primary" onclick="adminManager.saveNewService(this.parentElement.parentElement)" style="background: var(--primary-color); color: var(--dark-bg); border: 2px solid var(--primary-color); padding: 12px 24px; border-radius: 10px; font-weight: 600;">💾 Salvar Serviço</button>
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()" style="background: #666; color: var(--white); border: 2px solid #666; padding: 12px 24px; border-radius: 10px; font-weight: 600;">❌ Cancelar</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async saveNewService(modal) {
        // Validar campos obrigatórios
        const name = document.getElementById('addServiceName').value.trim();
        const icon = document.getElementById('addServiceIcon').value.trim();
        const description = document.getElementById('addServiceDescription').value.trim();
        const price = parseFloat(document.getElementById('addServicePrice').value);
        const duration = parseInt(document.getElementById('addServiceDuration').value);
        
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
            console.log('Criando novo serviço:', serviceData);
            
            // Criar novo serviço no Firebase
            const docRef = await window.firestore.addDoc(
                window.firestore.collection(window.db, 'services'),
                serviceData
            );
            
            console.log('Novo serviço criado com ID:', docRef.id);
            
            // Adicionar localmente
            const newService = { id: docRef.id, ...serviceData };
            this.services.push(newService);
            
            // Re-renderizar os serviços
            this.renderServices();
            
            alert('✅ Novo serviço criado com sucesso!');
            modal.closest('.modal').remove();
            
        } catch (error) {
            console.error('Erro ao criar serviço:', error);
            console.error('Detalhes do erro:', error.message);
            alert(`❌ Erro ao criar serviço: ${error.message}`);
        }
    }
    
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
                        <input type="text" id="editServiceName" value="${service.name}" required style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;">
            </div>
                    <div class="form-group">
                        <label for="editServiceIcon" style="color: var(--white);">Ícone (emoji)</label>
                        <input type="text" id="editServiceIcon" value="${service.icon}" required maxlength="2" style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;">
                    </div>
                    <div class="form-group">
                        <label for="editServiceDescription" style="color: var(--white);">Descrição</label>
                        <textarea id="editServiceDescription" required style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; min-height: 80px; resize: vertical; box-sizing: border-box;">${service.description}</textarea>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div class="form-group">
                            <label for="editServicePrice" style="color: var(--white);">Preço (R$)</label>
                            <input type="number" id="editServicePrice" value="${service.price}" required min="0" step="0.01" style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;">
                        </div>
                        <div class="form-group">
                            <label for="editServiceDuration" style="color: var(--white);">Duração (minutos)</label>
                            <input type="number" id="editServiceDuration" value="${service.duration}" required min="15" step="15" style="width: 100%; padding: 12px 16px; border: 2px solid #E0E0E0; border-radius: 10px; background: var(--white); color: var(--text-dark); font-size: 1rem; box-sizing: border-box;">
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
            
            if (serviceSnapshot.exists) {
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

// Função para inicializar o sistema
function initializeAdminSystem() {
    console.log('Inicializando sistema administrativo...');
    console.log('Estado do DOM:', document.readyState);
    console.log('Body existe?', !!document.body);
    console.log('Head existe?', !!document.head);
    
    // Verificar se todos os elementos necessários existem
    const requiredElements = [
        'settingsModal',
        'resetModal', 
        'addAppointmentModal',
        'loginForm'
    ];
    
    console.log('Verificando elementos necessários...');
    const missingElements = [];
    const foundElements = [];
    
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            foundElements.push(id);
            console.log(`✓ ${id} encontrado:`, element);
        } else {
            missingElements.push(id);
            console.log(`✗ ${id} NÃO encontrado`);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Elementos não encontrados:', missingElements);
        console.log('Elementos encontrados:', foundElements);
        console.log('Todos os elementos com ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        
        // Tentar novamente após um delay
        setTimeout(() => {
            console.log('Tentando novamente após delay...');
            const stillMissing = requiredElements.filter(id => !document.getElementById(id));
            if (stillMissing.length > 0) {
                console.error('Ainda faltam elementos:', stillMissing);
            } else {
                console.log('Agora todos os elementos foram encontrados!');
            }
        }, 1000);
    } else {
        console.log('Todos os elementos necessários foram encontrados!');
    }
    
    const adminManager = new FirebaseAdminManager();
    console.log('FirebaseAdminManager criado:', adminManager);
    
    // Tornar disponível globalmente
    window.adminManager = adminManager;
}

// Inicializar quando o DOM estiver carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAdminSystem);
} else {
    // DOM já carregado
    initializeAdminSystem();
}

// Funções globais para garantir que funcionem
window.editService = function(serviceId) {
    return window.adminManager?.editService(serviceId);
};

window.deleteService = function(serviceId) {
    return window.adminManager?.deleteService(serviceId);
};

window.saveEditedService = function(serviceId, modal) {
    return window.adminManager?.saveEditedService(serviceId, modal);
};

window.saveNewService = function(modal) {
    return window.adminManager?.saveNewService(modal);
};

window.deleteHour = function(hour) {
    return window.adminManager?.deleteHour(hour);
};

window.addNewHour = function() {
    return window.adminManager?.addNewHour();
};
