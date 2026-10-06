"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Eye,
  GripVertical,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Save,
  Send,
  Settings,
  Star,
  Trash2,
  Type,
  Hash,
  List,
  X,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type QuestionType =
  | "short_text"
  | "long_text"
  | "multiple_choice"
  | "dropdown"
  | "email"
  | "number"
  | "yes_no"
  | "rating";

type Option = {
  id: number;
  question_id: number;
  label: string;
  value: string;
  position: number;
};

type Question = {
  id: number;
  form_id: number;
  title: string;
  description: string | null;
  type: QuestionType;
  required: boolean;
  position: number;
  settings: Record<string, unknown> | null;
  options?: Option[];
};

type Form = {
  id: number;
  title: string;
  description?: string | null;
  slug?: string;
  is_published?: boolean;
};

const QUESTION_TYPES: {
  type: QuestionType;
  label: string;
  description: string;
}[] = [
  {
    type: "short_text",
    label: "Short text",
    description: "A short answer",
  },
  {
    type: "long_text",
    label: "Long text",
    description: "A longer written answer",
  },
  {
    type: "multiple_choice",
    label: "Multiple choice",
    description: "Choose one option",
  },
  {
    type: "dropdown",
    label: "Dropdown",
    description: "Select from a list",
  },
  {
    type: "email",
    label: "Email",
    description: "Collect an email address",
  },
  {
    type: "number",
    label: "Number",
    description: "Collect a number",
  },
  {
    type: "yes_no",
    label: "Yes / No",
    description: "A yes or no answer",
  },
  {
    type: "rating",
    label: "Rating",
    description: "Rate from 1 to 5",
  },
];

function getIcon(type: QuestionType) {
  switch (type) {
    case "short_text":
      return <Type size={20} />;
    case "long_text":
      return <MessageSquare size={20} />;
    case "multiple_choice":
      return <List size={20} />;
    case "dropdown":
      return <ChevronDown size={20} />;
    case "email":
      return <Mail size={20} />;
    case "number":
      return <Hash size={20} />;
    case "yes_no":
      return <Check size={20} />;
    case "rating":
      return <Star size={20} />;
  }
}

function getTypeLabel(type: QuestionType) {
  return QUESTION_TYPES.find((item) => item.type === type)?.label ?? type;
}

function getDefaultTitle(type: QuestionType) {
  switch (type) {
    case "short_text":
      return "What is your name?";
    case "long_text":
      return "Tell us more";
    case "multiple_choice":
      return "Choose an option";
    case "dropdown":
      return "Select an option";
    case "email":
      return "What is your email address?";
    case "number":
      return "Enter a number";
    case "yes_no":
      return "Would you recommend us?";
    case "rating":
      return "How would you rate us?";
  }
}

function getDefaultOptions(type: QuestionType) {
  if (type === "multiple_choice" || type === "dropdown") {
    return [
      { label: "Option 1", value: "option_1" },
      { label: "Option 2", value: "option_2" },
      { label: "Option 3", value: "option_3" },
    ];
  }

  return [];
}

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();

  const formId = Number(params.formId);

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const selectedQuestion = useMemo(
    () =>
      questions.find((question) => question.id === selectedQuestionId) ?? null,
    [questions, selectedQuestionId]
  );

  useEffect(() => {
    if (!formId || Number.isNaN(formId)) return;

    loadBuilder();
  }, [formId]);

  async function loadBuilder() {
    try {
      setLoading(true);

      const formResponse = await fetch(`${API_URL}/api/forms/${formId}`);

      if (!formResponse.ok) {
        throw new Error("Unable to load form");
      }

      const formData = await formResponse.json();
      setForm(formData);

      const questionsResponse = await fetch(
        `${API_URL}/api/forms/${formId}/questions`
      );

      if (!questionsResponse.ok) {
        throw new Error("Unable to load questions");
      }

      const questionData: Question[] = await questionsResponse.json();

      const questionsWithOptions = await Promise.all(
        questionData.map(async (question) => {
          if (
            question.type === "multiple_choice" ||
            question.type === "dropdown"
          ) {
            const optionsResponse = await fetch(
              `${API_URL}/api/questions/${question.id}/options`
            );

            if (optionsResponse.ok) {
              const options = await optionsResponse.json();
              return {
                ...question,
                options,
              };
            }
          }

          return question;
        })
      );

      setQuestions(questionsWithOptions);
    } catch (error) {
      console.error(error);
      alert("Could not load the form.");
    } finally {
      setLoading(false);
    }
  }

  async function saveForm() {
    if (!form) return;

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/forms/${form.id}?title=${encodeURIComponent(
          form.title
        )}&description=${encodeURIComponent(form.description ?? "")}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save form");
      }

      for (const question of questions) {
        await fetch(`${API_URL}/api/questions/${question.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: question.title,
            type: question.type,
            required: question.required,
            description: question.description,
            settings: question.settings,
          }),
        });
      }

      alert("Saved successfully!");
    } catch (error) {
      console.error(error);
      alert("Could not save the form.");
    } finally {
      setSaving(false);
    }
  }

  async function addQuestion(type: QuestionType) {
    try {
      const response = await fetch(
        `${API_URL}/api/forms/${formId}/questions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: getDefaultTitle(type),
            type,
            required: false,
            description: null,
            settings: null,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not create question");
      }

      const newQuestion: Question = await response.json();

      const defaultOptions = getDefaultOptions(type);

      if (defaultOptions.length > 0) {
        const createdOptions: Option[] = [];

        for (const option of defaultOptions) {
          const optionResponse = await fetch(
            `${API_URL}/api/questions/${newQuestion.id}/options`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(option),
            }
          );

          if (optionResponse.ok) {
            createdOptions.push(await optionResponse.json());
          }
        }

        newQuestion.options = createdOptions;
      }

      setQuestions((previous) => [...previous, newQuestion]);
      setSelectedQuestionId(newQuestion.id);
    } catch (error) {
      console.error(error);
      alert("Could not add the question.");
    }
  }

  async function deleteQuestion(questionId: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this question?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/questions/${questionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete question");
      }

      setQuestions((previous) =>
        previous.filter((question) => question.id !== questionId)
      );

      if (selectedQuestionId === questionId) {
        setSelectedQuestionId(null);
      }
    } catch (error) {
      console.error(error);
      alert("Could not delete the question.");
    }
  }

  async function saveSelectedQuestion() {
    if (!selectedQuestion) return;

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/api/questions/${selectedQuestion.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: selectedQuestion.title,
            type: selectedQuestion.type,
            required: selectedQuestion.required,
            description: selectedQuestion.description,
            settings: selectedQuestion.settings,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not save question");
      }

      const updatedQuestion = await response.json();

      setQuestions((previous) =>
        previous.map((question) =>
          question.id === selectedQuestion.id
            ? {
                ...question,
                ...updatedQuestion,
              }
            : question
        )
      );

      alert("Question saved!");
    } catch (error) {
      console.error(error);
      alert("Could not save the question.");
    } finally {
      setSaving(false);
    }
  }

  function updateSelectedQuestion(
    changes: Partial<Question>
  ) {
    if (!selectedQuestionId) return;

    setQuestions((previous) =>
      previous.map((question) =>
        question.id === selectedQuestionId
          ? {
              ...question,
              ...changes,
            }
          : question
      )
    );
  }

  async function addOption() {
    if (!selectedQuestion) return;

    try {
      const response = await fetch(
        `${API_URL}/api/questions/${selectedQuestion.id}/options`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            label: `Option ${
              (selectedQuestion.options?.length ?? 0) + 1
            }`,
            value: `option_${
              (selectedQuestion.options?.length ?? 0) + 1
            }`,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not add option");
      }

      const option = await response.json();

      updateSelectedQuestion({
        options: [...(selectedQuestion.options ?? []), option],
      });
    } catch (error) {
      console.error(error);
      alert("Could not add option.");
    }
  }

  async function updateOption(option: Option, label: string) {
    try {
      const response = await fetch(
        `${API_URL}/api/options/${option.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            label,
            value: label.toLowerCase().replace(/\s+/g, "_"),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update option");
      }

      const updatedOption = await response.json();

      updateSelectedQuestion({
        options: (selectedQuestion?.options ?? []).map((item) =>
          item.id === option.id ? updatedOption : item
        ),
      });
    } catch (error) {
      console.error(error);
    }
  }

  async function deleteOption(optionId: number) {
    try {
      const response = await fetch(
        `${API_URL}/api/options/${optionId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete option");
      }

      updateSelectedQuestion({
        options: (selectedQuestion?.options ?? []).filter(
          (option) => option.id !== optionId
        ),
      });
    } catch (error) {
      console.error(error);
      alert("Could not delete option.");
    }
  }

  async function publishForm() {
    try {
      setPublishing(true);

      await saveForm();

      const response = await fetch(
        `${API_URL}/api/forms/${formId}/publish`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Could not publish form");
      }

      const data = await response.json();

      setForm((previous) =>
        previous
          ? {
              ...previous,
              is_published: true,
            }
          : previous
      );

      alert(
        `Form published!\n\nPublic link:\n${window.location.origin}/f/${data.slug ?? form?.slug}`
      );
    } catch (error) {
      console.error(error);
      alert("Could not publish the form.");
    } finally {
      setPublishing(false);
    }
  }

  function renderPreviewQuestion(question: Question) {
    switch (question.type) {
      case "short_text":
        return (
          <input
            className="w-full border-b-2 border-gray-300 bg-transparent py-3 text-xl outline-none focus:border-black"
            placeholder="Type your answer here..."
          />
        );

      case "long_text":
        return (
          <textarea
            className="w-full rounded-xl border border-gray-300 p-4 text-lg outline-none focus:border-black"
            rows={5}
            placeholder="Type your answer here..."
          />
        );

      case "email":
        return (
          <input
            type="email"
            className="w-full border-b-2 border-gray-300 bg-transparent py-3 text-xl outline-none focus:border-black"
            placeholder="name@example.com"
          />
        );

      case "number":
        return (
          <input
            type="number"
            className="w-full border-b-2 border-gray-300 bg-transparent py-3 text-xl outline-none focus:border-black"
            placeholder="Type a number..."
          />
        );

      case "yes_no":
        return (
          <div className="flex gap-3">
            <button className="rounded-xl border border-gray-300 px-6 py-4 hover:border-black">
              Yes
            </button>
            <button className="rounded-xl border border-gray-300 px-6 py-4 hover:border-black">
              No
            </button>
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((number) => (
              <button
                key={number}
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 hover:border-black"
              >
                {number}
              </button>
            ))}
          </div>
        );

      case "multiple_choice":
        return (
          <div className="space-y-3">
            {(question.options ?? []).map((option) => (
              <button
                key={option.id}
                className="block w-full rounded-xl border border-gray-300 p-4 text-left hover:border-black"
              >
                {option.label}
              </button>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <select className="w-full rounded-xl border border-gray-300 p-4 text-lg">
            <option>Select an option</option>
            {(question.options ?? []).map((option) => (
              <option key={option.id}>{option.label}</option>
            ))}
          </select>
        );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-lg">Loading builder...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Form not found.
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <div className="flex h-16 items-center justify-between border-b bg-white px-6">
          <button
            onClick={() => setPreviewMode(false)}
            className="flex items-center gap-2 text-gray-700 hover:text-black"
          >
            <ArrowLeft size={18} />
            Back to builder
          </button>

          <span className="font-medium">Preview</span>

          <div className="w-32" />
        </div>

        <div className="mx-auto max-w-3xl px-6 py-20">
          <h1 className="mb-4 text-5xl font-bold">{form.title}</h1>

          {form.description && (
            <p className="mb-12 text-lg text-gray-600">
              {form.description}
            </p>
          )}

          <div className="space-y-12">
            {questions.map((question, index) => (
              <div key={question.id}>
                <div className="mb-4 text-sm text-gray-500">
                  {index + 1} of {questions.length}
                </div>

                <h2 className="mb-3 text-2xl font-semibold">
                  {question.title}
                  {question.required && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </h2>

                {question.description && (
                  <p className="mb-5 text-gray-500">
                    {question.description}
                  </p>
                )}

                {renderPreviewQuestion(question)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* TOP BAR */}
      <header className="flex h-[72px] items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <input
              value={form.title}
              onChange={(event) =>
                setForm({
                  ...form,
                  title: event.target.value,
                })
              }
              className="w-[280px] border-none bg-transparent text-lg font-semibold outline-none"
            />

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="h-2 w-2 rounded-full bg-gray-400" />
              {form.is_published ? "Published" : "Draft"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2 rounded-xl border bg-white px-5 py-3 hover:bg-gray-50"
          >
            <Eye size={18} />
            Preview
          </button>

          <button
            onClick={saveForm}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl border bg-white px-5 py-3 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={publishForm}
            disabled={publishing}
            className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            <Send size={18} />
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-72px)] grid-cols-[280px_minmax(500px,1fr)_360px]">
        {/* LEFT SIDEBAR */}
        <aside className="border-r bg-white p-5">
          <div className="mb-7">
            <p className="text-xs font-semibold tracking-[0.2em] text-gray-500">
              CONTENT
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Add a question to your form
            </p>
          </div>

          <div className="space-y-2">
            {QUESTION_TYPES.map((item) => (
              <button
                key={item.type}
                onClick={() => addQuestion(item.type)}
                className="flex w-full items-center gap-4 rounded-xl p-3 text-left hover:bg-gray-100"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f1ee]">
                  {getIcon(item.type)}
                </span>

                <span>
                  <span className="block font-semibold">{item.label}</span>
                  <span className="block text-xs text-gray-500">
                    {item.description}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 rounded-xl bg-[#f5f5f2] p-4">
            <div className="flex items-center gap-2 font-medium">
              <Settings size={17} />
              More settings
            </div>
          </div>
        </aside>

        {/* CENTER */}
        <main className="overflow-y-auto px-12 py-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10">
              <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gray-400">
                FORM CONTENT
              </p>

              <h1 className="text-4xl font-bold">{form.title}</h1>

              <p className="mt-2 text-gray-500">
                Add and arrange questions. Select a question to edit its
                settings.
              </p>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => {
                const selected = question.id === selectedQuestionId;

                return (
                  <div
                    key={question.id}
                    onClick={() => setSelectedQuestionId(question.id)}
                    className={`group cursor-pointer rounded-2xl border bg-white p-6 shadow-sm transition ${
                      selected
                        ? "border-black ring-1 ring-black"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 cursor-grab text-gray-300">
                        <GripVertical size={20} />
                      </div>

                      <div className="flex-1">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {getTypeLabel(question.type)}
                          </span>

                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteQuestion(question.id);
                            }}
                            className="rounded-lg p-2 text-gray-300 opacity-0 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <h2 className="text-xl font-semibold">
                          {question.title}
                        </h2>

                        {question.description && (
                          <p className="mt-2 text-sm text-gray-500">
                            {question.description}
                          </p>
                        )}

                        {question.required && (
                          <span className="mt-3 inline-block text-xs text-gray-500">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => addQuestion("short_text")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 py-6 text-gray-500 hover:border-gray-500 hover:bg-white"
              >
                <Plus size={19} />
                Add question
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT SETTINGS PANEL */}
        <aside className="border-l bg-white p-6">
          {!selectedQuestion ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <Settings size={32} className="mb-4" />

              <p className="font-medium text-gray-600">
                Select a question
              </p>

              <p className="mt-2 max-w-[220px] text-sm">
                Click any question in the form to edit its title, description,
                type and settings.
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.15em] text-gray-400">
                    QUESTION SETTINGS
                  </p>
                  <p className="mt-1 font-semibold">
                    {getTypeLabel(selectedQuestion.type)}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedQuestionId(null)}
                  className="rounded-lg p-2 hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* QUESTION TITLE */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold">
                  Question
                </label>

                <textarea
                  value={selectedQuestion.title}
                  onChange={(event) =>
                    updateSelectedQuestion({
                      title: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 p-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="Enter your question..."
                />
              </div>

              {/* DESCRIPTION */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold">
                  Description
                </label>

                <textarea
                  value={selectedQuestion.description ?? ""}
                  onChange={(event) =>
                    updateSelectedQuestion({
                      description: event.target.value || null,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-gray-300 p-3 outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="Add a description (optional)"
                />
              </div>

              {/* TYPE */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold">
                  Question type
                </label>

                <select
                  value={selectedQuestion.type}
                  onChange={(event) =>
                    updateSelectedQuestion({
                      type: event.target.value as QuestionType,
                    })
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white p-3 outline-none focus:border-black"
                >
                  {QUESTION_TYPES.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* REQUIRED */}
              <div className="mb-7 flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div>
                  <p className="font-medium">Required</p>
                  <p className="text-xs text-gray-500">
                    Respondent must answer this question
                  </p>
                </div>

                <button
                  onClick={() =>
                    updateSelectedQuestion({
                      required: !selectedQuestion.required,
                    })
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    selectedQuestion.required
                      ? "bg-black"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      selectedQuestion.required
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* OPTIONS */}
              {(selectedQuestion.type === "multiple_choice" ||
                selectedQuestion.type === "dropdown") && (
                <div className="mb-7">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold">
                      Options
                    </label>

                    <button
                      onClick={addOption}
                      className="text-sm font-medium hover:underline"
                    >
                      + Add
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(selectedQuestion.options ?? []).map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-2"
                      >
                        <input
                          defaultValue={option.label}
                          onBlur={(event) =>
                            updateOption(
                              option,
                              event.target.value
                            )
                          }
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 p-2.5 text-sm outline-none focus:border-black"
                        />

                        <button
                          onClick={() => deleteOption(option.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAVE BUTTON */}
              <button
                onClick={saveSelectedQuestion}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                <Save size={17} />
                {saving ? "Saving..." : "Save question"}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}