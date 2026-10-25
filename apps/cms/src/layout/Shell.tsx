import { Menu, PanelRightOpen } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { entorno } from "../lib/entorno";
import { Outlet } from "react-router";
import { usePreferencia } from "../lib/usePreferencia";
import { Boton } from "../ui/Boton";
import type { Permiso } from "@reddcom/convex/roles";
import { Sidebar } from "./Sidebar";
import { urlDelSitio, VistaPrevia } from "./VistaPrevia";
import { VistaPreviaContexto, type CampoEnPagina, type DestinoVistaPrevia } from "./contextoVistaPrevia";

// El sitio escucha este mensaje (src/scripts/resaltado.ts) y marca el campo.
const origenSitio = new URL(entorno.websiteUrl).origin;

/**
 * Tres paneles: sidebar, editor y vista previa.
 * - Desde 1280 px (xl) la vista previa va al lado; en pantallas menores
 *   no cabe junto al formulario y se ofrece abrirla en otra pestaña.
 * - Bajo 1024 px (lg) el sidebar pasa a un cajón que abre el botón de menú.
 */
export function Shell({ nombre, email, permisos }: { nombre: string; email: string; permisos: readonly Permiso[] }) {
  const [destino, setDestino] = useState<DestinoVistaPrevia | null>(null);
  const [version, setVersion] = useState(Date.now);
  const [previaVisible, alternarPrevia] = usePreferencia("cms:previa-visible", true);
  const [resaltarAlEscribir, setResaltarAlEscribir] = usePreferencia("cms:resaltar-al-escribir", true);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const marco = useRef<HTMLIFrameElement>(null);

  const recargar = useCallback(() => setVersion(Date.now()), []);
  const resaltar = useCallback((campo: CampoEnPagina) => {
    marco.current?.contentWindow?.postMessage({ tipo: "cms:resaltar", ...campo }, origenSitio);
  }, []);
  const contexto = useMemo(
    () => ({ mostrar: setDestino, recargar, resaltar, resaltarAlEscribir }),
    [recargar, resaltar, resaltarAlEscribir],
  );

  return (
    <VistaPreviaContexto.Provider value={contexto}>
      <div className="flex h-dvh overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar nombre={nombre} email={email} permisos={permisos} />
        </div>

        {menuAbierto && (
          <div className="fixed inset-0 z-40 flex lg:hidden">
            <Sidebar nombre={nombre} email={email} permisos={permisos} onNavegar={() => setMenuAbierto(false)} />
            <button
              type="button"
              aria-label="Cerrar menú"
              className="flex-1 bg-navy-950/40"
              onClick={() => setMenuAbierto(false)}
            />
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between gap-3 border-b border-linea bg-white px-4 py-2 lg:hidden">
            <Boton variante="fantasma" tamano="icono" aria-label="Abrir menú" onClick={() => setMenuAbierto(true)}>
              <Menu className="size-4" />
            </Boton>
            <span className="text-xs font-bold tracking-[0.3em]">REDDCOM</span>
            <span className="size-7" />
          </div>

          {destino && (
            <div className="flex justify-end gap-2 px-4 pt-4 sm:px-8 xl:hidden">
              <a
                href={urlDelSitio(destino)}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-primary-700 hover:underline"
              >
                Ver página en otra pestaña ↗
              </a>
            </div>
          )}
          {destino && !previaVisible && (
            <div className="hidden justify-end px-8 pt-4 xl:flex">
              <Boton tamano="sm" onClick={() => alternarPrevia(true)}>
                <PanelRightOpen className="size-3.5" /> Mostrar vista previa
              </Boton>
            </div>
          )}

          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>

        {destino && previaVisible && (
          <aside className="hidden w-[42%] max-w-[760px] shrink-0 border-l border-linea bg-surface xl:block">
            <VistaPrevia
              destino={destino}
              version={version}
              marco={marco}
              resaltarAlEscribir={resaltarAlEscribir}
              onAlternarResaltado={() => setResaltarAlEscribir(!resaltarAlEscribir)}
              onRecargar={recargar}
              onOcultar={() => alternarPrevia(false)}
            />
          </aside>
        )}
      </div>
    </VistaPreviaContexto.Provider>
  );
}
