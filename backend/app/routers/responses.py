from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Form, Question, Option, Response, Answer

router = APIRouter(prefix="/api", tags=["Responses"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# PUBLIC FORM
# Used by respondents to load a published form
# ---------------------------------------------------------
@router.get("/public/forms/{slug}")
def get_public_form(
    slug: str,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(
            Form.slug == slug,
            Form.status == "published"
        )
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Published form not found"
        )

    questions = (
        db.query(Question)
        .filter(Question.form_id == form.id)
        .order_by(Question.position)
        .all()
    )

    result_questions = []

    for question in questions:
        options = []

        if question.type in ["multiple_choice", "dropdown"]:
            db_options = (
                db.query(Option)
                .filter(Option.question_id == question.id)
                .order_by(Option.position)
                .all()
            )

            options = [
                {
                    "id": option.id,
                    "label": option.label,
                    "value": option.value,
                    "position": option.position,
                }
                for option in db_options
            ]

        result_questions.append(
            {
                "id": question.id,
                "title": question.title,
                "description": question.description,
                "type": question.type,
                "required": question.required,
                "position": question.position,
                "settings": question.settings,
                "options": options,
            }
        )

    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "slug": form.slug,
        "status": form.status,
        "questions": result_questions,
    }


# ---------------------------------------------------------
# SUBMIT RESPONSE
# ---------------------------------------------------------
@router.post("/public/forms/{slug}/responses")
def submit_response(
    slug: str,
    answers: list[dict],
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(
            Form.slug == slug,
            Form.status == "published"
        )
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Published form not found"
        )

    questions = (
        db.query(Question)
        .filter(Question.form_id == form.id)
        .order_by(Question.position)
        .all()
    )

    question_map = {
        question.id: question
        for question in questions
    }

    submitted_question_ids = set()

    for answer in answers:
        question_id = answer.get("question_id")
        value = answer.get("value")

        if question_id not in question_map:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid question ID: {question_id}"
            )

        submitted_question_ids.add(question_id)

        question = question_map[question_id]

        if question.required:
            if value is None or str(value).strip() == "":
                raise HTTPException(
                    status_code=400,
                    detail=f"Question {question_id} is required"
                )

    # Check that every required question was answered
    for question in questions:
        if question.required and question.id not in submitted_question_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Question {question.id} is required"
            )

    response = Response(
        form_id=form.id,
        submitted_at=datetime.utcnow()
    )

    db.add(response)
    db.flush()

    for answer in answers:
        db.add(
            Answer(
                response_id=response.id,
                question_id=answer["question_id"],
                value=str(answer.get("value", ""))
            )
        )

    db.commit()
    db.refresh(response)

    return {
        "message": "Response submitted successfully",
        "response_id": response.id
    }


# ---------------------------------------------------------
# GET ALL RESPONSES
# ---------------------------------------------------------
@router.get("/forms/{form_id}/responses")
def get_responses(
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

    return (
        db.query(Response)
        .filter(Response.form_id == form_id)
        .order_by(Response.submitted_at.desc())
        .all()
    )


# ---------------------------------------------------------
# GET ONE RESPONSE
# ---------------------------------------------------------
@router.get("/forms/{form_id}/responses/{response_id}")
def get_response(
    form_id: int,
    response_id: int,
    db: Session = Depends(get_db)
):
    response = (
        db.query(Response)
        .filter(
            Response.id == response_id,
            Response.form_id == form_id
        )
        .first()
    )

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Response not found"
        )

    answers = (
        db.query(Answer)
        .filter(Answer.response_id == response_id)
        .all()
    )

    return {
        "id": response.id,
        "form_id": response.form_id,
        "submitted_at": response.submitted_at,
        "answers": answers
    }


# ---------------------------------------------------------
# RESPONSE STATISTICS
# ---------------------------------------------------------
@router.get("/forms/{form_id}/stats")
def get_response_stats(
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

    stats = []

    for question in questions:
        answers = (
            db.query(Answer)
            .filter(Answer.question_id == question.id)
            .all()
        )

        counts = {}

        for answer in answers:
            value = answer.value

            if value:
                counts[value] = counts.get(value, 0) + 1

        stats.append(
            {
                "question_id": question.id,
                "question": question.title,
                "type": question.type,
                "total_answers": len(answers),
                "counts": counts
            }
        )

    return {
        "form_id": form_id,
        "stats": stats
    }