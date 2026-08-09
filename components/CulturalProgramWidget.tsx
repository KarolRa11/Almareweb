"use client";

import { useEffect, useState } from "react";
import {
  IconBook,
  IconClock,
  IconHeart,
  IconMapPin,
  IconMasksTheater,
  IconMusic,
  IconPalette,
  IconSparkles,
  IconToolsKitchen2,
  IconTrophy,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

const benefits = [
  "Promueve la identidad cultural de Acapulco y Guerrero.",
  "Enriquece la experiencia turística de las familias.",
  "Impulsa el aprendizaje mediante actividades recreativas.",
  "Favorece la convivencia y preserva las tradiciones locales.",
];

const activities = [
  {
    title: "Máscaras de jaguar",
    description:
      "Decoración de máscaras inspiradas en el jaguar con materiales reciclados.",
    ages: "5 a 12 años",
    duration: "60 min",
    icon: IconMasksTheater,
  },
  {
    title: "Leyendas de Acapulco",
    description:
      "Cuentacuentos interactivo sobre La Quebrada y relatos tradicionales.",
    ages: "4 a 10 años",
    duration: "45 min",
    icon: IconBook,
  },
  {
    title: "Mini espectáculo de clavadistas",
    description:
      "Modelos, videos y figuras para conocer esta tradición emblemática.",
    ages: "5 a 12 años",
    duration: "40 min",
    icon: IconMapPin,
  },
  {
    title: "Danza regional",
    description:
      "Pasos básicos de sones y chilenas con accesorios tradicionales.",
    ages: "6 a 12 años",
    duration: "60 min",
    icon: IconMusic,
  },
  {
    title: "Tesoro cultural",
    description:
      "Búsqueda con pistas sobre playas, monumentos, gastronomía e historia.",
    ages: "6 a 12 años",
    duration: "60 min",
    icon: IconMapPin,
  },
  {
    title: "Sabores de Guerrero",
    description:
      "Cocina infantil con dulces tradicionales, cocadas y alegrías.",
    ages: "5 a 12 años",
    duration: "60 min",
    icon: IconToolsKitchen2,
  },
  {
    title: "Pintando el atardecer",
    description:
      "Creación de pinturas inspiradas en la bahía y los paisajes de Acapulco.",
    ages: "4 a 12 años",
    duration: "50 min",
    icon: IconPalette,
  },
  {
    title: "Artesanías marinas",
    description:
      "Recuerdos con conchas autorizadas y materiales ecológicos.",
    ages: "5 a 12 años",
    duration: "60 min",
    icon: IconSparkles,
  },
  {
    title: "Rally Conoce Acapulco",
    description:
      "Preguntas por equipos sobre historia, playas, gastronomía y tradiciones.",
    ages: "7 a 12 años",
    duration: "50 min",
    icon: IconTrophy,
  },
  {
    title: "Festival infantil guerrerense",
    description:
      "Cierre familiar con danzas, canciones y artesanías creadas durante la estancia.",
    ages: "Todas las edades",
    duration: "90 min",
    icon: IconHeart,
  },
];

export default function CulturalProgramWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-8.5rem)] items-center gap-2 rounded-2xl border-4 border-white bg-gradient-to-br from-alm-teal to-alm-mid px-3 py-2.5 text-left text-white shadow-2xl transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-alm-pastel dark:border-alm-dark sm:bottom-7 sm:right-7 sm:max-w-none sm:gap-3 sm:px-4 sm:py-3"
        aria-haspopup="dialog"
        aria-controls="programa-guardianes-dialog"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 sm:h-12 sm:w-12">
          <IconSparkles size={26} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs font-black leading-tight sm:text-sm">
            Pequeños Guardianes
          </span>
          <span className="hidden text-[10px] text-white/80 sm:block">
            Cultura y diversión infantil
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-alm-dark/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <section
            id="programa-guardianes-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="programa-guardianes-title"
            className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-[#133545] sm:max-w-5xl sm:rounded-3xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar programa infantil"
              className="sticky right-4 top-4 z-10 float-right mr-4 mt-4 rounded-full border border-alm-beige-mid bg-white p-2.5 text-gray-500 shadow-sm hover:bg-alm-beige-light dark:border-alm-mid dark:bg-alm-dark dark:text-white"
            >
              <IconX size={22} />
            </button>

            <header className="bg-gradient-to-br from-alm-beige-light to-alm-pastel/30 px-5 pb-7 pt-8 dark:from-alm-dark dark:to-alm-mid/60 sm:px-9 sm:pb-9 sm:pt-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-alm-teal/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-alm-teal">
                <IconSparkles size={15} /> Turismo cultural infantil
              </span>
              <h2
                id="programa-guardianes-title"
                className="mt-4 max-w-3xl pr-12 text-2xl font-black leading-tight text-alm-dark dark:text-white sm:text-4xl"
              >
                Pequeños Guardianes de Acapulco
              </h2>
              <p className="mt-2 max-w-3xl font-bold text-alm-mid dark:text-alm-pastel">
                Jugando, aprendiendo y conservando nuestra cultura
              </p>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-alm-beige-mid">
                Una actividad diferente durante la estancia de las familias para
                acercar a niñas y niños a la cultura de Acapulco mediante juegos,
                arte, gastronomía y tradiciones.
              </p>
            </header>

            <div className="px-5 py-7 sm:px-9 sm:py-9">
              <section aria-labelledby="beneficios-programa-title">
                <h3
                  id="beneficios-programa-title"
                  className="text-lg font-black text-alm-dark dark:text-white"
                >
                  Lo que aporta la experiencia
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {benefits.map((benefit) => (
                    <p
                      key={benefit}
                      className="flex items-start gap-2 rounded-2xl bg-alm-beige-light p-4 text-sm leading-relaxed text-gray-600 dark:bg-alm-dark dark:text-alm-beige-mid"
                    >
                      <IconHeart
                        size={18}
                        className="mt-0.5 shrink-0 text-alm-teal"
                      />
                      {benefit}
                    </p>
                  ))}
                </div>
              </section>

              <section className="mt-8" aria-labelledby="actividades-programa-title">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.2em] text-alm-teal">
                    Programa durante la estancia
                  </p>
                  <h3
                    id="actividades-programa-title"
                    className="mt-1 text-xl font-black text-alm-dark dark:text-white"
                  >
                    Actividades culturales
                  </h3>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {activities.map((activity) => {
                    const ActivityIcon = activity.icon;
                    return (
                      <article
                        key={activity.title}
                        className="rounded-2xl border border-alm-beige-mid p-4 dark:border-alm-mid"
                      >
                        <div className="flex items-start gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-alm-teal/10 text-alm-teal">
                            <ActivityIcon size={21} />
                          </span>
                          <div className="min-w-0">
                            <h4 className="font-black text-alm-dark dark:text-white">
                              {activity.title}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-alm-beige-mid">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-alm-mid dark:text-alm-pastel">
                          <span className="inline-flex items-center gap-1 rounded-full bg-alm-beige-light px-2.5 py-1 dark:bg-alm-dark">
                            <IconUsers size={13} /> {activity.ages}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-alm-beige-light px-2.5 py-1 dark:bg-alm-dark">
                            <IconClock size={13} /> {activity.duration}
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-xl bg-alm-teal px-6 py-3 text-sm font-black text-white transition hover:bg-alm-mid sm:w-auto"
                >
                  Cerrar información
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
