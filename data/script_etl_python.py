import pandas as pd
import numpy as np

def clean_producers_data(file_path, output_path):
    print("Iniciando auditoría y limpieza de datos (CRISP-DM: Data Preparation)...")
    try:
        df = pd.read_excel(file_path)
    except Exception as e:
        print(f"❌ Error al leer el archivo: {e}")
        return

    # 1. CONTRATO DE DATOS: Columnas Obligatorias
    columnas_obligatorias = [
        'codigo_productora', 'cooperativa', 'edad_al_cierre_2025', 
        'area_cafe_reportada', 'quintales_acopiados_2025', 
        'ingreso_principal_pen_2025', 'monto_solicitado_pen', 'actividad_a_financiar'
    ]
    
    faltantes = [col for col in columnas_obligatorias if col not in df.columns]
    if faltantes:
        print(f"🚨 ERROR CRÍTICO: El archivo incumple el contrato. Faltan las columnas: {faltantes}")
        return
    
    # 2. LIMPIEZA: Duplicados
    duplicados = df.duplicated(subset=['codigo_productora']).sum()
    if duplicados > 0:
        print(f"⚠️ ADVERTENCIA: Se encontraron {duplicados} códigos duplicados. Manteniendo el último registro.")
        df = df.drop_duplicates(subset=['codigo_productora'], keep='last')

    # 3. TRANSFORMACIÓN: Estandarización de categorías (Regla de negocio)
    def estandarizar_actividad(act):
        if pd.isna(act): return "NO ESPECIFICADO"
        act = str(act).upper()
        if any(keyword in act for keyword in ['CUY', 'GALLINA', 'CERDO', 'CRIANZA']):
            return "CRIANZA DE ANIMALES"
        elif any(keyword in act for keyword in ['BODEGA', 'APICULTURA', 'CAFE']):
            return "EMPRENDIMIENTO / OTROS"
        elif 'FERTILIZA' in act:
            return "FERTILIZACIÓN"
        elif 'DIVERSIFICA' in act:
            return "DIVERSIFICACIÓN"
        return act
    
    df['actividad_a_financiar'] = df['actividad_a_financiar'].apply(estandarizar_actividad)

    # 4. IMPUTACIÓN DE NULOS
    df['edad_al_cierre_2025'] = df['edad_al_cierre_2025'].fillna(df['edad_al_cierre_2025'].median())
    
    # Guardar
    df.to_excel(output_path, index=False)
    print(f"✅ Limpieza exitosa. Archivo guardado en: {output_path}")

# Ejecución (Descomentar para usar)
# clean_producers_data('Base_Bruta.xlsx', 'Base_Producers_Direct_Optimizada_App_vFinal.xlsx')