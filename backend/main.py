from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fastf1
import os
import pandas as pd

# 1. Configuração Inicial
app = FastAPI()

# Configuração de CORS (Fundamental para o React conseguir acessar este servidor)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, você colocaria o domínio do seu site aqui
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configura o Cache do FastF1
cache_dir = 'cache'
if not os.path.exists(cache_dir):
    os.makedirs(cache_dir)
fastf1.Cache.enable_cache(cache_dir)


@app.get("/")
def read_root():
    return {"message": "API de Telemetria F1 Online! 🏎️"}


@app.get("/api/races/{year}")
def get_races(year: int):
    """ Retorna o calendário de corridas do ano """
    try:
        schedule = fastf1.get_event_schedule(year)
        # Filtra e formata para JSON
        races_list = []
        for index, row in schedule.iterrows():
            # Pegamos apenas eventos oficiais
            races_list.append({
                "round": row['RoundNumber'],
                "name": row['EventName'],
                "date": str(row['EventDate']),
                "location": row['Location']
            })
        return races_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/drivers/{year}/{race_id}")
def get_drivers(year: int, race_id: int):
    """ Retorna a lista de pilotos de uma corrida específica """
    try:
        # race_id é o Round Number (ex: 20 para Brasil em 2023)
        session = fastf1.get_session(year, race_id, 'R')
        session.load(telemetry=False, weather=False, messages=False)

        drivers_data = []
        for drv in session.drivers:
            info = session.get_driver(drv)
            drivers_data.append({
                "code": info['Abbreviation'],
                "team": info['TeamName'],
                "number": info['DriverNumber']
            })
        return drivers_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/laps/{year}/{race_id}/{driver_code}")
def get_laps(year: int, race_id: int, driver_code: str):
    try:
        session = fastf1.get_session(year, race_id, 'R')
        session.load(telemetry=False, weather=False, messages=False)  # Carregamento leve

        laps = session.laps.pick_drivers(driver_code)

        # Filtra voltas válidas (sem pit in/out malucos)
        valid_laps = laps.pick_quicklaps()

        laps_data = []
        for _, row in valid_laps.iterrows():
            # Formata o tempo da volta (ex: 1:32.400)
            lap_time = str(row['LapTime']).split('days')[-1].strip()
            # Remove o "00:" inicial se tiver
            if lap_time.startswith("00:"):
                lap_time = lap_time[3:]

            laps_data.append({
                "lap_number": int(row['LapNumber']),
                "lap_time": lap_time[:10],  # Corta precisão excessiva
                "is_fastest": row['LapNumber'] == laps.pick_fastest()['LapNumber']
            })

        return laps_data
    except Exception as e:
        print(f"Erro laps: {e}")
        return []


# 2. ATUALIZADO: Telemetria aceita "lap_number" opcional
@app.get("/api/telemetry/{year}/{race_id}/{driver_code}")
def get_telemetry(year: int, race_id: int, driver_code: str, lap: int = 0):
    try:
        session = fastf1.get_session(year, race_id, 'R')
        session.load()

        driver_laps = session.laps.pick_drivers(driver_code)

        # Se lap=0, pega a mais rápida (comportamento padrão)
        if lap == 0:
            target_lap = driver_laps.pick_fastest()
        else:
            # Tenta pegar a volta específica
            target_lap = driver_laps[driver_laps['LapNumber'] == lap].iloc[0]

        telemetry = target_lap.get_telemetry()

        data = []
        for _, row in telemetry.iterrows():
            data.append({
                "time": row['Time'].total_seconds(),
                "x": row['X'],
                "y": row['Y'],
                "speed": row['Speed'],
                "gear": row['nGear'],
                "throttle": row['Throttle'],
                "brake": row['Brake']
            })
        return data
    except Exception as e:
        print(f"Erro telemetria: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar telemetria")
# Para rodar via código (opcional, pois usaremos terminal)
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)