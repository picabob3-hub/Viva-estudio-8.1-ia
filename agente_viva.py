import json
import time
import requests

# ================= CONFIGURACIÓN =================
GEMINI_API_KEY = "AIzaSyAA_cvIDwbt8gVJwAZWEmj88G7EAIo5jZY"

# URLs de tu base de datos de Firebase
FIREBASE_URL_ORDENES = "https://viva-operaciones-default-rtdb.firebaseio.com/ordenes.json"
FIREBASE_URL_BASE = "https://viva-operaciones-default-rtdb.firebaseio.com/ordenes/"

EQUIPO_DISPONIBLE = ["Carlos", "Diego", "Ana"] 
# =================================================

def analizar_orden_con_gemini_http(orden):
    items_texto = ""
    if "datos_cotizacion" in orden and "items" in orden["datos_cotizacion"]:
        for item in orden["datos_cotizacion"]["items"]:
            items_texto += f"- {item.get('nombre', 'Item')} (Cant: {item.get('cantidad', 1)})\n"
    
    cliente = orden.get("datos_cotizacion", {}).get("cliente", {}).get("nombre", "Cliente General")

    prompt = f"""
    Eres el Agente Inteligente de producción para 'Viva Estudio Creativo'. 
    Analiza la siguiente orden de trabajo:
    - Cliente: {cliente}
    - Ítems a producir:
    {items_texto}

    Equipo de trabajo disponible: {", ".join(EQUIPO_DISPONIBLE)}.

    Tu tarea es devolver EXCLUSIVAMENTE un objeto JSON válido (sin formato markdown extra, ni bloques de código ```json) con la siguiente estructura exacta:
    {{
      "responsable_sugerido": "Nombre de uno de los miembros del equipo disponible",
      "checklist_ia": [
        "Paso 1 técnico y específico para este tipo de producto",
        "Paso 2 técnico de control de calidad o producción",
        "Paso 3 de acabado o entrega"
      ]
    }}
    """

    url = f"[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=){GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    }

    try:
        response = requests.post(url, headers=headers, json=body)
        if response.status_code == 200:
            data = response.json()
            texto_respuesta = data["candidates"][0]["content"]["parts"][0]["text"].strip()
            
            if texto_respuesta.startswith("```json"):
                texto_respuesta = texto_respuesta[7:]
            if texto_respuesta.startswith("```"):
                texto_respuesta = texto_respuesta[3:]
            if texto_respuesta.endswith("```"):
                texto_respuesta = texto_respuesta[:-3]
                
            return json.loads(texto_respuesta.strip())
        else:
            print(f"⚠️ Error HTTP de Gemini: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"⚠️ Error al procesar con la API de Gemini: {e}")
        return None

def verificar_y_actualizar_ordenes():
    print("🔍 Monitoreando Firebase en busca de órdenes nuevas con Gemini (Modo HTTP)...")
    try:
        respuesta = requests.get(FIREBASE_URL_ORDENES)
        if respuesta.status_code == 200:
            datos = respuesta.json()
            if datos:
                for orden_id, orden in datos.items():
                    checklist_actual = orden.get("checklist_ia", [])
                    responsable_actual = orden.get("responsable", "Sin Asignar")
                    
                    if not checklist_actual or len(checklist_actual) <= 2 or responsable_actual == "Sin Asignar":
                        print(f"🚀 Procesando orden #{orden.get('proforma_ref', orden_id)}...")
                        
                        analisis = analizar_orden_con_gemini_http(orden)
                        
                        if analisis:
                            nuevo_checklist = analisis.get("checklist_ia", [])
                            sugerencia_resp = analisis.get("responsable_sugerido", "Carlos")
                            
                            payload = {
                                "checklist_ia": nuevo_checklist
                            }
                            if responsable_actual == "Sin Asignar" and sugerencia_resp in EQUIPO_DISPONIBLE:
                                payload["responsable"] = sugerencia_resp
                                print(f"🤖 Gemini asignó automáticamente la orden a: {sugerencia_resp}")

                            patch_url = f"{FIREBASE_URL_BASE}{orden_id}.json"
                            res_patch = requests.patch(patch_url, json=payload)
                            
                            if res_patch.status_code == 200:
                                print(f"✅ Orden {orden_id} actualizada correctamente en Firebase.")
                            else:
                                print(f"❌ Error al guardar en Firebase: {res_patch.text}")
        else:
            print(f"⚠️ No se pudo conectar a Firebase. Código: {respuesta.status_code}")
    except Exception as e:
        print(f"⚠️ Error de conexión: {e}")

if __name__ == "__main__":
    print("🤖 Iniciando Agente IA (Gemini HTTP) para Viva Monitor...")
    while True:
        verificar_y_actualizar_ordenes()
        time.sleep(30)