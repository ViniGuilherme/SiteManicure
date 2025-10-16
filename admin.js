// Painel Administrativo - Gerenciamento de Agendamentos
class AdminManager {
    constructor() {
        this.appointments = this.loadAppointments();
        this.services = this.loadServices();
        this.availableHours = this.loadAvailableHours();
        this.availableDays = this.loadAvailableDays();
        this.currentFilter = 'all';
        this.adminPassword = 'admin123'; // Altere esta senha
        this.editingServiceId = null;
        this.init();
    }
    
    // Carregar serviços
    loadServices() {
        const saved = localStorage.getItem('services');
        if (saved) {
            return JSON.parse(saved);
        }
        // Serviços padrão
        const defaultServices = [
            { id: 1, name: 'Manicure Básica', icon: '💅', price: 35, duration: 45, description: 'Corte, lixamento, cutículas e esmaltação tradicional' },
            { id: 2, name: 'Manicure com Gel', icon: '✨', price: 65, duration: 60, description: 'Unha em gel com acabamento profissional e duradouro' },
            { id: 3, name: 'Pedicure', icon: '🦶', price: 40, duration: 60, description: 'Cuidados completos para os pés com hidratação' },
            { id: 4, name: 'Mão e Pé', icon: '💎', price: 70, duration: 90, description: 'Pacote completo com manicure e pedicure' },
            { id: 5, name: 'Alongamento de Unhas', icon: '🎨', price: 120, duration: 120, description: 'Alongamento em gel ou fibra de vidro' },
            { id: 6, name: 'Nail Art', icon: '🌸', price: 50, duration: 45, description: 'Decoração personalizada e criativa' }
        ];
        this.saveServices(defaultServices);
        return defaultServices;
    }
    
    // Salvar serviços
    saveServices(services = this.services) {
        localStorage.setItem('services', JSON.stringify(services));
        this.services = services;
    }
    
    // Carregar horários
    loadAvailableHours() {
        const saved = localStorage.getItem('availableHours');
        if (saved) {
            return JSON.parse(saved);
        }
        // Horários padrão
        const defaultHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        this.saveAvailableHours(defaultHours);
        return defaultHours;
    }
    
    // Salvar horários
    saveAvailableHours(hours = this.availableHours) {
        localStorage.setItem('availableHours', JSON.stringify(hours));
        this.availableHours = hours;
    }
    
    // Carregar dias disponíveis
    loadAvailableDays() {
        const saved = localStorage.getItem('availableDays');
        if (saved) {
            return JSON.parse(saved);
        }
        // Dias padrão (segunda a sábado)
        const defaultDays = {
            'monday': true,
            'tuesday': true,
            'wednesday': true,
            'thursday': true,
            'friday': true,
            'saturday': true,
            'sunday': false
        };
        this.saveAvailableDays(defaultDays);
        return defaultDays;
    }
    
    // Salvar dias disponíveis
    saveAvailableDays(days = this.availableDays) {
        localStorage.setItem('availableDays', JSON.stringify(days));
        this.availableDays = days;
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
                const checkboxes = document.querySelectorAll('.add-service-checkbox:checked');
                let totalDuration = 0;
                checkboxes.forEach(cb => totalDuration += parseInt(cb.dataset.duration));
                this.updateAvailableHoursInModal(e.target.value, totalDuration);
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
        
        // Submit do formulário de serviço
        const serviceForm = document.getElementById('newServiceForm');
        if (serviceForm) {
            serviceForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveServiceForm();
            });
        }
        
        // Submit do formulário de horário
        const hourForm = document.getElementById('newHourForm');
        if (hourForm) {
            hourForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const time = document.getElementById('newHourInput').value;
                this.addHour(time);
            });
        }
    }
    
    // Salvar formulário de serviço
    saveServiceForm() {
        const name = document.getElementById('serviceName').value.trim();
        const icon = document.getElementById('serviceIcon').value.trim();
        const price = parseFloat(document.getElementById('servicePrice').value);
        const duration = parseInt(document.getElementById('serviceDuration').value);
        const description = document.getElementById('serviceDescription').value.trim();
        
        if (!name || !icon || !price || !duration || !description) {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        
        if (this.editingServiceId) {
            // Editar serviço existente
            const service = this.services.find(s => s.id === this.editingServiceId);
            if (service) {
                service.name = name;
                service.icon = icon;
                service.price = price;
                service.duration = duration;
                service.description = description;
                this.saveServices();
                this.renderServices();
                this.hideAddServiceForm();
                alert('Serviço atualizado com sucesso!');
            }
        } else {
            // Adicionar novo serviço
            const newService = {
                id: Date.now(),
                name,
                icon,
                price,
                duration,
                description
            };
            this.services.push(newService);
            this.saveServices();
            this.renderServices();
            this.hideAddServiceForm();
            alert('Serviço adicionado com sucesso!');
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
        event.target.classList.add('active');

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
            container.innerHTML = '<div class="no-appointments-admin">Nenhum agendamento encontrado.</div>';
            return;
        }

        container.innerHTML = filteredAppointments.map(apt => this.createAppointmentCard(apt)).join('');
    }

    // Criar card de agendamento
    createAppointmentCard(appointment) {
        const formattedDate = this.formatDate(appointment.date);
        const completedClass = appointment.completed ? 'appointment-completed' : '';
        
        // Verificar se tem múltiplos serviços
        let servicesHtml = '';
        let totalPrice = 0;
        let totalDuration = 0;
        
        if (appointment.services && appointment.services.length > 0) {
            // Múltiplos serviços
            servicesHtml = appointment.services.map(service => 
                `<span class="service-badge" style="margin-right: 0.5rem; margin-bottom: 0.5rem; display: inline-block;">${service.name}</span>`
            ).join('');
            totalPrice = appointment.price;
            totalDuration = appointment.duration;
        } else {
            // Serviço único (compatibilidade com agendamentos antigos)
            servicesHtml = `<span class="service-badge">${appointment.service}</span>`;
            const serviceInfo = this.getServiceInfo(appointment.service);
            totalPrice = serviceInfo.price || appointment.price || 0;
            totalDuration = serviceInfo.duration || appointment.duration || 0;
        }

        return `
            <div class="appointment-admin-card ${completedClass}">
                <div class="appointment-admin-header">
                    <div class="appointment-admin-info">
                        <div class="client-name">${appointment.clientName}</div>
                        <div style="margin-bottom: 0.5rem;">${servicesHtml}</div>
                        
                        ${appointment.services && appointment.services.length > 1 ? `
                            <div style="background: #f5f5f5; padding: 0.5rem; border-radius: 5px; margin-bottom: 0.5rem;">
                                <small style="color: var(--text-light);">
                                    ${appointment.services.map(s => `• ${s.name} (${s.duration} min - R$ ${s.price.toFixed(2)})`).join('<br>')}
                                </small>
                            </div>
                        ` : ''}
                        
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
                                <span><strong>R$ ${totalPrice.toFixed(2)}</strong></span>
                            </div>
                            <div class="detail-item">
                                <span>⏱️</span>
                                <span>${totalDuration} minutos</span>
                            </div>
                        </div>
                    </div>
                    <div class="appointment-admin-actions">
                        ${!appointment.completed ? `
                            <button class="btn-complete" onclick="adminManager.completeAppointment(${appointment.id})">
                                ✓ Concluir
                            </button>
                            <button class="btn-delete" onclick="adminManager.deleteAppointment(${appointment.id})">
                                🗑️ Cancelar Agendamento
                            </button>
                        ` : `
                            <div style="text-align: center; color: #4CAF50; font-weight: 600; padding: 1rem; background: rgba(76, 175, 80, 0.1); border-radius: 8px; border: 1px solid #4CAF50;">
                                ✅ Serviço Concluído
                            </div>
                        `}
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
        const service = this.services.find(s => s.name === serviceName);
        return service ? { price: service.price, duration: service.duration } : { price: 0, duration: 0 };
    }

    // Completar agendamento
    completeAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            if (confirm(`Marcar agendamento de ${appointment.clientName} como concluído?`)) {
                appointment.completed = true;
                appointment.completedAt = new Date().toISOString();
                
                // Marcar slots de bloqueio relacionados como concluídos também
                this.appointments.forEach(apt => {
                    if (apt.isBlockSlot && apt.mainAppointmentId === id) {
                        apt.completed = true;
                        apt.completedAt = new Date().toISOString();
                    }
                });
                
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
            const confirmMessage = `Tem certeza que deseja cancelar o agendamento de ${appointment.clientName}?\n\n` +
                                 `📅 Data: ${this.formatDate(appointment.date)}\n` +
                                 `🕒 Horário: ${appointment.time}\n` +
                                 `💅 Serviço: ${appointment.services.join(', ')}\n\n` +
                                 `⚠️ Esta ação não pode ser desfeita!`;
            
            if (confirm(confirmMessage)) {
                // Remover agendamento principal
                this.appointments = this.appointments.filter(apt => apt.id !== id);
                
                // Remover slots de bloqueio relacionados
                this.appointments = this.appointments.filter(apt => 
                    !(apt.isBlockSlot && apt.mainAppointmentId === id)
                );
                
                this.saveAppointments();
                this.updateStatistics();
                this.displayAppointments();
                
                // Mostrar confirmação de sucesso
                alert(`✅ Agendamento de ${appointment.clientName} foi cancelado com sucesso!`);
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
        
        // Configurar campo de data para abrir calendário ao clicar
        dateInput.addEventListener('click', () => {
            dateInput.showPicker && dateInput.showPicker();
        });
        
        // Configurar validação de dias da semana
        this.setupAdminAvailableDays();
        
        // Renderizar checkboxes de serviços
        this.renderAddServicesCheckboxes();
        
        // Atualizar horários para hoje
        this.updateAvailableHoursInModal(today, 0);
    }
    
    // Renderizar checkboxes de serviços no modal de adicionar
    renderAddServicesCheckboxes() {
        const container = document.getElementById('addServicesContainer');
        if (!container) return;
        
        container.innerHTML = this.services.map(service => `
            <div style="margin-bottom: 0.6rem;">
                <label style="display: flex; align-items: center; cursor: pointer; padding: 0.4rem; border-radius: 6px;">
                    <input type="checkbox" 
                           class="add-service-checkbox" 
                           value="${service.name}" 
                           data-price="${service.price}" 
                           data-duration="${service.duration}"
                           style="width: 16px; height: 16px; margin-right: 0.6rem; cursor: pointer;">
                    <span style="flex: 1; font-size: 0.9rem; color: white;">
                        <strong style="color: white;">${service.icon} ${service.name}</strong>
                        <span style="color: #ccc; font-size: 0.85rem; margin-left: 0.3rem;">
                            (${service.duration} min - R$ ${service.price.toFixed(2)})
                        </span>
                    </span>
                </label>
            </div>
        `).join('');
        
        // Adicionar event listeners aos checkboxes
        container.querySelectorAll('.add-service-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateAddServiceSummary();
                // Atualizar horários disponíveis
                const dateInput = document.getElementById('addAppointmentDate');
                if (dateInput && dateInput.value) {
                    const checkboxes = document.querySelectorAll('.add-service-checkbox:checked');
                    let totalDuration = 0;
                    checkboxes.forEach(cb => totalDuration += parseInt(cb.dataset.duration));
                    this.updateAvailableHoursInModal(dateInput.value, totalDuration);
                }
            });
        });
    }
    
    // Atualizar resumo dos serviços selecionados no modal de adicionar
    updateAddServiceSummary() {
        const checkboxes = document.querySelectorAll('.add-service-checkbox:checked');
        const summary = document.getElementById('addServiceSummary');
        const summaryContent = document.getElementById('addSummaryContent');
        
        if (checkboxes.length === 0) {
            summary.style.display = 'none';
            return;
        }
        
        let totalPrice = 0;
        let totalDuration = 0;
        const services = [];
        
        checkboxes.forEach(checkbox => {
            const price = parseFloat(checkbox.dataset.price);
            const duration = parseInt(checkbox.dataset.duration);
            totalPrice += price;
            totalDuration += duration;
            services.push(checkbox.value);
        });
        
        summaryContent.innerHTML = `
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.4rem;">
                <span style="color: white;"><strong>Serviços:</strong></span>
                <span style="color: #ccc;">${services.join(', ')}</span>
                <span style="color: white;"><strong>Duração Total:</strong></span>
                <span style="color: #ccc;">${totalDuration} minutos</span>
                <span style="color: white;"><strong>Preço Total:</strong></span>
                <span style="color: var(--primary-color); font-weight: 600;">R$ ${totalPrice.toFixed(2)}</span>
            </div>
        `;
        
        summary.style.display = 'block';
    }

    // Fechar modal de adicionar agendamento
    closeAddAppointmentModal() {
        const modal = document.getElementById('addAppointmentModal');
        modal.style.display = 'none';
        document.getElementById('addAppointmentForm').reset();
    }

    // Atualizar horários disponíveis no modal
    updateAvailableHoursInModal(selectedDate, totalDuration = 0) {
        const timeSelect = document.getElementById('addAppointmentTime');
        const msgElement = document.getElementById('timeAvailabilityMsg');
        const availableHours = this.availableHours;
        
        // Limpar opções existentes
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        
        // Se não há serviço selecionado, não mostrar horários
        if (totalDuration === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Selecione um serviço primeiro';
            option.disabled = true;
            option.style.color = '#999';
            timeSelect.appendChild(option);
            msgElement.textContent = 'Selecione pelo menos um serviço';
            msgElement.style.color = '#666';
            return;
        }
        
        // Calcular quantos slots de horário são necessários
        const slotsNeeded = Math.ceil(totalDuration / 60);
        
        let availableCount = 0;
        
        // Verificar se a data é hoje para filtrar horários passados
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        // Adicionar apenas horários que têm slots consecutivos livres suficientes
        availableHours.forEach((hour, index) => {
            // Se for hoje, verificar se o horário já passou
            if (selectedDate === today) {
                const [hourStr, minuteStr] = hour.split(':');
                const hourNum = parseInt(hourStr);
                const minuteNum = parseInt(minuteStr);
                
                // Criar objeto Date para comparar horários
                const appointmentTime = new Date();
                appointmentTime.setHours(hourNum, minuteNum, 0, 0);
                
                // Se o horário já passou, não mostrar
                if (appointmentTime <= now) {
                    return;
                }
            }
            
            if (this.isTimeSlotAvailableForModal(selectedDate, hour, slotsNeeded, index)) {
                const option = document.createElement('option');
                option.value = hour;
                option.textContent = hour;
                timeSelect.appendChild(option);
                availableCount++;
            }
        });
        
        // Atualizar mensagem
        if (availableCount === 0) {
            msgElement.textContent = `⚠️ Nenhum horário disponível para ${totalDuration} minutos nesta data`;
            msgElement.style.color = '#F44336';
            
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum horário disponível';
            option.disabled = true;
            option.style.color = '#999';
            timeSelect.appendChild(option);
        } else {
            msgElement.textContent = `✓ ${availableCount} horário(s) disponível(is) para ${totalDuration} min`;
            msgElement.style.color = '#4CAF50';
        }
    }
    
    // Verificar se há slots consecutivos disponíveis (versão para modal admin)
    isTimeSlotAvailableForModal(date, startTime, slotsNeeded, startIndex) {
        // Verificar se há horários suficientes depois deste
        if (startIndex + slotsNeeded > this.availableHours.length) {
            return false;
        }
        
        // Obter os horários que serão ocupados
        const hoursToCheck = [];
        for (let i = 0; i < slotsNeeded; i++) {
            const hourIndex = startIndex + i;
            if (hourIndex < this.availableHours.length) {
                hoursToCheck.push(this.availableHours[hourIndex]);
            } else {
                return false;
            }
        }
        
        // Verificar se todos esses horários estão livres
        for (const hour of hoursToCheck) {
            const isOccupied = this.appointments.some(apt => 
                apt.date === date && apt.time === hour && !apt.completed
            );
            if (isOccupied) {
                return false;
            }
        }
        
        return true;
    }

    // Adicionar agendamento manualmente
    addManualAppointment() {
        const clientName = document.getElementById('addClientName').value.trim();
        const phone = document.getElementById('addClientPhone').value.trim();
        const email = document.getElementById('addClientEmail').value.trim();
        const date = document.getElementById('addAppointmentDate').value;
        const time = document.getElementById('addAppointmentTime').value;
        
        // Obter serviços selecionados
        const checkboxes = document.querySelectorAll('.add-service-checkbox:checked');

        // Validações
        if (!clientName) {
            alert('Por favor, digite o nome do cliente.');
            return;
        }

        if (!phone) {
            alert('Por favor, digite o telefone.');
            return;
        }

        // Validar formato de email apenas se fornecido
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Por favor, digite um e-mail válido.');
                return;
            }
        }

        if (checkboxes.length === 0) {
            alert('Por favor, selecione pelo menos um serviço.');
            return;
        }

        if (!date) {
            alert('Por favor, selecione uma data.');
            return;
        }

        if (!time) {
            alert('Por favor, selecione um horário.');
            return;
        }

        // Calcular totais
        let totalPrice = 0;
        let totalDuration = 0;
        const selectedServices = [];
        
        checkboxes.forEach(checkbox => {
            const price = parseFloat(checkbox.dataset.price);
            const duration = parseInt(checkbox.dataset.duration);
            totalPrice += price;
            totalDuration += duration;
            selectedServices.push({
                name: checkbox.value,
                price: price,
                duration: duration
            });
        });
        
        // Calcular quantos slots de horário serão ocupados
        const slotsNeeded = Math.ceil(totalDuration / 60);
        const startIndex = this.availableHours.indexOf(time);
        
        // Verificar disponibilidade de todos os slots
        if (!this.isTimeSlotAvailableForModal(date, time, slotsNeeded, startIndex)) {
            alert('Este horário não está mais disponível. Por favor, selecione outro horário.');
            this.updateAvailableHoursInModal(date, totalDuration);
            return;
        }

        // Criar um agendamento único com múltiplos serviços
        const appointmentId = Date.now();
        const appointment = {
            id: appointmentId,
            clientName,
            phone,
            email,
            services: selectedServices,
            service: selectedServices.map(s => s.name).join(' + '),
            date,
            time,
            price: totalPrice,
            duration: totalDuration,
            slotsNeeded: slotsNeeded,
            completed: false,
            createdAt: new Date().toISOString(),
            createdBy: 'admin'
        };

        // Criar registros de bloqueio para cada slot de horário necessário
        for (let i = 0; i < slotsNeeded; i++) {
            const hourIndex = startIndex + i;
            if (hourIndex < this.availableHours.length) {
                const slotTime = this.availableHours[hourIndex];
                
                if (i === 0) {
                    this.appointments.push(appointment);
                } else {
                    this.appointments.push({
                        id: Date.now() + i,
                        clientName,
                        phone,
                        email,
                        service: `[Continuação] ${selectedServices.map(s => s.name).join(' + ')}`,
                        services: selectedServices,
                        date,
                        time: slotTime,
                        price: 0,
                        duration: 60,
                        slotsNeeded: 1,
                        completed: false,
                        isBlockSlot: true,
                        mainAppointmentId: appointmentId,
                        createdAt: new Date().toISOString(),
                        createdBy: 'admin'
                    });
                }
            }
        }
        
        this.saveAppointments();

        // Atualizar interface
        this.updateStatistics();
        this.displayAppointments();

        // Fechar modal e mostrar confirmação
        this.closeAddAppointmentModal();
        
        // Desmarcar checkboxes
        checkboxes.forEach(cb => cb.checked = false);
        this.updateAddServiceSummary();
        
        const formattedDate = this.formatDate(appointment.date);
        alert(`✅ Agendamento criado com sucesso!\n\nCliente: ${appointment.clientName}\nServiços: ${appointment.service}\nData: ${formattedDate} às ${appointment.time}\nDuração: ${totalDuration} min\nTotal: R$ ${totalPrice.toFixed(2)}`);
    }
    
    // ===== GERENCIAMENTO DE CONFIGURAÇÕES =====
    
    // Mostrar modal de configurações
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'block';
        this.showSettingsTab('services');
        this.renderServices();
        this.renderHours();
    }
    
    // Fechar modal de configurações
    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        modal.style.display = 'none';
        this.hideAddServiceForm();
        this.hideAddHourForm();
    }
    
    // Alternar entre abas
    showSettingsTab(tabName) {
        // Atualizar botões
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Mostrar/ocultar conteúdo
        document.getElementById('servicesTab').style.display = tabName === 'services' ? 'block' : 'none';
        document.getElementById('hoursTab').style.display = tabName === 'hours' ? 'block' : 'none';
        document.getElementById('daysTab').style.display = tabName === 'days' ? 'block' : 'none';
        
        // Carregar conteúdo específico da aba
        if (tabName === 'days') {
            this.renderDaysConfiguration();
        }
    }
    
    // ===== GERENCIAMENTO DE SERVIÇOS =====
    
    // Renderizar lista de serviços
    renderServices() {
        const container = document.getElementById('servicesList');
        
        if (this.services.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Nenhum serviço cadastrado.</p>';
            return;
        }
        
        container.innerHTML = this.services.map(service => `
            <div class="service-item">
                <div class="service-icon-large">${service.icon}</div>
                <div class="service-info">
                    <h4>${service.name}</h4>
                    <p style="color: var(--text-light); font-size: 0.9rem;">${service.description}</p>
                    <div class="service-details">
                        <span><strong>💰 R$ ${service.price.toFixed(2)}</strong></span>
                        <span>⏱️ ${service.duration} min</span>
                    </div>
                </div>
                <div class="service-actions">
                    <button class="btn-edit-service" onclick="adminManager.editService(${service.id})">✏️ Editar</button>
                    <button class="btn-delete-service" onclick="adminManager.deleteService(${service.id})">🗑️ Excluir</button>
                </div>
            </div>
        `).join('');
    }
    
    // Mostrar formulário de adicionar serviço
    showAddServiceForm() {
        document.getElementById('addServiceForm').style.display = 'block';
        this.editingServiceId = null;
        document.getElementById('newServiceForm').reset();
        document.querySelector('#addServiceForm h4').textContent = 'Novo Serviço';
    }
    
    // Ocultar formulário de adicionar serviço
    hideAddServiceForm() {
        document.getElementById('addServiceForm').style.display = 'none';
        document.getElementById('newServiceForm').reset();
        this.editingServiceId = null;
    }
    
    // Editar serviço
    editService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;
        
        this.editingServiceId = id;
        document.getElementById('addServiceForm').style.display = 'block';
        document.querySelector('#addServiceForm h4').textContent = 'Editar Serviço';
        
        document.getElementById('serviceName').value = service.name;
        document.getElementById('serviceIcon').value = service.icon;
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDuration').value = service.duration;
        document.getElementById('serviceDescription').value = service.description;
        
        // Scroll para o formulário
        document.getElementById('addServiceForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Excluir serviço
    deleteService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;
        
        if (confirm(`Tem certeza que deseja excluir o serviço "${service.name}"?\n\nEsta ação não pode ser desfeita.`)) {
            this.services = this.services.filter(s => s.id !== id);
            this.saveServices();
            this.renderServices();
            alert('Serviço excluído com sucesso!');
        }
    }
    
    // ===== GERENCIAMENTO DE HORÁRIOS =====
    
    // Renderizar lista de horários
    renderHours() {
        const container = document.getElementById('hoursList');
        
        if (this.availableHours.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem; grid-column: 1/-1;">Nenhum horário cadastrado.</p>';
            return;
        }
        
        // Ordenar horários
        const sortedHours = [...this.availableHours].sort();
        
        container.innerHTML = sortedHours.map(hour => `
            <div class="hour-item">
                <div class="hour-time">${hour}</div>
                <button class="hour-delete" onclick="adminManager.deleteHour('${hour}')">🗑️ Remover</button>
            </div>
        `).join('');
    }
    
    // Mostrar formulário de adicionar horário
    showAddHourForm() {
        document.getElementById('addHourForm').style.display = 'block';
        document.getElementById('newHourForm').reset();
    }
    
    // Ocultar formulário de adicionar horário
    hideAddHourForm() {
        document.getElementById('addHourForm').style.display = 'none';
        document.getElementById('newHourForm').reset();
    }
    
    // Adicionar horário
    addHour(time) {
        if (!time) {
            alert('Por favor, selecione um horário.');
            return;
        }
        
        if (this.availableHours.includes(time)) {
            alert('Este horário já está cadastrado.');
            return;
        }
        
        this.availableHours.push(time);
        this.saveAvailableHours();
        this.renderHours();
        this.hideAddHourForm();
        alert('Horário adicionado com sucesso!');
    }
    
    // Excluir horário
    deleteHour(time) {
        if (confirm(`Tem certeza que deseja remover o horário ${time}?`)) {
            this.availableHours = this.availableHours.filter(h => h !== time);
            this.saveAvailableHours();
            this.renderHours();
            alert('Horário removido com sucesso!');
        }
    }
    
    // ===== GERENCIAMENTO DE DIAS DA SEMANA =====
    
    // Renderizar configuração de dias
    renderDaysConfiguration() {
        const container = document.getElementById('daysList');
        const summaryElement = document.getElementById('daysSummary');
        
        const daysConfig = [
            { key: 'monday', name: 'Segunda-feira', icon: '📅' },
            { key: 'tuesday', name: 'Terça-feira', icon: '📅' },
            { key: 'wednesday', name: 'Quarta-feira', icon: '📅' },
            { key: 'thursday', name: 'Quinta-feira', icon: '📅' },
            { key: 'friday', name: 'Sexta-feira', icon: '📅' },
            { key: 'saturday', name: 'Sábado', icon: '📅' },
            { key: 'sunday', name: 'Domingo', icon: '📅' }
        ];
        
        container.innerHTML = daysConfig.map(day => `
            <div class="day-item ${this.availableDays[day.key] ? 'active' : ''}" onclick="adminManager.toggleDay('${day.key}')">
                <input type="checkbox" class="day-checkbox" ${this.availableDays[day.key] ? 'checked' : ''} onchange="adminManager.toggleDay('${day.key}')">
                <div class="day-info">
                    <div class="day-name">${day.icon} ${day.name}</div>
                    <div class="day-status">${this.availableDays[day.key] ? 'Funcionando' : 'Fechado'}</div>
                </div>
            </div>
        `).join('');
        
        // Atualizar resumo
        this.updateDaysSummary();
    }
    
    // Alternar dia da semana
    toggleDay(dayKey) {
        this.availableDays[dayKey] = !this.availableDays[dayKey];
        this.updateDaysSummary();
        
        // Atualizar visual do card
        const dayItem = document.querySelector(`[onclick="adminManager.toggleDay('${dayKey}')"]`);
        const checkbox = dayItem.querySelector('.day-checkbox');
        const statusElement = dayItem.querySelector('.day-status');
        
        if (this.availableDays[dayKey]) {
            dayItem.classList.add('active');
            checkbox.checked = true;
            statusElement.textContent = 'Funcionando';
        } else {
            dayItem.classList.remove('active');
            checkbox.checked = false;
            statusElement.textContent = 'Fechado';
        }
    }
    
    // Atualizar resumo dos dias
    updateDaysSummary() {
        const summaryElement = document.getElementById('daysSummary');
        const activeDays = Object.keys(this.availableDays).filter(day => this.availableDays[day]);
        const totalDays = Object.keys(this.availableDays).length;
        
        if (activeDays.length === 0) {
            summaryElement.innerHTML = '<span style="color: #F44336;">⚠️ Nenhum dia de funcionamento configurado</span>';
        } else if (activeDays.length === totalDays) {
            summaryElement.innerHTML = '<span style="color: #4CAF50;">✅ Funcionando todos os dias da semana</span>';
        } else {
            const dayNames = {
                'monday': 'Segunda',
                'tuesday': 'Terça',
                'wednesday': 'Quarta',
                'thursday': 'Quinta',
                'friday': 'Sexta',
                'saturday': 'Sábado',
                'sunday': 'Domingo'
            };
            
            const activeDayNames = activeDays.map(day => dayNames[day]);
            summaryElement.innerHTML = `<span style="color: var(--primary-color);">📅 Funcionando: ${activeDayNames.join(', ')}</span>`;
        }
    }
    
    // Salvar configuração de dias
    saveDaysConfiguration() {
        this.saveAvailableDays();
        alert('✅ Configuração de dias salva com sucesso!');
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
    
    // ===== GERENCIAMENTO DE RESET =====
    
    // Mostrar modal de reset
    showResetModal() {
        document.getElementById('resetModal').style.display = 'block';
    }
    
    // Fechar modal de reset
    closeResetModal() {
        document.getElementById('resetModal').style.display = 'none';
    }
    
    // Resetar dados específicos
    resetData(type) {
        let confirmMessage = '';
        let actionMessage = '';
        
        switch(type) {
            case 'completed':
                confirmMessage = 'Tem certeza que deseja remover TODOS os agendamentos concluídos?\n\n⚠️ Esta ação não pode ser desfeita!';
                actionMessage = 'Agendamentos concluídos removidos com sucesso!';
                break;
            case 'pending':
                confirmMessage = 'Tem certeza que deseja remover TODOS os agendamentos pendentes?\n\n⚠️ Esta ação não pode ser desfeita!';
                actionMessage = 'Agendamentos pendentes removidos com sucesso!';
                break;
            case 'all':
                confirmMessage = 'Tem certeza que deseja remover TODOS os agendamentos?\n\n⚠️ Esta ação não pode ser desfeita!';
                actionMessage = 'Todos os agendamentos foram removidos com sucesso!';
                break;
            case 'services':
                confirmMessage = 'Deseja restaurar os serviços para a configuração padrão?';
                actionMessage = 'Serviços restaurados para a configuração padrão!';
                break;
            case 'hours':
                confirmMessage = 'Deseja restaurar os horários para a configuração padrão?';
                actionMessage = 'Horários restaurados para a configuração padrão!';
                break;
            case 'days':
                confirmMessage = 'Deseja restaurar os dias para a configuração padrão (Segunda a Sábado)?';
                actionMessage = 'Dias restaurados para a configuração padrão!';
                break;
            case 'everything':
                confirmMessage = '⚠️ ATENÇÃO: Esta ação irá remover TODOS os dados do sistema!\n\n• Todos os agendamentos\n• Todas as configurações\n• Todas as estatísticas\n\nEsta ação NÃO pode ser desfeita!';
                actionMessage = 'Sistema resetado completamente! Todos os dados foram removidos.';
                break;
        }
        
        if (confirm(confirmMessage)) {
            this.performReset(type);
            alert(actionMessage);
            this.closeResetModal();
            this.updateStatistics();
            this.displayAppointments();
        }
    }
    
    // Executar reset
    performReset(type) {
        switch(type) {
            case 'completed':
                this.appointments = this.appointments.filter(apt => !apt.completed);
                this.saveAppointments();
                break;
            case 'pending':
                this.appointments = this.appointments.filter(apt => apt.completed);
                this.saveAppointments();
                break;
            case 'all':
                this.appointments = [];
                this.saveAppointments();
                break;
            case 'services':
                this.services = this.getDefaultServices();
                this.saveServices();
                this.renderServices();
                break;
            case 'hours':
                this.availableHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
                this.saveAvailableHours();
                this.renderHours();
                break;
            case 'days':
                this.availableDays = {
                    'monday': true,
                    'tuesday': true,
                    'wednesday': true,
                    'thursday': true,
                    'friday': true,
                    'saturday': true,
                    'sunday': false
                };
                this.saveAvailableDays();
                this.renderDaysConfiguration();
                break;
            case 'everything':
                this.appointments = [];
                this.services = this.getDefaultServices();
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
                this.saveAppointments();
                this.saveServices();
                this.saveAvailableHours();
                this.saveAvailableDays();
                this.renderServices();
                this.renderHours();
                break;
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
    
    // Configurar dias disponíveis no modal administrativo
    setupAdminAvailableDays() {
        const dateInput = document.getElementById('addAppointmentDate');
        const availableDays = this.availableDays;
        
        // Configurar validação de dias da semana
        dateInput.addEventListener('change', (e) => {
            const selectedDate = e.target.value;
            if (selectedDate) {
                const dayOfWeek = this.getDayOfWeek(selectedDate);
                if (!availableDays[dayOfWeek]) {
                    alert(`⚠️ A manicure não atende aos ${this.getDayName(dayOfWeek)}s.\n\nPor favor, escolha outro dia da semana.`);
                    e.target.value = '';
                }
            }
        });
    }
    
    // Obter dia da semana de uma data
    getDayOfWeek(dateString) {
        const date = new Date(dateString);
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


