// L'URL est locale, ce qui est très rapide !
const DATA_URL = "data.json"; 

let fullSchedule = [];
let lastUpdated = '';
let currentStartDate = new Date(); 

// --- UTILS (Même logique que précédemment) ---

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
        statusElement.textContent = "Lecture du fichier d'EDT...";

        // Récupération du fichier JSON généré
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            throw new Error(`Erreur: Fichier ${DATA_URL} introuvable ou vide. L'action GitHub n'a peut-être pas encore tourné.`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Erreur dans les données : ${data.error}`);
        }

        fullSchedule = data.events;
        lastUpdated = data.last_updated;
        
        // Affichage de la date de dernière mise à jour
        const updateDate = new Date(lastUpdated);
        document.getElementById('last-update').textContent = updateDate.toLocaleDateString('fr-FR') + ' à ' + updateDate.toLocaleTimeString('fr-FR');
        statusElement.style.display = 'none';

        updateScheduleDisplay();
        
    } catch (error) {
        console.error("Erreur de chargement de l'EDT:", error);
        document.getElementById('loading-status').textContent = `Erreur: ${error.message}`;
        document.getElementById('loading-status').classList.add('error');
    }
}

// Reste de la fonction updateScheduleDisplay() (identique) et des listeners 
// (identiques) à la version précédente. 
// Copiez-les dans ce fichier 'script.js'.

document.getElementById('prev-week').addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() - 7);
    updateScheduleDisplay();
});

document.getElementById('next-week').addEventListener('click', () => {
    currentStartDate.setDate(currentStartDate.getDate() + 7);
    updateScheduleDisplay();
});

// À la fin du fichier :
loadFullSchedule();