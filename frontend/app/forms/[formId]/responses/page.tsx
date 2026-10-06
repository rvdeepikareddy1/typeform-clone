"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  ChevronRight,
  FileText,
  Loader2,
  MessageSquare,
  Users,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type Form = {
  id: number;
  title: string;
  description: string | null;
  slug: string;
  status: string;
};

type Question = {
  id: number;
  title: string;
  type: string;
  required: boolean;
  position: number;
};

type ResponseItem = {
  id: number;
  form_id: number;
  submitted_at: string;
};

type Answer = {
  id: number;
  response_id: number;
  question_id: number;
  value: string | null;
};

type ResponseDetails = {
  id: number;
  form_id: number;
  submitted_at: string;
  answers: Answer[];
};

type StatsItem = {
  question_id: number;
  question: string;
  type: string;
  total_answers: number;
  counts: Record<string, number>;
};

type Stats = {
  form_id: number;
  stats: StatsItem[];
};

export default function ResponsesPage() {
  const params = useParams();
  const router = useRouter();

  const formId = Number(params.formId);

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<ResponseItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  const [selectedResponse, setSelectedResponse] =
    useState<ResponseDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!formId || Number.isNaN(formId)) {
      return;
    }

    loadData();
  }, [formId]);

  async function loadData() {
    try {
      setLoading(true);
      setErrorMessage(null);

      if (!formId || Number.isNaN(formId)) {
        throw new Error("Invalid form ID");
      }

      const formResponse = await fetch(
        `${API_URL}/api/forms/${formId}`,
        {
          cache: "no-store",
        }
      );

      if (!formResponse.ok) {
        const detail = await formResponse.text();

        throw new Error(
          `Form request failed (${formResponse.status})${
            detail ? `: ${detail}` : ""
          }`
        );
      }

      const formData = await formResponse.json();

      const questionsResponse = await fetch(
        `${API_URL}/api/forms/${formId}/questions`,
        {
          cache: "no-store",
        }
      );

      if (!questionsResponse.ok) {
        const detail = await questionsResponse.text();

        throw new Error(
          `Questions request failed (${questionsResponse.status})${
            detail ? `: ${detail}` : ""
          }`
        );
      }

      const questionData = await questionsResponse.json();

      const responsesResponse = await fetch(
        `${API_URL}/api/forms/${formId}/responses`,
        {
          cache: "no-store",
        }
      );

      if (!responsesResponse.ok) {
        const detail = await responsesResponse.text();

        throw new Error(
          `Responses request failed (${responsesResponse.status})${
            detail ? `: ${detail}` : ""
          }`
        );
      }

      const responseData = await responsesResponse.json();

      const normalizedQuestions = Array.isArray(questionData)
        ? questionData
        : Array.isArray(questionData?.questions)
          ? questionData.questions
          : [];

      const normalizedResponses = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.responses)
          ? responseData.responses
          : [];

      setForm(formData);
      setQuestions(normalizedQuestions);
      setResponses(normalizedResponses);

      try {
        const statsResponse = await fetch(
          `${API_URL}/api/forms/${formId}/stats`,
          {
            cache: "no-store",
          }
        );

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          setStats(null);
        }
      } catch (statsError) {
        console.error(
          "Could not load statistics:",
          statsError
        );

        setStats(null);
      }
    } catch (error) {
      console.error(
        "Could not load responses:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load responses."
      );
    } finally {
      setLoading(false);
    }
  }

  async function openResponse(responseId: number) {
    try {
      setLoadingResponse(true);
      setErrorMessage(null);

      const response = await fetch(
        `${API_URL}/api/forms/${formId}/responses/${responseId}`,
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        const detail = await response.text();

        throw new Error(
          `Response request failed (${response.status})${
            detail ? `: ${detail}` : ""
          }`
        );
      }

      const data = await response.json();

      setSelectedResponse(data);
    } catch (error) {
      console.error(
        "Could not load this response:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load this response."
      );
    } finally {
      setLoadingResponse(false);
    }
  }

  const questionMap = useMemo(() => {
    const map = new Map<number, Question>();

    questions.forEach((question) => {
      map.set(question.id, question);
    });

    return map;
  }, [questions]);

  function formatDate(dateString: string) {
    const normalizedDateString =
      dateString.endsWith("Z") ||
      /[+-]\d{2}:\d{2}$/.test(dateString)
        ? dateString
        : `${dateString}Z`;

    const date = new Date(normalizedDateString);

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  }

  function getAnswerPreview(responseId: number) {
    const response = responses.find(
      (item) => item.id === responseId
    );

    if (!response) {
      return "";
    }

    return `Response #${response.id}`;
  }

  function getDisplayAnswer(answer: Answer) {
    if (
      answer.value === null ||
      answer.value.trim() === ""
    ) {
      return "No answer";
    }

    const question = questionMap.get(
      answer.question_id
    );

    if (!question) {
      return answer.value;
    }

    if (question.type === "yes_no") {
      if (answer.value === "yes") {
        return "Yes";
      }

      if (answer.value === "no") {
        return "No";
      }
    }

    return answer.value;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading responses...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
        <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold">
            Could not load responses
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            The responses page could not get the data
            from the backend.
          </p>

          <div className="mt-5 rounded-xl bg-[#f7f7f5] p-4 text-sm text-gray-700">
            {errorMessage}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => loadData()}
              className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              Try again
            </button>

            <button
              onClick={() => router.push("/")}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50"
            >
              Back to forms
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            Form not found
          </h1>

          <button
            onClick={() => router.push("/")}
            className="mt-5 rounded-xl bg-black px-5 py-3 text-white"
          >
            Back to forms
          </button>
        </div>
      </div>
    );
  }

  if (selectedResponse) {
    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <header className="flex h-[72px] items-center justify-between border-b bg-white px-6">
          <button
            onClick={() =>
              setSelectedResponse(null)
            }
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-black"
          >
            <ArrowLeft size={18} />
            Back to responses
          </button>

          <div className="font-semibold">
            Response #{selectedResponse.id}
          </div>

          <div className="w-[150px]" />
        </header>

        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="mb-10">
            <p className="text-sm text-gray-500">
              {form.title}
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Response #{selectedResponse.id}
            </h1>

            <p className="mt-3 text-gray-500">
              Submitted{" "}
              {formatDate(
                selectedResponse.submitted_at
              )}
            </p>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const answer =
                selectedResponse.answers.find(
                  (item) =>
                    item.question_id === question.id
                );

              return (
                <div
                  key={question.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Question {index + 1}
                  </div>

                  <h2 className="text-lg font-semibold">
                    {question.title}
                  </h2>

                  <div className="mt-5 rounded-xl bg-[#f7f7f5] p-4 text-gray-700">
                    {answer
                      ? getDisplayAnswer(answer)
                      : "No answer"}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      <header className="flex h-[72px] items-center justify-between border-b bg-white px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="rounded-lg p-2 hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="font-semibold">
              {form.title}
            </h1>

            <p className="text-sm text-gray-500">
              Responses
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="rounded-xl border bg-white px-5 py-3 text-sm font-medium hover:bg-gray-50"
        >
          Back to forms
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold">
              Responses
            </h1>

            <span className="rounded-full bg-black px-3 py-1 text-sm font-medium text-white">
              {responses.length}
            </span>
          </div>

          <p className="mt-2 text-gray-500">
            View and analyze responses submitted to
            your form.
          </p>
        </div>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
              <Users size={20} />
            </div>

            <p className="text-sm text-gray-500">
              Total responses
            </p>

            <p className="mt-1 text-3xl font-bold">
              {responses.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
              <FileText size={20} />
            </div>

            <p className="text-sm text-gray-500">
              Questions
            </p>

            <p className="mt-1 text-3xl font-bold">
              {questions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f1ee]">
              <BarChart3 size={20} />
            </div>

            <p className="text-sm text-gray-500">
              Answered questions
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats
                ? stats.stats.reduce(
                    (total, item) =>
                      total + item.total_answers,
                    0
                  )
                : 0}
            </p>
          </div>
        </div>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare size={20} />

            <h2 className="text-xl font-semibold">
              All responses
            </h2>
          </div>

          {responses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f1ee]">
                <MessageSquare size={24} />
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                No responses yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-gray-500">
                Share your published form with
                respondents. Their responses will appear
                here.
              </p>

              <button
                onClick={() => router.push("/")}
                className="mt-6 rounded-xl bg-black px-5 py-3 text-white"
              >
                Back to forms
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              <div className="grid grid-cols-[100px_1fr_180px_50px] border-b bg-[#f7f7f5] px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div>ID</div>
                <div>Response</div>
                <div>Submitted</div>
                <div />
              </div>

              {responses.map((response) => (
                <button
                  key={response.id}
                  onClick={() =>
                    openResponse(response.id)
                  }
                  className="grid w-full grid-cols-[100px_1fr_180px_50px] items-center border-b px-5 py-5 text-left last:border-b-0 hover:bg-[#fafafa]"
                >
                  <div className="font-semibold">
                    #{response.id}
                  </div>

                  <div>
                    <p className="font-medium">
                      {getAnswerPreview(response.id)}
                    </p>

                    <p className="mt-1 text-sm text-gray-400">
                      Click to view answers
                    </p>
                  </div>

                  <div className="text-sm text-gray-500">
                    {formatDate(
                      response.submitted_at
                    )}
                  </div>

                  <div className="flex justify-end">
                    <ChevronRight
                      size={18}
                      className="text-gray-400"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}

          {loadingResponse && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/20">
              <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-lg">
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Loading response...
              </div>
            </div>
          )}
        </section>

        {stats && stats.stats.length > 0 && (
          <section className="mt-12">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Summary
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Overview of answers for each question.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {stats.stats.map((item) => (
                <div
                  key={item.question_id}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {item.type}
                  </div>

                  <h3 className="font-semibold">
                    {item.question}
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    {item.total_answers} answer
                    {item.total_answers === 1
                      ? ""
                      : "s"}
                  </p>

                  {Object.keys(item.counts).length >
                    0 && (
                    <div className="mt-5 space-y-3">
                      {Object.entries(
                        item.counts
                      ).map(
                        ([value, count]) => (
                          <div
                            key={value}
                            className="flex items-center justify-between rounded-lg bg-[#f7f7f5] px-4 py-3"
                          >
                            <span>{value}</span>

                            <span className="font-semibold">
                              {count}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}