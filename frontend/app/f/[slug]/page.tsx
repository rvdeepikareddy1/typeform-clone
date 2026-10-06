"use client";

import { useEffect, useState, type KeyboardEvent } from "react";

import { useParams } from "next/navigation";

import {

  ArrowLeft,

  ArrowRight,

  Check,

  Loader2,

} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type Option = {

  id: number;

  label: string;

  value: string;

  position: number;

};

type Question = {

  id: number;

  title: string;

  description: string | null;

  type:

    | "short_text"

    | "long_text"

    | "multiple_choice"

    | "dropdown"

    | "email"

    | "number"

    | "yes_no"

    | "rating";

  required: boolean;

  position: number;

  options: Option[];

};

type PublicForm = {

  id: number;

  title: string;

  description: string | null;

  slug: string;

  status: string;

  questions: Question[];

};

type Answer = {

  question_id: number;

  value: string;

};

export default function PublicFormPage() {

  const params = useParams();

  const slug = String(params.slug);

  const [form, setForm] = useState<PublicForm | null>(null);

  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<Answer[]>([]);

  const [currentValue, setCurrentValue] = useState("");

  const [error, setError] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {

    loadForm();

  }, [slug]);

  async function loadForm() {

    try {

      setLoading(true);

      const response = await fetch(

        `${API_URL}/api/public/forms/${slug}`

      );

      if (!response.ok) {

        throw new Error("Form not found");

      }

      const data: PublicForm = await response.json();

      setForm(data);

      if (data.questions.length > 0) {

        setCurrentValue("");

      }

    } catch (error) {

      console.error(error);

      setForm(null);

    } finally {

      setLoading(false);

    }

  }

  if (loading) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="flex items-center gap-3 text-gray-600">

          <Loader2 className="animate-spin" size={20} />

          Loading form...

        </div>

      </div>

    );

  }

  if (!form) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">

        <div className="text-center">

          <h1 className="text-3xl font-bold">

            Form not found

          </h1>

          <p className="mt-3 text-gray-500">

            This form may not exist or may not be published yet.

          </p>

        </div>

      </div>

    );

  }

  if (submitted) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">

        <div className="w-full max-w-2xl text-center">

          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-black text-white">

            <Check size={38} />

          </div>

          <h1 className="text-5xl font-bold">

            Thank you!

          </h1>

          <p className="mt-5 text-lg text-gray-600">

            Your response has been successfully submitted.

          </p>

        </div>

      </div>

    );

  }

  if (form.questions.length === 0) {

    return (

      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <h1 className="text-3xl font-bold">

            {form.title}

          </h1>

          <p className="mt-3 text-gray-500">

            This form doesn't have any questions yet.

          </p>

        </div>

      </div>

    );

  }

  const question = form.questions[currentIndex];

  const progress =

    ((currentIndex + 1) / form.questions.length) * 100;

  function updateCurrentValue(value: string) {

    setCurrentValue(value);

    setError("");

  }

  function saveCurrentAnswer() {

    const existingAnswer = answers.find(

      (answer) => answer.question_id === question.id

    );

    if (existingAnswer) {

      setAnswers((previous) =>

        previous.map((answer) =>

          answer.question_id === question.id

            ? {

                ...answer,

                value: currentValue,

              }

            : answer

        )

      );

    } else {

      setAnswers((previous) => [

        ...previous,

        {

          question_id: question.id,

          value: currentValue,

        },

      ]);

    }

  }

  function getExistingAnswer(questionId: number) {

    return answers.find(

      (answer) => answer.question_id === questionId

    )?.value;

  }

  function validateCurrentAnswer() {

    if (

      question.required &&

      currentValue.trim() === ""

    ) {

      setError("Please answer this question.");

      return false;

    }

    if (

      question.type === "email" &&

      currentValue.trim() !== ""

    ) {

      const emailPattern =

        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(currentValue)) {

        setError("Please enter a valid email address.");

        return false;

      }

    }

    return true;

  }

  function goNext() {

    if (!validateCurrentAnswer()) {

      return;

    }

    saveCurrentAnswer();

    if (currentIndex < form!.questions.length - 1) {

      const nextQuestion = form!.questions[currentIndex + 1];

      setCurrentIndex(currentIndex + 1);

      setCurrentValue(

        getExistingAnswer(nextQuestion.id) ?? ""

      );

      setError("");

      return;

    }

    submitForm();

  }

  function goBack() {

    if (currentIndex === 0) {

      return;

    }

    saveCurrentAnswer();

    const previousQuestion =

      form!.questions[currentIndex - 1];

    setCurrentIndex(currentIndex - 1);

    setCurrentValue(

      getExistingAnswer(previousQuestion.id) ?? ""

    );

    setError("");

  }

  async function submitForm() {

    try {

      setSubmitting(true);

      setError("");

      const finalAnswers = answers.some(

        (answer) => answer.question_id === question.id

      )

        ? answers.map((answer) =>

            answer.question_id === question.id

              ? {

                  ...answer,

                  value: currentValue,

                }

              : answer

          )

        : [

            ...answers,

            {

              question_id: question.id,

              value: currentValue,

            },

          ];

      const response = await fetch(

        `${API_URL}/api/public/forms/${slug}/responses`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

          },

          body: JSON.stringify(finalAnswers),

        }

      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(

          data.detail || "Could not submit response"

        );

      }

      setAnswers(finalAnswers);

      setSubmitted(true);

    } catch (error) {

      console.error(error);

      setError(

        error instanceof Error

          ? error.message

          : "Could not submit your response."

      );

    } finally {

      setSubmitting(false);

    }

  }

  function handleKeyDown(

    event: KeyboardEvent

  ) {

    if (event.key === "Enter" && !event.shiftKey) {

      if (

        question.type !== "long_text"

      ) {

        event.preventDefault();

        goNext();

      }

    }

    if (event.key === "ArrowLeft") {

      if (

        question.type === "multiple_choice" ||

        question.type === "yes_no" ||

        question.type === "rating"

      ) {

        return;

      }

      if (currentIndex > 0) {

        goBack();

      }

    }

  }

  function renderQuestionInput() {

    switch (question.type) {

      case "short_text":

        return (

          <input

            autoFocus

            value={currentValue}

            onChange={(event) =>

              updateCurrentValue(event.target.value)

            }

            onKeyDown={handleKeyDown}

            placeholder="Type your answer here..."

            className="w-full border-b-2 border-gray-300 bg-transparent py-4 text-2xl outline-none transition focus:border-black"

          />

        );

      case "long_text":

        return (

          <textarea

            autoFocus

            value={currentValue}

            onChange={(event) =>

              updateCurrentValue(event.target.value)

            }

            placeholder="Type your answer here..."

            rows={5}

            className="w-full resize-none rounded-2xl border border-gray-300 bg-white p-5 text-xl outline-none transition focus:border-black"

          />

        );

      case "email":

        return (

          <input

            autoFocus

            type="email"

            value={currentValue}

            onChange={(event) =>

              updateCurrentValue(event.target.value)

            }

            onKeyDown={handleKeyDown}

            placeholder="name@example.com"

            className="w-full border-b-2 border-gray-300 bg-transparent py-4 text-2xl outline-none transition focus:border-black"

          />

        );

      case "number":

        return (

          <input

            autoFocus

            type="number"

            value={currentValue}

            onChange={(event) =>

              updateCurrentValue(event.target.value)

            }

            onKeyDown={handleKeyDown}

            placeholder="Type a number..."

            className="w-full border-b-2 border-gray-300 bg-transparent py-4 text-2xl outline-none transition focus:border-black"

          />

        );

      case "multiple_choice":

        return (

          <div className="space-y-3">

            {question.options.map(

              (option, index) => (

                <button

                  key={option.id}

                  onClick={() => {

                    updateCurrentValue(

                      option.value

                    );

                    setTimeout(() => {

                      goNext();

                    }, 150);

                  }}

                  className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left text-lg transition hover:border-black hover:bg-white ${

                    currentValue === option.value

                      ? "border-black bg-white"

                      : "border-gray-300"

                  }`}

                >

                  <span className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-400 text-sm">

                    {index + 1}

                  </span>

                  {option.label}

                </button>

              )

            )}

          </div>

        );

      case "dropdown":

        return (

          <select

            autoFocus

            value={currentValue}

            onChange={(event) =>

              updateCurrentValue(event.target.value)

            }

            className="w-full rounded-2xl border border-gray-300 bg-white p-5 text-xl outline-none focus:border-black"

          >

            <option value="">

              Select an option

            </option>

            {question.options.map(

              (option) => (

                <option

                  key={option.id}

                  value={option.value}

                >

                  {option.label}

                </option>

              )

            )}

          </select>

        );

      case "yes_no":

        return (

          <div className="grid grid-cols-2 gap-4">

            <button

              onClick={() => {

                updateCurrentValue("yes");

                setTimeout(() => {

                  goNext();

                }, 150);

              }}

              className={`rounded-2xl border p-6 text-xl transition hover:border-black hover:bg-white ${

                currentValue === "yes"

                  ? "border-black bg-white"

                  : "border-gray-300"

              }`}

            >

              Yes

            </button>

            <button

              onClick={() => {

                updateCurrentValue("no");

                setTimeout(() => {

                  goNext();

                }, 150);

              }}

              className={`rounded-2xl border p-6 text-xl transition hover:border-black hover:bg-white ${

                currentValue === "no"

                  ? "border-black bg-white"

                  : "border-gray-300"

              }`}

            >

              No

            </button>

          </div>

        );

      case "rating":

        return (

          <div className="flex flex-wrap gap-3">

            {[1, 2, 3, 4, 5].map(

              (number) => (

                <button

                  key={number}

                  onClick={() => {

                    updateCurrentValue(

                      String(number)

                    );

                    setTimeout(() => {

                      goNext();

                    }, 150);

                  }}

                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-xl transition hover:border-black hover:bg-white ${

                    currentValue === String(number)

                      ? "border-black bg-white"

                      : "border-gray-300"

                  }`}

                >

                  {number}

                </button>

              )

            )}

          </div>

        );

    }

  }

  return (

    <div className="min-h-screen bg-[#f7f7f5]">

      {/** PROGRESS  **/}

      <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-gray-200">

        <div

          className="h-full bg-black transition-all duration-300"

          style={{

            width: `${progress}%`,

          }}

        />

      </div>

      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 md:px-12">

        {/** FORM HEADER  **/}

        <header className="mb-16">

          <h1 className="text-xl font-bold">

            {form.title}

          </h1>

          {form.description && (

            <p className="mt-2 max-w-xl text-sm text-gray-500">

              {form.description}

            </p>

          )}

        </header>

        {/** QUESTION  **/}

        <div className="flex flex-1 items-center">

          <div className="w-full max-w-3xl">

            <div className="mb-5 flex items-center gap-3 text-sm text-gray-500">

              <span>

                {currentIndex + 1}

              </span>

              <span>/</span>

              <span>

                {form.questions.length}

              </span>

            </div>

            <h2 className="text-4xl font-bold leading-tight md:text-5xl">

              {question.title}

              {question.required && (

                <span className="ml-2 text-red-500">

                  *

                </span>

              )}

            </h2>

            {question.description && (

              <p className="mt-5 text-lg text-gray-500">

                {question.description}

              </p>

            )}

            <div className="mt-10">

              {renderQuestionInput()}

            </div>

            {error && (

              <p className="mt-4 text-sm font-medium text-red-600">

                {error}

              </p>

            )}

            {/** BUTTONS  **/}

            <div className="mt-10 flex items-center gap-3">

              {currentIndex > 0 && (

                <button

                  onClick={goBack}

                  disabled={submitting}

                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 font-medium hover:border-black disabled:opacity-50"

                >

                  <ArrowLeft size={17} />

                  Back

                </button>

              )}

              <button

                onClick={goNext}

                disabled={submitting}

                className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"

              >

                {submitting ? (

                  <>

                    <Loader2

                      size={17}

                      className="animate-spin"

                    />

                    Submitting...

                  </>

                ) : currentIndex ===

                  form!.questions.length - 1 ? (

                  <>

                    Submit

                    <Check size={17} />

                  </>

                ) : (

                  <>

                    OK

                    <ArrowRight size={17} />

                  </>

                )}

              </button>

              <span className="ml-2 text-xs text-gray-400">

                Press Enter ↵

              </span>

            </div>

          </div>

        </div>

        {/** FOOTER  **/}

        <footer className="mt-12 flex justify-between text-xs text-gray-400">

          <span>

            {currentIndex + 1} of{" "}

            {form.questions.length}

          </span>

          <span>

            Powered by Typeform Clone

          </span>

        </footer>

      </main>

    </div>

  );

}
