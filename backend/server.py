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
    departments: Optional[List[str]] = []
    
    image_url: Optional[str] = None

class UserCreate(BaseModel):
    email: str
    name: str
    password: str
    phone: Optional[str] = None
    role: str = "user"
    specialization: Optional[str] = None
    experience: Optional[int] = None
    address: Optional[str] = None
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
    created_at: datetime = Field(default_factory=datetime.utcnow)

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


# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


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
