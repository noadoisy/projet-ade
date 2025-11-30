import requests
from icalendar import Calendar
from datetime import datetime
import json
import os

# REMPLACEZ par l'URL ICS de votre groupe/promotion IUT Valence
ICS_URL = "VOTRE_LIEN_ICS_ADE_VALENCE_ICI"
OUTPUT_FILE = "data.json"

def fetch_and_parse_ics():
    """Récupère l'ICS et retourne la liste des événements structurés."""
    print("Début du téléchargement de l'ICS...")
    try:
        response = requests.get(ICS_URL)
        response.raise_for_status() 
        cal = Calendar.from_ical(response.content)
        
        events = []
        for component in cal.walk():
            if component.name == "VEVENT":
                # Convertit les objets datetime en chaînes standard ISO 8601
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

    except requests.exceptions.RequestException as e:
        print(f"Erreur de connexion/téléchargement: {e}")
        return {"error": f"Erreur de connexion/téléchargement: {e}"}
    except Exception as e:
        print(f"Erreur d'analyse ICS: {e}")
        return {"error": f"Erreur d'analyse ICS: {e}"}

def generate_json_file():
    """Exécute l'analyse et sauvegarde le résultat dans le fichier JSON."""
    data = fetch_and_parse_ics()
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    
    print(f"Fichier {OUTPUT_FILE} généré avec succès.")

if __name__ == '__main__':
    generate_json_file()