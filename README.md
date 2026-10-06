# Typeform Clone

A full-stack Typeform-inspired form builder that allows users to create, customize, publish, and manage conversational forms. Users can share forms publicly, collect responses, and view submitted responses and statistics through the dashboard.

## Features

### Form Management

- Create new forms
- Rename existing forms
- Duplicate forms
- Delete forms
- Search forms
- View form status as Draft or Published
- Publish and unpublish forms
- Copy and share public form links
- View response counts

### Form Builder

- Add new questions
- Edit existing questions
- Delete questions
- Drag and drop questions to reorder them
- Mark questions as required
- Add question descriptions
- Configure options for choice-based questions
- Preview and build forms interactively

### Supported Question Types

- Short Text
- Long Text
- Multiple Choice
- Dropdown
- Email
- Number
- Yes / No
- Rating

### Public Form

- Public shareable form without authentication
- One-question-at-a-time conversational experience
- Navigation between questions
- Progress indication
- Required-field validation
- Response submission
- Thank-you screen after submission

### Response Management

- View total response count
- View submitted responses
- View individual responses
- View answers mapped to their questions
- View response statistics

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React
- dnd-kit

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

### Database

- SQLite

## Architecture

```text
                    ┌─────────────────────┐
                    │      Next.js        │
                    │     Frontend        │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
                               │ SQLAlchemy
                               ▼
                    ┌─────────────────────┐
                    │       SQLite        │
                    │      Database       │
                    └─────────────────────┘