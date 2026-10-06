from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import Form, Question, Option, Response, Answer
from app.routers.forms import router as forms_router
from app.routers.questions import router as questions_router
from app.routers.options import router as options_router
from app.routers.responses import router as responses_router


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Typeform Builder API",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(forms_router)
app.include_router(questions_router)
app.include_router(options_router)
app.include_router(responses_router)


@app.get("/")
def root():
    return {
        "message": "Typeform Builder API is running"
    }