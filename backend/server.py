from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from gemini_chat import health_chat
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib
import io
import httpx
import asyncio
from datetime import date, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
print(f"Connecting to MongoDB: {mongo_url.split('@')[-1] if '@' in mongo_url else mongo_url}")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'medbook_db')]
fs = AsyncIOMotorGridFSBucket(db)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_cache_hospitals():
    try:
        await fetch_and_cache_osm_hospitals()
    except Exception as exc:
        logger.warning("Startup OSM hospital fetch failed: %s", exc)
    asyncio.create_task(reminder_worker())


# ==================== MODELS ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    phone: Optional[str] = None
    role: str = "user" # "user", "doctor", "hospital"
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Doctor Specific
    specialization: Optional[str] = None
    degree: Optional[str] = None
    experience: Optional[int] = 0
    consultation_fee: Optional[int] = 500
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    available_days: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    available_slots: List[str] = ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]
    rating: float = 4.0
    
    # Hospital Specific
    address: Optional[str] = None
    city: Optional[str] = "Kanyakumari"
    area: Optional[str] = "Nagercoil"
    state: Optional[str] = None
    pincode: Optional[str] = None
    departments: Optional[List[str]] = []
    
    image_url: Optional[str] = None
    expo_push_token: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    phone: Optional[str] = None
    role: str = "user"
    specialization: Optional[str] = None
    degree: Optional[str] = None
    experience: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    departments: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    role: str
    specialization: Optional[str] = None
    degree: Optional[str] = None
    experience: Optional[int] = None
    consultation_fee: Optional[int] = None
    available_days: Optional[List[str]] = None
    available_slots: Optional[List[str]] = None
    rating: Optional[float] = None
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    departments: Optional[List[str]] = []

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    doctor_id: str
    doctor_name: str
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    date: str
    time_slot: str
    type: str = "in-person"
    reason: Optional[str] = None
    status: str = "pending"
    suggested_date: Optional[str] = None
    suggested_time: Optional[str] = None
    doctor_note: Optional[str] = None
    patient_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[List[dict]] = []
    record_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AppointmentCreate(BaseModel):
    user_id: str
    user_name: str
    doctor_id: str
    doctor_name: str
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    date: str
    time_slot: str
    type: str = "in-person"
    reason: Optional[str] = None

class AppointmentRecordUpdate(BaseModel):
    doctor_id: str
    patient_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[List[dict]] = []
    record_notes: Optional[str] = None

class PushTokenRegister(BaseModel):
    user_id: str
    expo_push_token: str

class MedicineReminder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    medicine_name: str
    before_after: str = "after"
    times: List[str]
    start_date: str
    end_date: str
    tz_offset_minutes: int = 0
    active: bool = True
    next_trigger_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MedicineReminderCreate(BaseModel):
    user_id: str
    medicine_name: str
    before_after: str = "after"
    times: List[str]
    start_date: str
    end_date: str
    tz_offset_minutes: int = 0

class MedicalRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: Optional[str] = None
    file_type: str
    filename: str
    file_id: str
    upload_date: datetime = Field(default_factory=datetime.utcnow)

class ChatMessage(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    user_id: str

class HospitalMaster(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    latitude: float
    longitude: float
    locality: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorHospitalMap(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    doctor_id: str
    hospital_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DoctorHospitalSelection(BaseModel):
    doctor_id: str
    hospital_ids: List[str]

class HospitalCacheMeta(BaseModel):
    id: str = "osm_hospitals_cache"
    last_fetched_at: datetime = Field(default_factory=datetime.utcnow)

class HospitalDoctorsResponse(BaseModel):
    hospital_id: str
    doctors: List[UserResponse]


# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def compute_next_trigger_utc(reminder: MedicineReminder) -> Optional[datetime]:
    try:
        start = date.fromisoformat(reminder.start_date)
        end = date.fromisoformat(reminder.end_date)
    except Exception:
        return None

    if end < start:
        return None

    now_utc = datetime.utcnow()
    offset = timedelta(minutes=reminder.tz_offset_minutes)
    now_local = now_utc + offset

    times = []
    for t in reminder.times:
        try:
            hour, minute = t.split(":")
            times.append((int(hour), int(minute)))
        except Exception:
            continue

    if not times:
        return None

    times = sorted(times)

    day = max(start, now_local.date())
    while day <= end:
        for hour, minute in times:
            candidate_local = datetime.combine(day, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
            if candidate_local >= now_local:
                return candidate_local - offset
        day = day + timedelta(days=1)

    return None

async def send_expo_push(expo_push_token: str, title: str, body: str, data: Optional[dict] = None) -> None:
    payload = {
        "to": expo_push_token,
        "title": title,
        "body": body,
        "data": data or {},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        await client.post("https://exp.host/--/api/v2/push/send", json=payload)

async def reverse_geocode_osm(latitude: float, longitude: float) -> dict:
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": latitude,
        "lon": longitude,
        "format": "json",
        "addressdetails": 1,
    }
    headers = {"User-Agent": "lmk-hospitalappoinment/1.0"}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, params=params, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    address = data.get("address", {})
    street = None
    if address.get("road") and address.get("house_number"):
        street = f"{address.get('house_number')} {address.get('road')}"
    else:
        street = address.get("road")
    return {
        "street": street,
        "city": address.get("city") or address.get("town") or address.get("village"),
        "district": address.get("state_district") or address.get("district"),
        "state": address.get("state"),
        "postcode": address.get("postcode"),
        "locality": address.get("suburb") or address.get("neighbourhood") or address.get("locality"),
    }

async def reminder_worker():
    while True:
        try:
            now = datetime.utcnow()
            due = await db.medicine_reminders.find({
                "active": True,
                "next_trigger_at": {"$lte": now}
            }).to_list(200)

            for rem in due:
                token_owner = await db.users.find_one({"id": rem.get("user_id")})
                expo_token = token_owner.get("expo_push_token") if token_owner else None
                if expo_token:
                    before_after = rem.get("before_after", "after")
                    title = "Medicine Reminder"
                    body = f"{rem.get('medicine_name')} ({before_after} food)"
                    await send_expo_push(expo_token, title, body, {"reminder_id": rem.get("id")})

                reminder = MedicineReminder(**rem)
                next_trigger = compute_next_trigger_utc(reminder)
                if next_trigger:
                    await db.medicine_reminders.update_one(
                        {"id": rem.get("id")},
                        {"$set": {"next_trigger_at": next_trigger}}
                    )
                else:
                    await db.medicine_reminders.delete_one({"id": rem.get("id")})
        except Exception as exc:
            logger.warning("Reminder worker error: %s", exc)

        await asyncio.sleep(60)

async def fetch_and_cache_osm_hospitals(force: bool = False) -> int:
    """
    Fetch hospital data from Overpass API and cache it in DB.
    Returns the number of hospitals stored.
    """
    existing_count = await db.hospital_master.count_documents({})
    meta = await db.hospital_cache_meta.find_one({"id": "osm_hospitals_cache"})
    if existing_count > 0 and meta and not force:
        return existing_count

    area_query = """[out:json][timeout:60];
area["name"="Kanniyakumari"]["admin_level"="6"]->.district;
(
  node["amenity"="hospital"](area.district);
  way["amenity"="hospital"](area.district);
  relation["amenity"="hospital"](area.district);
);
out center tags;"""

    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    data = {"data": area_query}

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post("https://overpass-api.de/api/interpreter", data=data, headers=headers)
        response.raise_for_status()
        payload = response.json()

        elements = payload.get("elements", [])
        if not elements:
            bbox = os.environ.get("OSM_BBOX")
            if not bbox:
                nominatim_query = os.environ.get("OSM_NOMINATIM_QUERY", "Kanyakumari district, Tamil Nadu, India")
                nominatim_url = "https://nominatim.openstreetmap.org/search"
                nominatim_params = {
                    "q": nominatim_query,
                    "format": "json",
                    "limit": 1,
                }
                nominatim_headers = {"User-Agent": "lmk-hospitalappoinment/1.0"}
                nominatim_resp = await client.get(nominatim_url, params=nominatim_params, headers=nominatim_headers)
                nominatim_resp.raise_for_status()
                nominatim_data = nominatim_resp.json()
                if nominatim_data:
                    bbox_vals = nominatim_data[0].get("boundingbox", [])
                    if len(bbox_vals) == 4:
                        south, north, west, east = bbox_vals
                        bbox = f"{south},{west},{north},{east}"
            if bbox:
                bbox_query = f"""[out:json][timeout:60];
(
  node["amenity"="hospital"]({bbox});
  way["amenity"="hospital"]({bbox});
  relation["amenity"="hospital"]({bbox});
);
out center tags;"""
                bbox_data = {"data": bbox_query}
                bbox_resp = await client.post("https://overpass-api.de/api/interpreter", data=bbox_data, headers=headers)
                bbox_resp.raise_for_status()
                payload = bbox_resp.json()

    elements = payload.get("elements", [])
    hospitals_to_insert: List[dict] = []
    for element in elements:
        tags = element.get("tags") or {}
        name = tags.get("name")
        if not name:
            continue

        if "lat" in element and "lon" in element:
            lat = element.get("lat")
            lon = element.get("lon")
        else:
            center = element.get("center") or {}
            lat = center.get("lat")
            lon = center.get("lon")

        if lat is None or lon is None:
            continue

        street = None
        if tags.get("addr:street") and tags.get("addr:housenumber"):
            street = f"{tags.get('addr:housenumber')} {tags.get('addr:street')}"
        else:
            street = tags.get("addr:street")

        locality = (
            tags.get("addr:city")
            or tags.get("addr:district")
            or tags.get("addr:suburb")
            or tags.get("addr:locality")
            or tags.get("addr:town")
            or tags.get("addr:village")
        )

        city = tags.get("addr:city") or tags.get("addr:town") or tags.get("addr:village")
        district = tags.get("addr:district")
        state = tags.get("addr:state")
        postcode = tags.get("addr:postcode")

        hospitals_to_insert.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "latitude": float(lat),
            "longitude": float(lon),
            "locality": locality,
            "street": street,
            "city": city,
            "district": district,
            "state": state,
            "postcode": postcode,
            "created_at": datetime.utcnow(),
        })

    await db.hospital_master.delete_many({})
    if hospitals_to_insert:
        await db.hospital_master.insert_many(hospitals_to_insert)

    await db.hospital_cache_meta.update_one(
        {"id": "osm_hospitals_cache"},
        {"$set": {"last_fetched_at": datetime.utcnow()}},
        upsert=True,
    )

    return len(hospitals_to_insert)


# ==================== AUTH ====================

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_data.dict()
    password = user_dict.pop("password")
    user = User(**user_dict, password_hash=hash_password(password))
    
    await db.users.insert_one(user.dict())
    return UserResponse(**user.dict())

@api_router.post("/auth/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return UserResponse(**user)

@api_router.get("/auth/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user: raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

@api_router.put("/auth/user/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update_data: dict):
    # Remove sensitive fields if present
    update_data.pop("password", None)
    update_data.pop("password_hash", None)
    update_data.pop("role", None)
    update_data.pop("id", None)
    
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    updated = await db.users.find_one({"id": user_id})
    return UserResponse(**updated)


# ==================== DATA ====================

@api_router.get("/hospitals", response_model=List[UserResponse])
async def get_hospitals():
    items = await db.users.find({"role": "hospital"}).to_list(1000)
    return [UserResponse(**h) for h in items]

@api_router.get("/doctors", response_model=List[UserResponse])
async def get_doctors(specialization: Optional[str] = None):
    query = {"role": "doctor"}
    if specialization:
        query["specialization"] = {"$regex": specialization, "$options": "i"}
    items = await db.users.find(query).to_list(1000)
    return [UserResponse(**d) for d in items]

@api_router.get("/doctors/{doctor_id}", response_model=UserResponse)
async def get_doctor(doctor_id: str):
    item = await db.users.find_one({"id": doctor_id, "role": "doctor"})
    if not item: raise HTTPException(status_code=404, detail="Doctor not found")
    return UserResponse(**item)


# ==================== HOSPITAL MASTER (OSM) ====================

@api_router.get("/osm-hospitals", response_model=List[HospitalMaster])
async def get_osm_hospitals():
    try:
        await fetch_and_cache_osm_hospitals()
    except Exception as exc:
        logger.warning("OSM hospital fetch failed: %s", exc)
    items = await db.hospital_master.find({}).to_list(5000)
    return [HospitalMaster(**h) for h in items]

@api_router.get("/osm-hospitals/{hospital_id}/reverse", response_model=HospitalMaster)
async def reverse_geocode_hospital(hospital_id: str):
    hospital = await db.hospital_master.find_one({"id": hospital_id})
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")

    if hospital.get("street") or hospital.get("city") or hospital.get("district") or hospital.get("state") or hospital.get("postcode"):
        return HospitalMaster(**hospital)

    try:
        address = await reverse_geocode_osm(hospital["latitude"], hospital["longitude"])
    except Exception as exc:
        logger.warning("Reverse geocode failed: %s", exc)
        return HospitalMaster(**hospital)

    await db.hospital_master.update_one({"id": hospital_id}, {"$set": address})
    updated = await db.hospital_master.find_one({"id": hospital_id})
    return HospitalMaster(**updated)

@api_router.post("/osm-hospitals/refresh")
async def refresh_osm_hospitals():
    try:
        count = await fetch_and_cache_osm_hospitals(force=True)
        return {"count": count}
    except Exception as exc:
        logger.warning("OSM hospital refresh failed: %s", exc)
        raise HTTPException(status_code=500, detail="OSM refresh failed")

@api_router.post("/doctor-hospitals")
async def save_doctor_hospitals(selection: DoctorHospitalSelection):
    doctor = await db.users.find_one({"id": selection.doctor_id, "role": "doctor"})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    hospital_ids = list({h.strip() for h in selection.hospital_ids if h.strip()})
    if not hospital_ids:
        raise HTTPException(status_code=400, detail="No hospital IDs provided")

    existing = await db.hospital_master.count_documents({"id": {"$in": hospital_ids}})
    if existing != len(hospital_ids):
        raise HTTPException(status_code=400, detail="One or more hospital IDs are invalid")

    await db.doctor_hospitals.delete_many({"doctor_id": selection.doctor_id})
    await db.doctor_hospitals.insert_many([
        {
            "id": str(uuid.uuid4()),
            "doctor_id": selection.doctor_id,
            "hospital_id": hospital_id,
            "created_at": datetime.utcnow(),
        }
        for hospital_id in hospital_ids
    ])

    return {"doctor_id": selection.doctor_id, "hospital_ids": hospital_ids}

@api_router.get("/doctor-hospitals/{doctor_id}", response_model=List[HospitalMaster])
async def get_doctor_hospitals(doctor_id: str):
    links = await db.doctor_hospitals.find({"doctor_id": doctor_id}).to_list(2000)
    hospital_ids = [l.get("hospital_id") for l in links if l.get("hospital_id")]
    if not hospital_ids:
        return []
    items = await db.hospital_master.find({"id": {"$in": hospital_ids}}).to_list(5000)
    return [HospitalMaster(**h) for h in items]

@api_router.get("/hospital-doctors/{hospital_id}", response_model=List[UserResponse])
async def get_hospital_doctors(hospital_id: str):
    links = await db.doctor_hospitals.find({"hospital_id": hospital_id}).to_list(2000)
    doctor_ids = [l.get("doctor_id") for l in links if l.get("doctor_id")]
    if not doctor_ids:
        return []
    items = await db.users.find({"id": {"$in": doctor_ids}, "role": "doctor"}).to_list(2000)
    return [UserResponse(**d) for d in items]


# ==================== APPOINTMENTS ====================

@api_router.post("/appointments", response_model=Appointment)
async def create_appointment(data: AppointmentCreate):
    item = Appointment(**data.dict())
    await db.appointments.insert_one(item.dict())
    return item

@api_router.get("/appointments/user/{user_id}", response_model=List[Appointment])
async def get_user_appointments(user_id: str):
    items = await db.appointments.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
    return [Appointment(**a) for a in items]

@api_router.get("/appointments/doctor/{doctor_id}", response_model=List[Appointment])
async def get_doctor_appointments(doctor_id: str):
    items = await db.appointments.find({"doctor_id": doctor_id}).sort("created_at", -1).to_list(1000)
    return [Appointment(**a) for a in items]

class StatusUpdate(BaseModel):
    status: str
    suggested_date: Optional[str] = None
    suggested_time: Optional[str] = None
    doctor_note: Optional[str] = None

@api_router.put("/appointments/{appointment_id}/status")
async def update_status(appointment_id: str, update: StatusUpdate):
    await db.appointments.update_one(
        {"id": appointment_id}, 
        {"$set": update.dict(exclude_unset=True)}
    )
    return {"status": update.status}

@api_router.put("/appointments/{appointment_id}/record")
async def update_appointment_record(appointment_id: str, record: AppointmentRecordUpdate):
    appt = await db.appointments.find_one({"id": appointment_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.get("doctor_id") != record.doctor_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    update_data = record.dict(exclude_unset=True)
    update_data.pop("doctor_id", None)
    update_data["updated_at"] = datetime.utcnow()
    await db.appointments.update_one({"id": appointment_id}, {"$set": update_data})
    updated = await db.appointments.find_one({"id": appointment_id})
    return Appointment(**updated)

@api_router.get("/patients/{doctor_id}/{patient_id}/timeline", response_model=List[Appointment])
async def get_patient_timeline(doctor_id: str, patient_id: str):
    items = await db.appointments.find({
        "doctor_id": doctor_id,
        "user_id": patient_id
    }).sort("date", 1).to_list(1000)
    return [Appointment(**a) for a in items]

@api_router.post("/push/register")
async def register_push_token(payload: PushTokenRegister):
    await db.users.update_one({"id": payload.user_id}, {"$set": {"expo_push_token": payload.expo_push_token}})
    return {"status": "ok"}

@api_router.post("/reminders", response_model=MedicineReminder)
async def create_reminder(payload: MedicineReminderCreate):
    reminder = MedicineReminder(**payload.dict())
    reminder.next_trigger_at = compute_next_trigger_utc(reminder)
    if reminder.next_trigger_at is None:
        raise HTTPException(status_code=400, detail="Invalid reminder schedule")
    await db.medicine_reminders.insert_one(reminder.dict())
    return reminder

@api_router.get("/reminders/user/{user_id}", response_model=List[MedicineReminder])
async def get_user_reminders(user_id: str):
    items = await db.medicine_reminders.find({"user_id": user_id}).sort("created_at", -1).to_list(1000)
    return [MedicineReminder(**r) for r in items]

@api_router.delete("/reminders/{reminder_id}")
async def delete_reminder(reminder_id: str):
    await db.medicine_reminders.delete_one({"id": reminder_id})
    return {"status": "deleted"}

@api_router.put("/reminders/{reminder_id}/toggle")
async def toggle_reminder(reminder_id: str, active: bool = True):
    reminder = await db.medicine_reminders.find_one({"id": reminder_id})
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    update = {"active": active}
    if active:
        next_trigger = compute_next_trigger_utc(MedicineReminder(**reminder))
        update["next_trigger_at"] = next_trigger
    await db.medicine_reminders.update_one({"id": reminder_id}, {"$set": update})
    return {"status": "ok"}


# ==================== MEDICAL RECORDS ====================

@api_router.post("/records/upload", response_model=MedicalRecord)
async def upload_record(
    user_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...)
):
    file_content = await file.read()
    file_id = await fs.upload_from_stream(
        file.filename,
        io.BytesIO(file_content),
        metadata={"contentType": file.content_type, "user_id": user_id}
    )
    
    record = MedicalRecord(
        user_id=user_id,
        title=title,
        description=description,
        file_type=file.content_type,
        filename=file.filename,
        file_id=str(file_id)
    )
    
    await db.medical_records.insert_one(record.dict())
    return record

@api_router.get("/records/{user_id}", response_model=List[MedicalRecord])
async def get_records(user_id: str):
    items = await db.medical_records.find({"user_id": user_id}).sort("upload_date", -1).to_list(1000)
    return [MedicalRecord(**r) for r in items]

@api_router.get("/records/file/{file_id}")
async def get_record_file(file_id: str):
    try:
        from bson import ObjectId
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        content = await grid_out.read()
        return Response(content=content, media_type=grid_out.metadata.get("contentType", "application/octet-stream"))
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")


# ==================== AI CHAT ====================

@api_router.post("/chat", response_model=ChatResponse)
async def chat(msg: ChatMessage):
    resp = await health_chat.send_message(msg.user_id, msg.message)
    return ChatResponse(response=resp, user_id=msg.user_id)

@api_router.post("/chat/clear/{user_id}")
async def clear_chat(user_id: str):
    health_chat.clear_session(user_id)
    return {"message": "Success"}


# ==================== INIT ====================

@api_router.get("/")
async def root():
    return {"name": "MedBook API", "version": "2.0"}

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown():
    client.close()
