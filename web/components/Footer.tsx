"use client";

import { trackEvent } from "@/lib/analytics";

export default function Footer() {
  return (
    <footer className="bg-[#f8f9fa] border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Section */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">
              За контакти
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span aria-label="Адрес">📍</span> Адрес: гр. София 1505, бул.
                "Мадрид" № 1
              </p>
              <p>
                <span aria-label="Телефон">📞</span> Телефон (централа): 02/
                943-18-40
              </p>
              <p>
                <span aria-label="Имейл">✉️</span> E-mail:
                oborishte@rayon-oborishte.bg
              </p>
            </div>
          </div>

          {/* Useful Links Section */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">
              Полезни връзки
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="font-semibold text-gray-900">Район Оборище</p>
                <a
                  href="https://rayon-oborishte.bg/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5DADE2] hover:underline"
                  onClick={() => {
                    trackEvent({
                      name: "external_link_clicked",
                      params: {
                        url: "https://rayon-oborishte.bg/",
                        location: "footer",
                        link_text: "Район Оборище",
                      },
                    });
                  }}
                >
                  rayon-oborishte.bg
                </a>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-gray-900">За проекта</h3>
            <div className="space-y-2 text-sm">
              <div>
                <a
                  href="/kak-se-rodi"
                  className="text-[#5DADE2] hover:underline"
                >
                  Как се роди?
                </a>
              </div>
              <div>
                <a href="/sources" className="text-[#5DADE2] hover:underline">
                  Източници на данни
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="mt-8 pt-6 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>
            <a
              href="https://github.com/vbuch/oborishte-map"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5DADE2] hover:underline"
              onClick={() => {
                trackEvent({
                  name: "external_link_clicked",
                  params: {
                    url: "https://github.com/vbuch/oborishte-map",
                    location: "footer",
                    link_text: "Отворен код",
                  },
                });
              }}
            >
              Отворен код
            </a>
            , разработен в Оборище с ❤️ за Оборище.
          </p>
        </div>
      </div>
    </footer>
  );
}
