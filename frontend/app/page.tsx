"use client";



import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {

  BarChart3,

  Copy,

  ExternalLink,

  Edit3,

  FileText,

  MoreHorizontal,

  Plus,

  Search,

  Trash2,

} from "lucide-react";



const API_URL = "http://127.0.0.1:8000";



type Form = {

  id: number;

  title: string;

  description: string | null;

  slug: string;

  status: "draft" | "published";

  created_at: string;

  response_count?: number;

};



type FormResponse = {

  id: number;

  form_id: number;

  submitted_at: string;

};



export default function Dashboard() {

  const router = useRouter();



  const [forms, setForms] = useState<Form[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [menuOpen, setMenuOpen] = useState<number | null>(null);



  async function loadForms() {

    try {

      setLoading(true);



      const response = await fetch(`${API_URL}/api/forms/`);



      if (!response.ok) {

        throw new Error("Could not load forms");

      }



      const formData: Form[] = await response.json();



      const formsWithCounts = await Promise.all(

        formData.map(async (form) => {

          try {

            const responseResult = await fetch(

              `${API_URL}/api/forms/${form.id}/responses`

            );



            if (!responseResult.ok) {

              return {

                ...form,

                response_count: 0,

              };

            }



            const responses: FormResponse[] =

              await responseResult.json();



            return {

              ...form,

              response_count: responses.length,

            };

          } catch {

            return {

              ...form,

              response_count: 0,

            };

          }

        })

      );



      setForms(formsWithCounts);

    } catch (error) {

      console.error(error);

      alert("Could not load forms.");

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    loadForms();

  }, []);



  // ---------------------------------------------------------

  // CREATE FORM

  // ---------------------------------------------------------

  async function createForm() {

    const title = window.prompt(

      "Enter a name for your form:"

    );



    if (!title || !title.trim()) {

      return;

    }



    try {

      const response = await fetch(

        `${API_URL}/api/forms/?title=${encodeURIComponent(

          title.trim()

        )}`,

        {

          method: "POST",

        }

      );



      if (!response.ok) {

        throw new Error("Could not create form");

      }



      const newForm = await response.json();



      router.push(`/builder/${newForm.id}`);

    } catch (error) {

      console.error(error);

      alert("Could not create the form.");

    }

  }



  // ---------------------------------------------------------

  // DELETE FORM

  // ---------------------------------------------------------

  async function deleteForm(formId: number) {

    const form = forms.find(

      (item) => item.id === formId

    );



    if (!form) return;



    const confirmed = window.confirm(

      `Are you sure you want to delete "${form.title}"?`

    );



    if (!confirmed) {

      return;

    }



    try {

      const response = await fetch(

        `${API_URL}/api/forms/${formId}`,

        {

          method: "DELETE",

        }

      );



      if (!response.ok) {

        throw new Error("Could not delete form");

      }



      setForms((previous) =>

        previous.filter(

          (item) => item.id !== formId

        )

      );



      setMenuOpen(null);

    } catch (error) {

      console.error(error);

      alert("Could not delete the form.");

    }

  }



  // ---------------------------------------------------------

  // DUPLICATE FORM

  // ---------------------------------------------------------

  async function duplicateForm(form: Form) {

    try {

      const response = await fetch(

        `${API_URL}/api/forms/${form.id}/duplicate`,

        {

          method: "POST",

        }

      );



      if (!response.ok) {

        throw new Error("Could not duplicate form");

      }



      await loadForms();



      setMenuOpen(null);

    } catch (error) {

      console.error(error);

      alert("Could not duplicate the form.");

    }

  }



  // ---------------------------------------------------------

  // PUBLISH / UNPUBLISH

  // ---------------------------------------------------------

  async function togglePublish(form: Form) {

    try {

      const endpoint =

        form.status === "published"

          ? `${API_URL}/api/forms/${form.id}/unpublish`

          : `${API_URL}/api/forms/${form.id}/publish`;



      const response = await fetch(endpoint, {

        method: "POST",

      });



      if (!response.ok) {

        throw new Error(

          "Could not update form status"

        );

      }



      await loadForms();



      setMenuOpen(null);

    } catch (error) {

      console.error(error);

      alert("Could not update the form status.");

    }

  }



  // ---------------------------------------------------------

  // OPEN PUBLIC FORM

  // ---------------------------------------------------------

  function openPublicForm(form: Form) {

    window.open(

      `/f/${form.slug}`,

      "_blank"

    );

  }



  // ---------------------------------------------------------

  // FILTER

  // ---------------------------------------------------------

  const filteredForms = useMemo(() => {

    const query = search.trim().toLowerCase();



    if (!query) {

      return forms;

    }



    return forms.filter((form) =>

      form.title.toLowerCase().includes(query)

    );

  }, [forms, search]);



  return (

    <div

      className="min-h-screen bg-[#f7f7f5]"

      onClick={() => setMenuOpen(null)}

    >

      {/* HEADER */}

      <header className="flex h-[72px] items-center justify-between border-b bg-white px-6">

        <div className="flex items-center gap-3">

          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">

            T

          </div>



          <span className="text-lg font-semibold">

            Typeform Clone

          </span>

        </div>



        <button

          onClick={(event) => {

            event.stopPropagation();

            createForm();

          }}

          className="flex items-center gap-2 rounded-xl bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"

        >

          <Plus size={18} />

          Create form

        </button>

      </header>



      <div className="flex min-h-[calc(100vh-72px)]">

        {/* SIDEBAR */}

        <aside className="hidden w-64 border-r bg-white p-5 md:block">

          <nav className="space-y-2">

            <div className="flex items-center gap-3 rounded-xl bg-[#f1f1ee] px-4 py-3 font-medium">

              <FileText size={18} />

              My forms

            </div>



            <button

              onClick={createForm}

              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-gray-600 hover:bg-gray-100"

            >

              <Plus size={18} />

              Create new

            </button>

          </nav>

        </aside>



        {/* MAIN */}

        <main className="flex-1 px-6 py-10 md:px-10">

          <div className="mx-auto max-w-6xl">

            {/* TITLE */}

            <div className="mb-8">

              <h1 className="text-4xl font-bold">

                My forms

              </h1>



              <p className="mt-2 text-gray-500">

                Create, manage and analyze your forms.

              </p>

            </div>



            {/* SEARCH */}

            <div className="mb-8 flex items-center gap-4">

              <div className="relative max-w-md flex-1">

                <Search

                  size={18}

                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"

                />



                <input

                  value={search}

                  onChange={(event) =>

                    setSearch(event.target.value)

                  }

                  placeholder="Search forms..."

                  className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-11 pr-4 outline-none focus:border-black focus:ring-1 focus:ring-black"

                />

              </div>



              <span className="text-sm text-gray-500">

                {forms.length}{" "}

                {forms.length === 1

                  ? "form"

                  : "forms"}

              </span>

            </div>



            {/* LOADING */}

            {loading ? (

              <div className="flex min-h-[300px] items-center justify-center">

                <p className="text-gray-500">

                  Loading forms...

                </p>

              </div>

            ) : filteredForms.length === 0 ? (

              /* EMPTY STATE */

              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f1ee]">

                  <FileText size={28} />

                </div>



                <h2 className="mt-6 text-2xl font-semibold">

                  {search

                    ? "No forms found"

                    : "Create your first form"}

                </h2>



                <p className="mx-auto mt-2 max-w-md text-gray-500">

                  {search

                    ? "Try a different search term."

                    : "Start building a beautiful conversational form in just a few clicks."}

                </p>



                {!search && (

                  <button

                    onClick={createForm}

                    className="mt-6 rounded-xl bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"

                  >

                    Create form

                  </button>

                )}

              </div>

            ) : (

              /* FORM GRID */

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {filteredForms.map((form) => (

                  <div

                    key={form.id}

                    className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-gray-400 hover:shadow-sm"

                  >

                    {/* MENU */}

                    <div className="absolute right-4 top-4">

                      <button

                        onClick={(event) => {

                          event.stopPropagation();



                          setMenuOpen(

                            menuOpen === form.id

                              ? null

                              : form.id

                          );

                        }}

                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-black"

                      >

                        <MoreHorizontal size={19} />

                      </button>



                      {menuOpen === form.id && (

                        <div

                          onClick={(event) =>

                            event.stopPropagation()

                          }

                          className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"

                        >

                          <button

                            onClick={() => {

                              router.push(

                                `/builder/${form.id}`

                              );

                            }}

                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"

                          >

                            <Edit3 size={16} />

                            Edit form

                          </button>



                          <button

                            onClick={() =>

                              duplicateForm(form)

                            }

                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"

                          >

                            <Copy size={16} />

                            Duplicate

                          </button>



                          <button

                            onClick={() =>

                              togglePublish(form)

                            }

                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"

                          >

                            <BarChart3 size={16} />

                            {form.status ===

                            "published"

                              ? "Unpublish"

                              : "Publish"}

                          </button>



                          {form.status ===

                            "published" && (

                            <button

                              onClick={() =>

                                openPublicForm(form)

                              }

                              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"

                            >

                              <ExternalLink

                                size={16}

                              />

                              Open form

                            </button>

                          )}



                          <button

                            onClick={() =>

                              deleteForm(form.id)

                            }

                            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50"

                          >

                            <Trash2 size={16} />

                            Delete

                          </button>

                        </div>

                      )}

                    </div>



                    {/* FORM ICON */}

                    <button

                      onClick={() =>

                        router.push(

                          `/builder/${form.id}`

                        )

                      }

                      className="text-left"

                    >

                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f1ee]">

                        <FileText size={22} />

                      </div>



                      <h2 className="mt-5 pr-8 text-xl font-semibold">

                        {form.title}

                      </h2>

                    </button>



                    {/* STATUS */}

                    <div className="mt-4 flex items-center gap-2">

                      <span

                        className={`h-2 w-2 rounded-full ${

                          form.status ===

                          "published"

                            ? "bg-green-500"

                            : "bg-gray-400"

                        }`}

                      />



                      <span className="text-sm text-gray-500">

                        {form.status ===

                        "published"

                          ? "Published"

                          : "Draft"}

                      </span>

                    </div>



                    {/* FOOTER */}

                    <div className="mt-6 flex items-center justify-between border-t pt-5">

                      <button

                        onClick={() =>

                          router.push(

                            `/forms/${form.id}/responses`

                          )

                        }

                        className="text-sm font-medium text-gray-600 hover:text-black hover:underline"

                      >

                        {form.response_count ?? 0}{" "}

                        {form.response_count === 1

                          ? "response"

                          : "responses"}

                      </button>



                      <button

                        onClick={() =>

                          router.push(

                            `/builder/${form.id}`

                          )

                        }

                        className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"

                      >

                        Edit

                      </button>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </main>

      </div>

    </div>

  );

}