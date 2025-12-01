const DATA_URL = "data.json"; 
let allPromotionsData = []; 
let currentPromoEvents = []; 
// Commence par la date d'aujourd'hui
let currentStartDate = new Date(); 

// --- UTILS ---

function getStartOfWeek(d) {
    const date = new Date(d);
    // Le lundi est le jour 0 pour nous ((date.getDay() + 6) % 7)
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
            // C'est l'erreur que vous voyez actuellement
            throw new Error(`Fichier data.json introuvable ou vide. L'action GitHub doit être lancée.`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Erreur Back-end: ${data.error}`);
        }

        allPromotionsData = data.promotions;
        
        // Afficher la date de dernière mise à jour
        const updateDate = new Date(data.last_updated);
        document.getElementById('last-update').textContent = updateDate.toLocaleString('fr-FR');
        statusElement.style.display = 'none';

        // Remplir le sélecteur
        populatePromoSelector(allPromotionsData);

        // Charger l'EDT de la première promotion par défaut
        if (allPromotionsData.length > 0) {
            // Sélectionner la première option et définir les événements
            document.getElementById('promo-selector').value = 0;
            currentPromoEvents = allPromotionsData[0].events;
            // Assurer que la semaine affichée est la semaine courante
            currentStartDate = getStartOfWeek(new Date()); 
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
    
    // Événement pour changer l'EDT affiché
    selector.addEventListener('change', (e) => {
        const selectedIndex = parseInt(e.target.value);
        currentPromoEvents = allPromotionsData[selectedIndex].events;
        currentStartDate = getStartOfWeek(new Date()); // Retour à la semaine courante
        updateScheduleDisplay(); 
    });
}

function updateScheduleDisplay() {
    const container = document.getElementById('schedule-container');
    const startOfWeek = getStartOfWeek(currentStartDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7); // La date limite est le dimanche minuit

    // Mise à jour du titre de la semaine
    document.getElementById('current-week-title').textContent = 
        `Semaine du ${formatDate(startOfWeek)}`;

    // Filtrer les événements pour la semaine actuelle
    const weeklyEvents = currentPromoEvents.filter(event => {
        const eventStart = new Date(event.start);
        return eventStart >= startOfWeek && eventStart < endOfWeek;
    });

    if (weeklyEvents.length === 0) {
        container.innerHTML = `<p class="no-events">🎉 Pas de cours prévus cette semaine.</p>`;
        return;
    }

    // Grouper les événements par jour
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

    // Trier les jours
    Object.keys(days).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))).forEach(dateKey => {
        const dayDate = new Date(dateKey.split('/').reverse().join('-'));
        const dayIndex = (dayDate.getDay() + 6) % 7; 

        htmlContent += `<div class="day-schedule">`;
        htmlContent += `<h3>${dayNames[dayIndex]} ${dateKey}</h3>`;
        
        // Trier les événements par heure de début dans la journée
        days[dateKey].sort((a, b) => new Date(a.start) - new Date(b.start)).forEach(event => {
            const startTime = new Date(event.start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(event.end).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            htmlContent += `
                <div class="event-card">
                    <p class="time">${startTime} - ${endTime}</p>
                    <p class="summary"><strong>${event.summary}</strong></p>
                    <p class="location">${event.location || 'Non spécifié'}</p>
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