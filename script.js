// Sistema de Agendamento com Firebase
class FirebaseAppointmentSystem {
    constructor() {
        this.services = [
            { id: 1, name: 'Manicure Básica', icon: '💅', price: 35, duration: 45, description: 'Manicure tradicional com esmaltação' },
            { id: 2, name: 'Manicure com Gel', icon: '✨', price: 65, duration: 60, description: 'Unha em gel com acabamento profissional e duradouro' },
            { id: 3, name: 'Pedicure', icon: '🦶', price: 40, duration: 60, description: 'Cuidados completos para os pés com hidratação' },
            { id: 4, name: 'Mão e Pé', icon: '💎', price: 70, duration: 90, description: 'Pacote completo com manicure e pedicure' },
            { id: 5, name: 'Alongamento de Unhas', icon: '🎨', price: 120, duration: 120, description: 'Alongamento em gel ou fibra de vidro' },
            { id: 6, name: 'Nail Art', icon: '🌸', price: 50, duration: 45, description: 'Decoração personalizada e criativa' }
        ];
        
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
        
        this.appointments = [];
        this.init();
    }

    async init() {
        // Aguardar Firebase carregar
        await this.waitForFirebase();
        
        // Carregar dados do Firebase
        await this.loadServicesFromFirebase();
        await this.loadAvailableHoursFromFirebase();
        await this.loadAvailableDaysFromFirebase();
        await this.loadAppointmentsFromFirebase();
        
        // Configurar listeners em tempo real
        this.setupRealtimeListeners();
        
        // Inicializar interface
        this.initializeInterface();
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

    async loadServicesFromFirebase() {
        try {
            const querySnapshot = await window.firestore.getDocs(window.firestore.collection(window.db, 'services'));
            if (!querySnapshot.empty) {
                this.services = [];
                querySnapshot.forEach((doc) => {
                    this.services.push({ id: doc.id, ...doc.data() });
                });
            }
        } catch (error) {
            console.log('Usando serviços padrão:', error);
        }
    }
    
    async loadAvailableHoursFromFirebase() {
        try {
            const docSnap = await window.firestore.doc(window.db, 'settings', 'availableHours').get();
            if (docSnap.exists) {
                this.availableHours = docSnap.data().hours;
            }
        } catch (error) {
            console.log('Usando horários padrão:', error);
        }
    }
    
    async loadAvailableDaysFromFirebase() {
        try {
            const docSnap = await window.firestore.doc(window.db, 'settings', 'availableDays').get();
            if (docSnap.exists) {
                this.availableDays = docSnap.data().days;
            }
        } catch (error) {
            console.log('Usando dias padrão:', error);
        }
    }
    
    async loadAppointmentsFromFirebase() {
        try {
            const querySnapshot = await window.firestore.getDocs(window.firestore.collection(window.db, 'appointments'));
            this.appointments = [];
            querySnapshot.forEach((doc) => {
                this.appointments.push({ id: doc.id, ...doc.data() });
            });
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
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
            
            // Atualizar interface
            this.updateAvailableHours(document.getElementById('appointmentDate')?.value || '', 0);
            this.displayAppointments();
        });
    }
    
    initializeInterface() {
        // Formatação de telefone
        document.getElementById('clientPhone')?.addEventListener('input', (e) => {
            this.formatPhone(e);
            // Atualizar lista de agendamentos quando telefone mudar
            setTimeout(() => this.displayAppointments(), 100);
        });
        
        // Atualizar lista de agendamentos quando nome mudar
        document.getElementById('clientName')?.addEventListener('input', (e) => {
            // Atualizar lista de agendamentos quando nome mudar
            setTimeout(() => this.displayAppointments(), 100);
        });
        
        // Listener para mudança de data
        document.getElementById('appointmentDate')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.service-checkbox:checked');
            let totalDuration = 0;
            checkboxes.forEach(cb => totalDuration += parseInt(cb.dataset.duration));
            this.updateAvailableHours(e.target.value, totalDuration);
        });
        
        // Listener para mudança de serviços
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('service-checkbox')) {
                this.updateServiceSummary();
                const dateInput = document.getElementById('appointmentDate');
                if (dateInput?.value) {
                    const checkboxes = document.querySelectorAll('.service-checkbox:checked');
                    let totalDuration = 0;
                    checkboxes.forEach(cb => totalDuration += parseInt(cb.dataset.duration));
                    this.updateAvailableHours(dateInput.value, totalDuration);
                }
            }
        });

        // Submit do formulário
        document.getElementById('bookingForm')?.addEventListener('submit', (e) => {
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
        
        // Renderizar serviços e agendamentos
        this.renderServicesCheckboxes();
        this.updateServiceSummary();
        this.initializeDateInput();
        this.displayAppointments();
    }

    // Formatar telefone automaticamente
    formatPhone(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 11) {
            value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length >= 7) {
                value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length >= 3) {
            value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        }
        e.target.value = value;
    }
    
    // Normalizar telefone para comparação (remover formatação)
    normalizePhone(phone) {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    }
    
    // Renderizar checkboxes de serviços
    renderServicesCheckboxes() {
        const container = document.getElementById('servicesContainer');
        if (!container) {
            console.error('Container servicesContainer não encontrado');
            return;
        }
        
        
        container.innerHTML = this.services.map(service => `
            <div class="service-card" data-service-id="${service.id}">
                <div class="service-icon">${service.icon}</div>
                <h3>${service.name}</h3>
                <p>${service.description}</p>
                <div class="service-price">R$ ${service.price.toFixed(2)}</div>
                <div class="service-duration">${service.duration} minutos</div>
                
                <div class="service-selection">
                    <input type="checkbox" class="service-checkbox" id="service-${service.id}" 
                           value="${service.name}" data-price="${service.price}" data-duration="${service.duration}">
                    <label for="service-${service.id}" class="service-btn service-btn-select">
                        <span class="checkbox-icon">☐</span>
                        <span class="btn-text">Selecionar</span>
                    </label>
                </div>
            </div>
        `).join('');
        
        // Configurar event listeners para os checkboxes
        this.setupServiceCheckboxes();
    }
    
    // Configurar event listeners para os checkboxes de serviços
    setupServiceCheckboxes() {
        const checkboxes = document.querySelectorAll('.service-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateServiceSummary();
                this.updateCheckboxVisual(checkbox);
            });
        });
    }
    
    // Atualizar visual do checkbox
    updateCheckboxVisual(checkbox) {
        const label = checkbox.nextElementSibling;
        const icon = label.querySelector('.checkbox-icon');
        const btnText = label.querySelector('.btn-text');
        
        if (checkbox.checked) {
            icon.textContent = '☑';
            btnText.textContent = 'Selecionado';
            label.style.background = '#26d065';
            label.style.color = 'white';
        } else {
            icon.textContent = '☐';
            btnText.textContent = 'Selecionar';
            label.style.background = 'var(--primary-color)';
            label.style.color = 'var(--dark-bg)';
        }
    }
    
    // Atualizar resumo de serviços
    updateServiceSummary() {
        const summaryContainer = document.getElementById('serviceSummary');
        if (!summaryContainer) return;
        
        const checkboxes = document.querySelectorAll('.service-checkbox:checked');
        
        if (checkboxes.length === 0) {
            summaryContainer.innerHTML = '<p style="color: #ccc; text-align: center;">Nenhum serviço selecionado</p>';
            return;
        }
        
        let totalPrice = 0;
        let totalDuration = 0;
        let servicesHtml = '';
        
        checkboxes.forEach(checkbox => {
            const price = parseFloat(checkbox.dataset.price);
            const duration = parseInt(checkbox.dataset.duration);
            totalPrice += price;
            totalDuration += duration;
            
            servicesHtml += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #444;">
                    <span style="color: var(--white);">${checkbox.value}</span>
                    <span style="color: var(--primary-color); font-weight: 600;">R$ ${price.toFixed(2)}</span>
            </div>
        `;
        });
        
        summaryContainer.innerHTML = `
            <div id="summaryContent" style="color: var(--white);">
                <h4 style="color: var(--primary-color); margin-bottom: 1rem; text-align: center;">Resumo dos Serviços</h4>
                ${servicesHtml}
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-top: 2px solid var(--primary-color); margin-top: 1rem;">
                    <strong style="color: var(--white);">Total:</strong>
                    <strong style="color: var(--primary-color); font-size: 1.2rem;">R$ ${totalPrice.toFixed(2)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0;">
                    <span style="color: var(--white);">Duração:</span>
                    <span style="color: var(--primary-color); font-weight: 600;">${totalDuration} minutos</span>
                </div>
            </div>
        `;
    }
    
    // Atualizar horários disponíveis quando a data muda
    updateAvailableHours(selectedDate, totalDuration) {
        const timeSelect = document.getElementById('appointmentTime');
        if (!timeSelect) return;
        
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
        
        // Calcular quantos slots de horário são necessários
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
            }
        }
        
        // Verificar se algum desses horários já está ocupado
        return !hoursToCheck.some(hour => {
            return this.appointments.some(appointment => 
                appointment.date === date && 
                appointment.time === hour && 
                !appointment.completed
            );
        });
    }
    
    // Inicializar campo de data
    initializeDateInput() {
        const dateInput = document.getElementById('appointmentDate');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
            this.updateAvailableHours(today, 0);
        }
    }
    
    // Configurar dias disponíveis no campo de data
    setupAvailableDays() {
        const dateInput = document.getElementById('appointmentDate');
        const availableDays = this.availableDays;
        
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

    // Submeter agendamento
    async submitAppointment() {
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

        // Criar agendamento
        const appointmentData = {
            name: clientName,
            clientName,
            phone,
            email,
            services: selectedServices,
            service: selectedServices.map(s => s.name).join(' + '),
            date,
            time,
            totalPrice,
            price: totalPrice,
            totalDuration,
            duration: totalDuration,
            slotsNeeded,
            completed: false,
            createdAt: new Date().toISOString()
        };

        try {
            // Salvar no Firebase
            await window.firestore.addDoc(window.firestore.collection(window.db, 'appointments'), appointmentData);

        // Criar registros de bloqueio para cada slot de horário necessário
            for (let i = 1; i < slotsNeeded; i++) {
            const hourIndex = startIndex + i;
            if (hourIndex < this.availableHours.length) {
                const slotTime = this.availableHours[hourIndex];
                
                    const blockSlotData = {
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
                        createdAt: new Date().toISOString()
                    };
                    
                    await window.firestore.addDoc(window.firestore.collection(window.db, 'appointments'), blockSlotData);
                }
            }
            
            // Mostrar modal de sucesso
            this.showSuccessModal(appointmentData);

        // Limpar formulário
        document.getElementById('bookingForm').reset();
        this.updateServiceSummary();
        
        // Reinicializar data para hoje
        this.initializeDateInput();
            
        } catch (error) {
            console.error('Erro ao salvar agendamento:', error);
            alert('Erro ao salvar agendamento. Tente novamente.');
        }
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
            ${appointment.name}<br>
            ${appointment.phone}<br>
            ${appointment.email || 'E-mail não fornecido'}<br>
            <br>
            <strong>Status:</strong> ⏳ Pendente<br>
            <br>
            <em>Você receberá uma confirmação em breve!</em>
        `;
        
        modal.style.display = 'block';
        
        // Fechar modal após 5 segundos
        setTimeout(() => {
            modal.style.display = 'none';
        }, 5000);
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
    
    // Exibir agendamentos
    displayAppointments() {
        const appointmentsList = document.getElementById('appointmentsList');
        const noAppointments = document.getElementById('noAppointments');
        
        if (!appointmentsList || !noAppointments) return;

        // Obter telefone do cliente atual do formulário
        const currentClientPhone = document.getElementById('clientPhone')?.value?.trim() || '';
        const currentClientName = document.getElementById('clientName')?.value?.trim() || '';
        
        // Filtrar apenas agendamentos principais (não slots de bloqueio) e do cliente atual
        const mainAppointments = this.appointments.filter(appointment => {
            if (appointment.isBlockSlot) return false;
            
            // Se há telefone no formulário, filtrar por telefone
            if (currentClientPhone) {
                const appointmentPhone = appointment.phone || '';
                return this.normalizePhone(appointmentPhone) === this.normalizePhone(currentClientPhone);
            }
            
            // Se há nome no formulário, filtrar por nome (fallback)
            if (currentClientName) {
                const appointmentName = appointment.name || appointment.clientName || '';
                return appointmentName.toLowerCase().trim() === currentClientName.toLowerCase().trim();
            }
            
            // Se não há dados no formulário, não mostrar nenhum agendamento
            return false;
        });

        if (mainAppointments.length === 0) {
            appointmentsList.style.display = 'none';
            noAppointments.style.display = 'block';
            
            // Atualizar mensagem baseada se há dados no formulário
            if (currentClientPhone || currentClientName) {
                noAppointments.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #ccc;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                        <p style="font-size: 1.2rem; margin: 0;">Nenhum agendamento encontrado</p>
                        <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Para ${currentClientName || 'este telefone'}</p>
                    </div>
                `;
            } else {
                noAppointments.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #ccc;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">👤</div>
                        <p style="font-size: 1.2rem; margin: 0;">Digite seus dados para ver seus agendamentos</p>
                        <p style="font-size: 0.9rem; margin: 0.5rem 0 0 0;">Seus agendamentos são privados e só você pode vê-los</p>
                    </div>
                `;
            }
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
    }
    
    // Formatar serviços
    formatServices(appointment) {
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
    
    // Deletar agendamento
    async deleteAppointment(id) {
        const appointment = this.appointments.find(apt => apt.id === id);
        if (appointment) {
            const confirmMessage = `Tem certeza que deseja cancelar o agendamento de ${appointment.name || appointment.clientName}?\n\n` +
                                 `📅 Data: ${this.formatDate(appointment.date)}\n` +
                                 `🕒 Horário: ${appointment.time}\n` +
                                 `💅 Serviço: ${this.formatServices(appointment)}\n\n` +
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
                    
                    alert(`✅ Agendamento de ${appointment.name || appointment.clientName} foi cancelado com sucesso!`);
                } catch (error) {
                    console.error('Erro ao cancelar agendamento:', error);
                    alert('Erro ao cancelar agendamento. Tente novamente.');
                }
            }
        }
    }
}

// Funções globais para os botões funcionarem
function completeAppointment(id) {
    if (window.appointmentSystem) {
        appointmentSystem.completeAppointment(id);
    }
}

function deleteAppointment(id) {
    if (window.appointmentSystem) {
        appointmentSystem.deleteAppointment(id);
    }
}

// Funções para gerenciar serviços





// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.appointmentSystem = new FirebaseAppointmentSystem();
});