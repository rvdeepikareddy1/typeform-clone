from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Question, Option

router = APIRouter(prefix="/api", tags=["Options"])


class OptionCreate(BaseModel):
    label: str
    value: str


class OptionUpdate(BaseModel):
    label: str
    value: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/questions/{question_id}/options")
def create_option(
    question_id: int,
    data: OptionCreate,
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

    last_option = (
        db.query(Option)
        .filter(Option.question_id == question_id)
        .order_by(Option.position.desc())
        .first()
    )

    position = (
        last_option.position + 1
        if last_option
        else 1
    )

    option = Option(
        question_id=question_id,
        label=data.label,
        value=data.value,
        position=position
    )

    db.add(option)
    db.commit()
    db.refresh(option)

    return option


@router.get("/questions/{question_id}/options")
def get_options(
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

    return (
        db.query(Option)
        .filter(Option.question_id == question_id)
        .order_by(Option.position)
        .all()
    )


@router.put("/options/{option_id}")
def update_option(
    option_id: int,
    data: OptionUpdate,
    db: Session = Depends(get_db)
):
    option = (
        db.query(Option)
        .filter(Option.id == option_id)
        .first()
    )

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Option not found"
        )

    option.label = data.label
    option.value = data.value

    db.commit()
    db.refresh(option)

    return option


@router.delete("/options/{option_id}")
def delete_option(
    option_id: int,
    db: Session = Depends(get_db)
):
    option = (
        db.query(Option)
        .filter(Option.id == option_id)
        .first()
    )

    if not option:
        raise HTTPException(
            status_code=404,
            detail="Option not found"
        )

    db.delete(option)
    db.commit()

    return {
        "message": "Option deleted successfully"
    }