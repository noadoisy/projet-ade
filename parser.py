import requests
from icalendar import Calendar
from datetime import datetime
import json
import xml.etree.ElementTree as ET

# --- PARAMÈTRES ADE DÉDUITS DU SITE EXISTANT ---
API_URL = "https://api.ade-edt.fr" 
BASE_URL = API_URL  
PROJECT_ID = "1"
# Ceci est la clé déduite du site UGA/ADE pour identifier les données
PROJECT_DATA = "51278da58f6a6c7ad5fcd549aa2f4a9cd0fdf1bdade3448b5e9400c4e4311a3aaf5892c4f26a6a95b2be9815c8d857a2533823d5748e25e65116564f1a3e9953bfee61b8973d94f85031bb73a57c6000da7dc82411a94d7de68c82ab46db4fa8,1"
ICS_BASE_URL = "https://intranet.iut-valence.fr/ICS_ADE/"
# -----------------------------------------------

OUTPUT_FILE = "data.json"
# Filtre pour s'assurer de ne récupérer que les promotions de l'IUT Valence
IUT_VALENCE_PATH_FILTER = "CAMPUS Valence.VALENCE-IUT Valence" 

def fetch_ics_data(code):
    """Récupère l'EDT au format iCalendar pour un code XXX donné."""
    full_url = f"{ICS_BASE_URL}{code}.ics"
    try:
        response = requests.get(full_url, timeout=10)
        response.raise_for_status() 
        
        # Vérification si le fichier est vide ou n'est pas un calendrier valide
        if not response.content.strip():
             return None # Ignorer les fichiers vides

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
        return events
    except Exception as e:
        print(f"Erreur (Code {code}): {e}")
        return None

def fetch_and_generate_schedule():
    """Récupère la liste des codes ADE, puis télécharge chaque EDT."""
    # 1. Récupérer la liste complète des ressources (XML)
    print("Étape 1 : Récupération de la liste complète des ressources ADE...")
    resources_url = f"{BASE_URL}?function=getResources&tree=true&detail=3&projectId={PROJECT_ID}&data={PROJECT_DATA}"
    try:
        response = requests.get(resources_url, timeout=30)
        response.raise_for_status()
        xml_data = response.text
    except Exception as e:
        return {"error": f"Erreur de connexion à l'API ADE: {e}"}

    # 2. Analyser le XML et filtrer uniquement l'IUT Valence
    print("Étape 2 : Filtrage des ressources de l'IUT Valence...")
    try:
        root = ET.fromstring(xml_data)
        all_iut_valence_resources = []
        
        for leaf in root.findall(".//leaf"):
            path = leaf.attrib.get('path', '')
            # L'ID est le code XXX dans l'URL ICS
            resource_id = leaf.attrib.get('id')
            if path.startswith(IUT_VALENCE_PATH_FILTER) and resource_id:
                all_iut_valence_resources.append({
                    "id": resource_id,
                    "nom": leaf.attrib.get('name')
                })
    except Exception as e:
        return {"error": f"Erreur d'analyse du XML : {e}"}

    # 3. Télécharger et consolider tous les EDT IUT Valence
    print(f"Étape 3 : Téléchargement et consolidation de {len(all_iut_valence_resources)} EDT...")
    
    full_schedule_data = {
        "promotions": [],
        "last_updated": datetime.now().isoformat()
    }
    
    for resource in all_iut_valence_resources:
        events = fetch_ics_data(resource['id'])
        
        if events is not None and events: 
            full_schedule_data['promotions'].append({
                "id": resource['id'],
                "nom": resource['nom'],
                "events": events
            })
            print(f"  -> {resource['nom']} OK.")

    # 4. Sauvegarder le fichier JSON final
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        # 'ensure_ascii=False' permet d'avoir les accents correctement dans le JSON
        json.dump(full_schedule_data, f, ensure_ascii=False, indent=4)
        
    print(f"Succès ! Fichier '{OUTPUT_FILE}' généré pour {len(full_schedule_data['promotions'])} promotions valides.")
    return full_schedule_data

if __name__ == '__main__':
    result = fetch_and_generate_schedule()
    if "error" in result:
        print(f"Échec critique: {result['error']}")