const DATA_URL = "data.json"; 
let allPromotionsData = []; 
let currentPromoEvents = []; 
let currentStartDate = new Date(); 

// --- UTILS ---

function getStartOfWeek(d) {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; 
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0); 
    return date;
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// --- LOGIQUE PRINCIPALE ---

async function loadFullSchedule() {
    try {
        const statusElement = document.getElementById('loading-status');
        statusElement.textContent = "Lecture du fichier de données IUT Valence...";

        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`Fichier ${DATA_URL} introuvable ou vide. L'action GitHub doit être lancée.`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Erreur Back-end: ${data.error}`);
        }

        // Stocker TOUTES les données des promotions
        allPromotionsData = data.promotions;
        
        // Afficher la date de dernière mise à jour
        const updateDate = new Date(data.last_updated);
        document.getElementById('last-update').textContent = updateDate.toLocaleString('fr-FR');
        statusElement.style.display = 'none';

        // Remplir le sélecteur
        populatePromoSelector(allPromotionsData);

        // Charger l'EDT de la première promotion par défaut
        if (allPromotionsData.length > 0) {
            currentPromoEvents = allPromotionsData[0].events;
            updateScheduleDisplay();
        }
        
    } catch (error) {
        console.error("Erreur de chargement de l'EDT:", error);
        document.getElementById('loading-status').textContent = `Erreur: Impossible de charger l'EDT. Vérifiez l'onglet GitHub Actions. (${error.message})`;
        document.getElementById('loading-status').classList.add('error');
    }
}

function populatePromoSelector(promos) {
    const selector = document.getElementById('promo-selector');
    selector.innerHTML = ''; // Vider les options existantes
    
    promos.forEach((promo, index) => {
        const option = document.createElement('option');
        option.value = index; 
        option.textContent = promo.nom;
        selector.appendChild(option);
    });

    selector.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        currentPromoEvents = allPromotionsData[selectedIndex].events;
        currentStartDate = getStartOfWeek(new Date()); // Réinitialiser à la semaine courante lors du changement de promo
        updateScheduleDisplay(); 
    });
}

function updateScheduleDisplay() {
    const container = document.getElementById('schedule-container');
    const startOfWeek = getStartOfWeek(currentStartDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    document.getElementById('current-week-title').textContent = 
        `Semaine du ${formatDate(startOfWeek)}`;

    const weeklyEvents = currentPromoEvents.filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= startOfWeek && eventStart < endOfWeek;
    });

    // ... (Code d'affichage HTML par jour, identique à la version précédente) ...
    if (weeklyEvents.length === 0) {
        container.innerHTML = `<p class="no-events">🎉 Pas de cours prévus cette semaine.</p>`;
        return;
    }

    const days = {};
    weeklyEvents.forEach(event => {
        const dateKey = formatDate(event.start);
        if (!days[dateKey]) {
            days[dateKey] = [];
        }
        days[dateKey].push(event);
    });

    let htmlContent = '';
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    Object.keys(days).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))).forEach(dateKey => {
        const dayDate = new Date(dateKey.split('/').reverse().join('-'));
        const dayIndex = (dayDate.getDay() + 6) % 7; 

        htmlContent += `<div class="day-schedule">`;
        htmlContent += `<h3>${dayNames[dayIndex]} ${dateKey}</h3>`;
        
        days[dateKey].forEach(event => {
            const startTime = new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            htmlContent += `
                <div class="event-card">
                    <p class="time">${startTime} - ${endTime}</p>
                    <p class="summary"><strong>${event.summary}</strong></p>
                    <p class="location">${event.location}</p>
                </div>`;
        });
        htmlContent += `</div>`;
    });

    container.innerHTML = htmlContent;
}

// --- NAVIGATION ---
document.getElementById('prev-week').addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() - 7);
    updateScheduleDisplay();
});

document.getElementById('next-week').addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() + 7);
    updateScheduleDisplay();
});

// Lancement
loadFullSchedule();