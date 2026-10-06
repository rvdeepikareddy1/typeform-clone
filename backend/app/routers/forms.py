from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Form, Question, Option

router = APIRouter(prefix="/api/forms", tags=["Forms"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def make_slug(title: str, db: Session) -> str:
    base_slug = title.lower().strip().replace(" ", "-")

    # Remove some common special characters
    base_slug = "".join(
        character
        for character in base_slug
        if character.isalnum() or character == "-"
    )

    if not base_slug:
        base_slug = "form"

    slug = base_slug
    counter = 2

    while db.query(Form).filter(Form.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    return slug


# ---------------------------------------------------------
# CREATE FORM
# ---------------------------------------------------------
@router.post("/")
def create_form(
    title: str,
    db: Session = Depends(get_db)
):
    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Form title cannot be empty"
        )

    form = Form(
        title=title,
        slug=make_slug(title, db),
        status="draft"
    )

    db.add(form)
    db.commit()
    db.refresh(form)

    return form


# ---------------------------------------------------------
# GET ALL FORMS
# ---------------------------------------------------------
@router.get("/")
def get_forms(db: Session = Depends(get_db)):
    return (
        db.query(Form)
        .order_by(Form.created_at.desc())
        .all()
    )


# ---------------------------------------------------------
# GET ONE FORM
# ---------------------------------------------------------
@router.get("/{form_id}")
def get_form(
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

    return form


# ---------------------------------------------------------
# UPDATE FORM
# ---------------------------------------------------------
@router.put("/{form_id}")
def update_form(
    form_id: int,
    title: str,
    description: str | None = None,
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

    title = title.strip()

    if not title:
        raise HTTPException(
            status_code=400,
            detail="Form title cannot be empty"
        )

    form.title = title
    form.description = description

    db.commit()
    db.refresh(form)

    return form


# ---------------------------------------------------------
# DELETE FORM
# ---------------------------------------------------------
@router.delete("/{form_id}")
def delete_form(
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

    db.delete(form)
    db.commit()

    return {
        "message": "Form deleted successfully"
    }


# ---------------------------------------------------------
# DUPLICATE FORM
# ---------------------------------------------------------
@router.post("/{form_id}/duplicate")
def duplicate_form(
    form_id: int,
    db: Session = Depends(get_db)
):
    original_form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not original_form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    # Create the new form
    new_title = f"{original_form.title} Copy"

    new_form = Form(
        title=new_title,
        description=original_form.description,
        slug=make_slug(new_title, db),
        status="draft"
    )

    db.add(new_form)
    db.flush()

    # Get original questions in their correct order
    original_questions = (
        db.query(Question)
        .filter(Question.form_id == original_form.id)
        .order_by(Question.position)
        .all()
    )

    for original_question in original_questions:

        new_question = Question(
            form_id=new_form.id,
            title=original_question.title,
            description=original_question.description,
            type=original_question.type,
            required=original_question.required,
            position=original_question.position,
            settings=original_question.settings,
        )

        db.add(new_question)
        db.flush()

        # Copy options for multiple choice/dropdown
        if original_question.type in [
            "multiple_choice",
            "dropdown"
        ]:
            original_options = (
                db.query(Option)
                .filter(
                    Option.question_id == original_question.id
                )
                .order_by(Option.position)
                .all()
            )

            for original_option in original_options:
                new_option = Option(
                    question_id=new_question.id,
                    label=original_option.label,
                    value=original_option.value,
                    position=original_option.position,
                )

                db.add(new_option)

    db.commit()
    db.refresh(new_form)

    return {
        "message": "Form duplicated successfully",
        "form": new_form
    }


# ---------------------------------------------------------
# PUBLISH FORM
# ---------------------------------------------------------
@router.post("/{form_id}/publish")
def publish_form(
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

    form.status = "published"

    db.commit()
    db.refresh(form)

    return {
        "message": "Form published",
        "slug": form.slug,
        "status": form.status
    }


# ---------------------------------------------------------
# UNPUBLISH FORM
# ---------------------------------------------------------
@router.post("/{form_id}/unpublish")
def unpublish_form(
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

    form.status = "draft"

    db.commit()
    db.refresh(form)

    return {
        "message": "Form unpublished",
        "status": form.status
    }