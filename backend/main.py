from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import os
import pandas as pd
import gc  # Garbage Collector (Fundamental para liberar memória)

# 1. Configuração Inicial
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configura Cache (Isso ajuda na velocidade, mas ocupa disco, não RAM)
cache_dir = 'cache'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)
fastf1.Cache.enable_cache(cache_dir)


@app.get("/")
def read_root():
    return {"message": "API de Telemetria F1 Otimizada 🚀"}


@app.get("/api/races/{year}")
def get_races(year: int):
    try:
        schedule = fastf1.get_event_schedule(year)
        races_list = []
        for _, row in schedule.iterrows():
            races_list.append({
                "round": int(row['RoundNumber']),
                "name": str(row['EventName']),
                "date": str(row['EventDate']),
                "location": str(row['Location'])
            })

        # Limpeza
        del schedule
        gc.collect()
        return races_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/drivers/{year}/{race_id}")
def get_drivers(year: int, race_id: int):
    try:
        session = fastf1.get_session(year, race_id, 'R')
        # Carrega APENAS info da sessão, sem voltas ou telemetria pesada
        session.load(telemetry=False, weather=False, messages=False, laps=False)

        drivers_data = []
        for drv in session.drivers:
            info = session.get_driver(drv)
            drivers_data.append({
                "code": str(info['Abbreviation']),
                "team": str(info['TeamName']),
                "number": str(info['DriverNumber'])
            })

        # Libera memória
        del session
        gc.collect()
        return drivers_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/laps/{year}/{race_id}/{driver_code}")
def get_laps(year: int, race_id: int, driver_code: str):
    try:
        session = fastf1.get_session(year, race_id, 'R')
        # Carrega voltas, mas SEM telemetria (que é o mais pesado)
        session.load(telemetry=False, weather=False, messages=False)

        laps = session.laps.pick_drivers(driver_code)
        valid_laps = laps.pick_quicklaps()

        # Pre-calcula volta mais rápida
        fastest_lap = laps.pick_fastest()
        fastest_lap_num = int(fastest_lap['LapNumber']) if not pd.isna(fastest_lap['LapNumber']) else -1

        laps_data = []
        for _, row in valid_laps.iterrows():
            lap_time = str(row['LapTime']).split('days')[-1].strip()
            if lap_time.startswith("00:"):
                lap_time = lap_time[3:]

            lap_num = int(row['LapNumber'])
            laps_data.append({
                "lap_number": lap_num,
                "lap_time": lap_time[:10],
                "is_fastest": bool(lap_num == fastest_lap_num)
            })

        # Limpeza agressiva
        del session, laps, valid_laps
        gc.collect()

        return laps_data
    except Exception as e:
        print(f"Erro laps: {e}")
        return []


@app.get("/api/telemetry/{year}/{race_id}/{driver_code}")
def get_telemetry(year: int, race_id: int, driver_code: str, lap: int = 0):
    try:
        session = fastf1.get_session(year, race_id, 'R')
        # AQUI é o gargalo. Carregamos telemetria, mas desligamos clima e mensagens
        session.load(telemetry=True, weather=False, messages=False)

        driver_laps = session.laps.pick_drivers(driver_code)

        if lap == 0:
            target_lap = driver_laps.pick_fastest()
        else:
            target_lap = driver_laps[driver_laps['LapNumber'] == lap].iloc[0]

        # Pega telemetria e reduz colunas desnecessárias imediatamente
        telemetry = target_lap.get_telemetry()

        # Downsampling: Opcional, pega 1 a cada 2 pontos para reduzir tamanho do JSON se necessário
        # telemetry = telemetry.iloc[::2]

        data = []
        for _, row in telemetry.iterrows():
            data.append({
                "time": row['Time'].total_seconds(),
                "x": float(row['X']),
                "y": float(row['Y']),
                "speed": float(row['Speed']),
                "gear": int(row['nGear']),
                "throttle": float(row['Throttle']),
                "brake": bool(row['Brake']) if row['Brake'] in [0, 1, True, False] else float(row['Brake'])
            })

        # Limpeza crítica
        del session, driver_laps, target_lap, telemetry
        gc.collect()

        return data
    except Exception as e:
        print(f"Erro telemetria: {e}")
        # Mesmo no erro, tentamos limpar
        gc.collect()
        raise HTTPException(status_code=500, detail="Erro ao processar telemetria")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)