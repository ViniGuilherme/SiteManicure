// Sistema de Agendamento - Interface do Cliente
class AppointmentSystem {
    constructor() {
        this.appointments = this.loadAppointments();
        this.services = this.loadServices();
        this.availableHours = this.loadAvailableHours();
        this.servicesPrices = this.createServicesPricesObject();
        this.init();
    }
    
    // Carregar serviços do localStorage
    loadServices() {
        const saved = localStorage.getItem('services');
        if (saved) {
            return JSON.parse(saved);
        }
        // Serviços padrão (caso não tenha configurado ainda)
        return [
            { id: 1, name: 'Manicure Básica', icon: '💅', price: 35, duration: 45, description: 'Corte, lixamento, cutículas e esmaltação tradicional' },
            { id: 2, name: 'Manicure com Gel', icon: '✨', price: 65, duration: 60, description: 'Unha em gel com acabamento profissional e duradouro' },
            { id: 3, name: 'Pedicure', icon: '🦶', price: 40, duration: 60, description: 'Cuidados completos para os pés com hidratação' },
            { id: 4, name: 'Mão e Pé', icon: '💎', price: 70, duration: 90, description: 'Pacote completo com manicure e pedicure' },
            { id: 5, name: 'Alongamento de Unhas', icon: '🎨', price: 120, duration: 120, description: 'Alongamento em gel ou fibra de vidro' },
            { id: 6, name: 'Nail Art', icon: '🌸', price: 50, duration: 45, description: 'Decoração personalizada e criativa' }
        ];
    }
    
    // Carregar horários do localStorage
    loadAvailableHours() {
        const saved = localStorage.getItem('availableHours');
        if (saved) {
            return JSON.parse(saved);
        }
        // Horários padrão
        return ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    }
    
    // Carregar dias disponíveis do localStorage
    loadAvailableDays() {
        const saved = localStorage.getItem('availableDays');
        if (saved) {
            return JSON.parse(saved);
        }
        // Dias padrão (Segunda a Sábado)
        return {
            'monday': true,
            'tuesday': true,
            'wednesday': true,
            'thursday': true,
            'friday': true,
            'saturday': true,
            'sunday': false
        };
    }
    
    // Configurar dias disponíveis no campo de data
    setupAvailableDays() {
        const dateInput = document.getElementById('appointmentDate');
        const availableDays = this.loadAvailableDays();
        
        // Definir data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
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
    
    // Criar objeto de preços para compatibilidade
    createServicesPricesObject() {
        const pricesObj = {};
        this.services.forEach(service => {
            pricesObj[service.name] = { price: service.price, duration: service.duration };
        });
        return pricesObj;
    }

    init() {
        this.renderServicesGrid();
        this.renderServicesCheckboxes();
        this.initializeDateInput();
        this.setupEventListeners();
        this.displayAppointments();
    }
    
    // Renderizar serviços na página
    renderServicesGrid() {
        const servicesGrid = document.querySelector('.services-grid');
        if (!servicesGrid) return;
        
        servicesGrid.innerHTML = this.services.map(service => `
            <div class="service-card" data-service="${service.name}" data-price="${service.price}" data-duration="${service.duration}">
                <div class="service-icon">${service.icon}</div>
                <h3>${service.name}</h3>
                <p class="service-duration">${service.duration} minutos</p>
                <p class="service-description">${service.description}</p>
                <p class="service-price">R$ ${service.price.toFixed(2)}</p>
                <button class="btn btn-secondary" onclick="appointmentSystem.selectServiceFromCard('${service.name}')">Selecionar</button>
            </div>
        `).join('');
    }
    
    // Renderizar checkboxes de serviços
    renderServicesCheckboxes() {
        const container = document.getElementById('servicesContainer');
        if (!container) return;
        
        container.innerHTML = this.services.map(service => `
            <div style="margin-bottom: 0.8rem;">
                <label style="display: flex; align-items: center; cursor: pointer; padding: 0.5rem; border-radius: 8px; transition: background 0.3s;">
                    <input type="checkbox" 
                           class="service-checkbox" 
                           value="${service.name}" 
                           data-price="${service.price}" 
                           data-duration="${service.duration}"
                           style="width: 18px; height: 18px; margin-right: 0.8rem; cursor: pointer;">
                    <span style="flex: 1; color: white;">
                        <strong style="color: white;">${service.icon} ${service.name}</strong>
                        <span style="color: #ccc; font-size: 0.9rem; margin-left: 0.5rem;">
                            (${service.duration} min - R$ ${service.price.toFixed(2)})
                        </span>
                    </span>
                </label>
            </div>
        `).join('');
        
        // Adicionar event listeners aos checkboxes
        container.querySelectorAll('.service-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateServiceSummary());
        });
    }
    
    // Atualizar resumo dos serviços selecionados
    updateServiceSummary() {
        const checkboxes = document.querySelectorAll('.service-checkbox:checked');
        const summary = document.getElementById('serviceSummary');
        const summaryContent = document.getElementById('summaryContent');
        
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
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 0.5rem; font-size: 0.95rem;">
                <span style="color: white;"><strong>Serviços:</strong></span>
                <span style="color: #ccc;">${services.join(', ')}</span>
                <span style="color: white;"><strong>Duração Total:</strong></span>
                <span style="color: #ccc;">${totalDuration} minutos</span>
                <span style="color: white;"><strong>Preço Total:</strong></span>
                <span style="color: var(--primary-color); font-weight: 600; font-size: 1.1rem;">R$ ${totalPrice.toFixed(2)}</span>
            </div>
        `;
        
        summary.style.display = 'block';
        
        // Atualizar horários disponíveis se já tiver data selecionada
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput && dateInput.value) {
            this.updateAvailableHours(dateInput.value, totalDuration);
        }
    }
    
    // Selecionar serviço a partir do card
    selectServiceFromCard(serviceName) {
        // Rolar para o formulário
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        
        // Marcar o checkbox correspondente
        const checkbox = document.querySelector(`.service-checkbox[value="${serviceName}"]`);
        if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            this.updateServiceSummary();
        }
        
        // Destacar o formulário
        const bookingForm = document.querySelector('.booking-form-container');
        bookingForm.style.animation = 'none';
        setTimeout(() => {
            bookingForm.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }

    // Carregar agendamentos do localStorage
    loadAppointments() {
        const saved = localStorage.getItem('appointments');
        return saved ? JSON.parse(saved) : [];
    }

    // Salvar agendamentos
    saveAppointments() {
        localStorage.setItem('appointments', JSON.stringify(this.appointments));
    }

    // Configurar data mínima (hoje)
    initializeDateInput() {
        const dateInput = document.getElementById('appointmentDate');
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        // Definir data padrão para hoje
        dateInput.value = today;
        
        // Carregar horários disponíveis para hoje
        this.updateAvailableHours(today, 0);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formatação automática do telefone
        document.getElementById('clientPhone').addEventListener('input', this.formatPhone);

        // Atualizar horários quando a data mudar
        document.getElementById('appointmentDate').addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.service-checkbox:checked');
            let totalDuration = 0;
            checkboxes.forEach(cb => totalDuration += parseInt(cb.dataset.duration));
            this.updateAvailableHours(e.target.value, totalDuration);
        });

        // Submit do formulário
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAppointment();
        });
        
        // Campo de data - abrir calendário ao clicar em qualquer lugar
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            dateInput.addEventListener('click', () => {
                dateInput.showPicker && dateInput.showPicker();
            });
            
            // Configurar dias disponíveis baseado na configuração da manicure
            this.setupAvailableDays();
        }

        // Smooth scroll para navegação
        this.setupSmoothScroll();
        
        // Menu hambúrguer para mobile
        this.setupMobileMenu();
    }

    // Formatar telefone automaticamente
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

    // Atualizar horários disponíveis
    updateAvailableHours(selectedDate, totalDuration = 0) {
        const timeSelect = document.getElementById('appointmentTime');
        
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
            return;
        }
        
        // Calcular quantos slots de horário são necessários (arredondando para cima em blocos de 60 min)
        const slotsNeeded = Math.ceil(totalDuration / 60);
        
        // Verificar se a data é hoje para filtrar horários passados
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        
        // Adicionar apenas horários que têm slots consecutivos livres suficientes
        this.availableHours.forEach((hour, index) => {
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
            
            if (this.isTimeSlotAvailable(selectedDate, hour, slotsNeeded, index)) {
                const option = document.createElement('option');
                option.value = hour;
                option.textContent = hour;
                timeSelect.appendChild(option);
            }
        });
        
        // Mostrar mensagem se não há horários disponíveis
        if (timeSelect.children.length === 1) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhum horário disponível nesta data para esta duração';
            option.disabled = true;
            option.style.color = '#999';
            timeSelect.appendChild(option);
        }
    }
    
    // Verificar se há slots consecutivos disponíveis
    isTimeSlotAvailable(date, startTime, slotsNeeded, startIndex) {
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
                return false; // Não há horários suficientes
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

    // Verificar se horário está disponível
    isTimeAvailable(date, time) {
        return !this.appointments.some(apt => 
            apt.date === date && apt.time === time && !apt.completed
        );
    }

    // Submeter agendamento
    submitAppointment() {
        const clientName = document.getElementById('clientName').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const email = document.getElementById('clientEmail').value.trim();
        const date = document.getElementById('appointmentDate').value;
        const time = document.getElementById('appointmentTime').value;
        
        // Obter serviços selecionados
        const checkboxes = document.querySelectorAll('.service-checkbox:checked');
        
        // Validações
        if (!clientName) {
            alert('Por favor, digite seu nome completo.');
            return;
        }

        if (!phone) {
            alert('Por favor, digite seu telefone.');
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
        if (!this.isTimeSlotAvailable(date, time, slotsNeeded, startIndex)) {
            alert('Este horário não está mais disponível. Por favor, selecione outro horário.');
            this.updateAvailableHours(date, totalDuration);
            return;
        }

        // Criar um agendamento único com múltiplos serviços
        const appointmentId = Date.now();
        const appointment = {
            id: appointmentId,
            name: clientName, // Mudança para 'name' para compatibilidade
            clientName, // Manter para compatibilidade com admin
            phone,
            email,
            services: selectedServices, // Array de serviços
            service: selectedServices.map(s => s.name).join(' + '), // Para compatibilidade
            date,
            time,
            totalPrice: totalPrice, // Mudança para 'totalPrice' para compatibilidade
            price: totalPrice, // Manter para compatibilidade com admin
            totalDuration: totalDuration, // Mudança para 'totalDuration' para compatibilidade
            duration: totalDuration, // Manter para compatibilidade com admin
            slotsNeeded: slotsNeeded,
            completed: false,
            createdAt: new Date().toISOString()
        };

        // Criar registros de bloqueio para cada slot de horário necessário
        for (let i = 0; i < slotsNeeded; i++) {
            const hourIndex = startIndex + i;
            if (hourIndex < this.availableHours.length) {
                const slotTime = this.availableHours[hourIndex];
                
                // Se for o primeiro slot, adicionar o agendamento completo
                if (i === 0) {
                    this.appointments.push(appointment);
                } else {
                    // Para slots adicionais, criar registros de bloqueio
                    this.appointments.push({
                        id: Date.now() + i,
                        clientName,
                        phone,
                        email,
                        service: `[Continuação] ${selectedServices.map(s => s.name).join(' + ')}`,
                        services: selectedServices,
                        date,
                        time: slotTime,
                        price: 0, // Não contar preço nos slots adicionais
                        duration: 60,
                        slotsNeeded: 1,
                        completed: false,
                        isBlockSlot: true, // Marcador para identificar slots de bloqueio
                        mainAppointmentId: appointmentId,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        }
        
        this.saveAppointments();

        // Mostrar confirmação
        this.showSuccessModal(appointment);

        // Atualizar exibição de agendamentos
        this.displayAppointments();

        // Limpar formulário
        document.getElementById('bookingForm').reset();
        
        // Desmarcar todos os checkboxes
        checkboxes.forEach(cb => cb.checked = false);
        this.updateServiceSummary();
        
        // Reinicializar data para hoje
        this.initializeDateInput();
    }

    // Mostrar modal de sucesso
    showSuccessModal(appointment) {
        const modal = document.getElementById('successModal');
        const modalDetails = document.getElementById('modalDetails');
        
        const formattedDate = this.formatDate(appointment.date);
        
        // Mostrar serviços individuais se houver múltiplos
        let servicesHtml = '';
        if (appointment.services && appointment.services.length > 0) {
            servicesHtml = '<strong>Serviços:</strong><br>';
            appointment.services.forEach(service => {
                servicesHtml += `• ${service.name} (${service.duration} min - R$ ${service.price.toFixed(2)})<br>`;
            });
            servicesHtml += `<br><strong>Total:</strong> ${appointment.duration} minutos - R$ ${appointment.price.toFixed(2)}<br>`;
        } else {
            servicesHtml = `<strong>${appointment.service}</strong><br>`;
        }
        
        modalDetails.innerHTML = `
            ${servicesHtml}
            ${formattedDate} às ${appointment.time}<br>
            <br>
            <strong>Seus dados:</strong><br>
            ${appointment.clientName}<br>
            ${appointment.phone}<br>
            ${appointment.email}
        `;
        
        modal.style.display = 'block';
    }

    // Formatar data
    formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Configurar smooth scroll
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    // Menu hambúrguer para mobile
    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const navMenu = document.getElementById('navMenu');
        
        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
            
            // Fechar menu ao clicar em um link
            navMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                });
            });
            
            // Fechar menu ao clicar fora dele
            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            });
        }
    }
}

// Função mantida para compatibilidade (não mais utilizada)
function selectService(serviceName, price, duration) {
    if (window.appointmentSystem) {
        appointmentSystem.selectServiceFromCard(serviceName);
    }
}

// Fechar modal
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Event listeners para o modal
window.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('successModal');
    const closeBtn = document.querySelector('.close');
    
    // Fechar ao clicar no X
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Fechar ao clicar fora do modal
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});

// Animações de entrada
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observar elementos para animação
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.service-card, .booking-form-container');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
});

// Adicionar métodos para gerenciar agendamentos na página principal
AppointmentSystem.prototype.displayAppointments = function() {
    const appointmentsList = document.getElementById('appointmentsList');
    const noAppointments = document.getElementById('noAppointments');
    
    if (!appointmentsList || !noAppointments) return;

    // Filtrar apenas agendamentos principais (não slots de bloqueio)
    const mainAppointments = this.appointments.filter(appointment => !appointment.isBlockSlot);

    if (mainAppointments.length === 0) {
        appointmentsList.style.display = 'none';
        noAppointments.style.display = 'block';
        return;
    }

    appointmentsList.style.display = 'grid';
    noAppointments.style.display = 'none';

    appointmentsList.innerHTML = mainAppointments.map(appointment => `
        <div class="appointment-card">
            <div class="appointment-header">
                <div class="appointment-info">
                    <h3>${appointment.name || appointment.clientName || 'Cliente'}</h3>
                    <div class="appointment-status ${appointment.completed ? 'completed' : 'pending'}">
                        ${appointment.completed ? '✅ Concluído' : '⏳ Pendente'}
                    </div>
                </div>
            </div>
            
            <div class="appointment-details">
                <div class="detail-item">
                    <span>📅</span>
                    <span>${this.formatDate(appointment.date)}</span>
                </div>
                <div class="detail-item">
                    <span>🕒</span>
                    <span>${appointment.time}</span>
                </div>
                <div class="detail-item">
                    <span>💅</span>
                    <span>${this.formatServices(appointment)}</span>
                </div>
                <div class="detail-item">
                    <span>⏱️</span>
                    <span>${appointment.totalDuration || appointment.duration || 0} min</span>
                </div>
                <div class="detail-item">
                    <span>💰</span>
                    <span>R$ ${(appointment.totalPrice || appointment.price || 0).toFixed(2)}</span>
                </div>
                <div class="detail-item">
                    <span>📱</span>
                    <span>${appointment.phone}</span>
                </div>
                ${appointment.email ? `
                <div class="detail-item">
                    <span>📧</span>
                    <span>${appointment.email}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="appointment-actions">
                ${!appointment.completed ? `
                    <button class="btn-complete" onclick="completeAppointment('${appointment.id}')">
                        ✅ Marcar como Concluído
                    </button>
                    <button class="btn-delete" onclick="deleteAppointment('${appointment.id}')">
                        🗑️ Cancelar Agendamento
                    </button>
                ` : `
                    <div style="text-align: center; color: #4CAF50; font-weight: 500; padding: 1rem;">
                        ✅ Serviço Concluído
                    </div>
                `}
            </div>
        </div>
    `).join('');
    
};

AppointmentSystem.prototype.formatDate = function(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

AppointmentSystem.prototype.formatServices = function(appointment) {
    // Se services é um array de objetos
    if (appointment.services && Array.isArray(appointment.services)) {
        return appointment.services.map(service => {
            if (typeof service === 'object' && service.name) {
                return service.name;
            }
            return service;
        }).join(', ');
    }
    
    // Se tem service (string)
    if (appointment.service) {
        return appointment.service;
    }
    
    return 'Serviço não especificado';
};

AppointmentSystem.prototype.completeAppointment = function(id) {
    const appointment = this.appointments.find(apt => apt.id == id);
    
    if (!appointment) return;

    const clientName = appointment.name || appointment.clientName || 'Cliente';
    
    if (confirm(`Confirmar que o serviço para ${clientName} foi concluído?`)) {
        appointment.completed = true;
        appointment.completedAt = new Date().toISOString();
        this.saveAppointments();
        this.displayAppointments();
        
        // Mostrar confirmação
        alert(`✅ Agendamento de ${clientName} marcado como concluído!`);
    }
};

AppointmentSystem.prototype.deleteAppointment = function(id) {
    const appointment = this.appointments.find(apt => apt.id == id);
    
    if (!appointment) return;

    const clientName = appointment.name || appointment.clientName || 'Cliente';
    
    if (confirm(`Tem certeza que deseja cancelar o agendamento de ${clientName}?`)) {
        this.appointments = this.appointments.filter(apt => apt.id != id);
        this.saveAppointments();
        this.displayAppointments();
        
        alert(`🗑️ Agendamento de ${clientName} foi cancelado.`);
    }
};

// Variável global para o sistema de agendamento
let appointmentSystem;

// Funções globais para os botões funcionarem
function completeAppointment(id) {
    if (appointmentSystem) {
        appointmentSystem.completeAppointment(id);
    }
}

function deleteAppointment(id) {
    if (appointmentSystem) {
        appointmentSystem.deleteAppointment(id);
    }
}

// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    appointmentSystem = new AppointmentSystem();
    
    // Garantir que os agendamentos sejam exibidos após carregamento completo
    setTimeout(() => {
        appointmentSystem.displayAppointments();
    }, 100);
});
