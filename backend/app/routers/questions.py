import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Form, Question

router = APIRouter(prefix="/api", tags=["Questions"])


class QuestionCreate(BaseModel):
    title: str
    type: str
    required: bool = False
    description: str | None = None
    settings: dict | None = None


class QuestionUpdate(BaseModel):
    title: str
    type: str
    required: bool = False
    description: str | None = None
    settings: dict | None = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/forms/{form_id}/questions")
def create_question(
    form_id: int,
    data: QuestionCreate,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    last_question = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position.desc())
        .first()
    )

    position = (
        last_question.position + 1
        if last_question
        else 1
    )

    question = Question(
        form_id=form_id,
        title=data.title,
        description=data.description,
        type=data.type,
        required=data.required,
        position=position,
        settings=(
            json.dumps(data.settings)
            if data.settings
            else None
        ),
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


@router.get("/forms/{form_id}/questions")
def get_questions(
    form_id: int,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position)
        .all()
    )

    result = []

    for question in questions:
        settings = None

        if question.settings:
            try:
                settings = json.loads(question.settings)
            except json.JSONDecodeError:
                settings = None

        result.append(
            {
                "id": question.id,
                "form_id": question.form_id,
                "title": question.title,
                "description": question.description,
                "type": question.type,
                "required": question.required,
                "position": question.position,
                "settings": settings,
            }
        )

    return result


@router.put("/questions/{question_id}")
def update_question(
    question_id: int,
    data: QuestionUpdate,
    db: Session = Depends(get_db)
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    question.title = data.title
    question.type = data.type
    question.required = data.required
    question.description = data.description
    question.settings = (
        json.dumps(data.settings)
        if data.settings
        else None
    )

    db.commit()
    db.refresh(question)

    settings = None

    if question.settings:
        try:
            settings = json.loads(question.settings)
        except json.JSONDecodeError:
            settings = None

    return {
        "id": question.id,
        "form_id": question.form_id,
        "title": question.title,
        "description": question.description,
        "type": question.type,
        "required": question.required,
        "position": question.position,
        "settings": settings,
    }


@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully"
    }


@router.put("/forms/{form_id}/questions/reorder")
def reorder_questions(
    form_id: int,
    question_ids: list[int],
    db: Session = Depends(get_db)
):
    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .all()
    )

    question_map = {
        question.id: question
        for question in questions
    }

    if set(question_ids) != set(question_map.keys()):
        raise HTTPException(
            status_code=400,
            detail="Question IDs do not match the form's questions"
        )

    for position, question_id in enumerate(
        question_ids,
        start=1
    ):
        question_map[question_id].position = position

    db.commit()

    return {
        "message": "Questions reordered successfully"
    }