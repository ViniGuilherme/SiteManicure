// Sistema de Agendamento - Interface do Cliente
class AppointmentSystem {
    constructor() {
        this.appointments = this.loadAppointments();
        this.availableHours = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
        this.servicesPrices = {
            'Manicure Básica': { price: 35, duration: 45 },
            'Manicure com Gel': { price: 65, duration: 60 },
            'Pedicure': { price: 40, duration: 60 },
            'Mão e Pé': { price: 70, duration: 90 },
            'Alongamento de Unhas': { price: 120, duration: 120 },
            'Nail Art': { price: 50, duration: 45 }
        };
        this.init();
    }

    init() {
        this.initializeDateInput();
        this.setupEventListeners();
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
        this.updateAvailableHours(today);
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formatação automática do telefone
        document.getElementById('clientPhone').addEventListener('input', this.formatPhone);

        // Atualizar horários quando a data mudar
        document.getElementById('appointmentDate').addEventListener('change', (e) => {
            this.updateAvailableHours(e.target.value);
        });

        // Submit do formulário
        document.getElementById('bookingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitAppointment();
        });

        // Smooth scroll para navegação
        this.setupSmoothScroll();
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
    updateAvailableHours(selectedDate) {
        const timeSelect = document.getElementById('appointmentTime');
        
        // Limpar opções existentes
        timeSelect.innerHTML = '<option value="">Selecione um horário</option>';
        
        // Filtrar horários já ocupados
        const occupiedHours = this.appointments
            .filter(apt => apt.date === selectedDate && !apt.completed)
            .map(apt => apt.time);
        
        // Adicionar apenas horários disponíveis
        this.availableHours.forEach(hour => {
            // Só adiciona se NÃO estiver ocupado
            if (!occupiedHours.includes(hour)) {
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
            option.textContent = 'Nenhum horário disponível nesta data';
            option.disabled = true;
            option.style.color = '#999';
            timeSelect.appendChild(option);
        }
    }

    // Verificar se horário está disponível
    isTimeAvailable(date, time) {
        return !this.appointments.some(apt => 
            apt.date === date && apt.time === time && !apt.completed
        );
    }

    // Submeter agendamento
    submitAppointment() {
        const formData = {
            clientName: document.getElementById('clientName').value.trim(),
            phone: document.getElementById('clientPhone').value.trim(),
            email: document.getElementById('clientEmail').value.trim(),
            service: document.getElementById('serviceSelect').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value
        };

        // Validações
        if (!formData.clientName) {
            alert('Por favor, digite seu nome completo.');
            return;
        }

        if (!formData.phone) {
            alert('Por favor, digite seu telefone.');
            return;
        }

        if (!formData.email) {
            alert('Por favor, digite seu e-mail.');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Por favor, digite um e-mail válido.');
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

        // Verificar disponibilidade novamente
        if (!this.isTimeAvailable(formData.date, formData.time)) {
            alert('Este horário não está mais disponível. Por favor, selecione outro horário.');
            this.updateAvailableHours(formData.date);
            return;
        }

        // Adicionar informações do serviço
        const serviceInfo = this.servicesPrices[formData.service];
        formData.price = serviceInfo.price;
        formData.duration = serviceInfo.duration;

        // Criar agendamento
        const appointment = {
            id: Date.now(),
            ...formData,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.appointments.push(appointment);
        this.saveAppointments();

        // Mostrar confirmação
        this.showSuccessModal(appointment);

        // Limpar formulário
        document.getElementById('bookingForm').reset();
        
        // Reinicializar data para hoje
        this.initializeDateInput();
    }

    // Mostrar modal de sucesso
    showSuccessModal(appointment) {
        const modal = document.getElementById('successModal');
        const modalDetails = document.getElementById('modalDetails');
        
        const formattedDate = this.formatDate(appointment.date);
        
        modalDetails.innerHTML = `
            <strong>${appointment.service}</strong><br>
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
}

// Função global para selecionar serviço
function selectService(serviceName, price, duration) {
    const serviceSelect = document.getElementById('serviceSelect');
    serviceSelect.value = serviceName;
    
    // Scroll suave para o formulário
    document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
    
    // Destacar o formulário
    const bookingForm = document.querySelector('.booking-form-container');
    bookingForm.style.animation = 'none';
    setTimeout(() => {
        bookingForm.style.animation = 'fadeIn 0.5s ease';
    }, 10);
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

// Inicializar sistema
const appointmentSystem = new AppointmentSystem();

console.log('Sistema de Agendamento iniciado!');
console.log(`Total de agendamentos: ${appointmentSystem.appointments.length}`);
