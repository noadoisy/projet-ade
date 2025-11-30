import requests
from icalendar import Calendar
from datetime import datetime
import json
import os

# --- VOS PARAMÈTRES ---
ICS_CODE = "73774" # Votre identifiant spécifique
BASE_URL = "https://intranet.iut-valence.fr/ICS_ADE/"
# ----------------------

OUTPUT_FILE = "data.json"

def fetch_and_parse_ics():
    """Récupère l'ICS de votre promotion et retourne la liste des événements."""
    full_url = f"{BASE_URL}{ICS_CODE}.ics"
    print(f"Début du téléchargement depuis {full_url}...")
    try:
        response = requests.get(full_url, timeout=10)
        response.raise_for_status() 
        cal = Calendar.from_ical(response.content)
        
        events = []
        for component in cal.walk():
            if component.name == "VEVENT":
                start_dt = component.get('dtstart').dt
                end_dt = component.get('dtend').dt
                
                events.append({
                    "summary": str(component.get('summary')),
                    "location": str(component.get('location')),
                    "start": start_dt.isoformat(),
                    "end": end_dt.isoformat(),
                })
        
        events.sort(key=lambda x: x['start'])
        print(f"Analyse terminée. {len(events)} événements trouvés.")
        return {"events": events, "last_updated": datetime.now().isoformat()}

    except requests.exceptions.HTTPError as e:
        return {"error": f"Lien {ICS_CODE} non trouvé (Erreur HTTP {e.response.status_code})."}
    except Exception as e:
        return {"error": f"Erreur critique lors de l'analyse : {e}"}

def generate_json_file():
    """Exécute l'analyse et sauvegarde le résultat dans le fichier JSON."""
    data = fetch_and_parse_ics()
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"Fichier {OUTPUT_FILE} généré avec succès.")

if __name__ == '__main_':
    generate_json_file()