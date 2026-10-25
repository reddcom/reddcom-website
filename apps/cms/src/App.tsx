import { api } from "@reddcom/convex/api";
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Navigate, Route, Routes } from "react-router";
import { Login, PantallaCarga, SinAcceso } from "./acceso/Acceso";
import { Puestos } from "./catalogos/Puestos";
import { Ubicaciones } from "./catalogos/Ubicaciones";
import { EditorPagina } from "./editor/EditorPagina";
import { Biblioteca } from "./imagenes/Biblioteca";
import { Bandeja } from "./mensajes/Bandeja";
import { Usuarios } from "./configuracion/Usuarios";
import { FormProyecto } from "./proyectos/FormProyecto";
import { ListaProyectos } from "./proyectos/ListaProyectos";
import { ListaPostulaciones } from "./postulaciones/ListaPostulaciones";
import { Shell } from "./layout/Shell";
import { FormVacante } from "./vacantes/FormVacante";
import { ListaVacantes } from "./vacantes/ListaVacantes";

export function App() {
  return (
    <>
      <AuthLoading>
        <PantallaCarga />
      </AuthLoading>
      <Unauthenticated>
        <Login />
      </Unauthenticated>
      <Authenticated>
        <ZonaEditor />
      </Authenticated>
    </>
  );
}

/** Con sesión iniciada: el correo debe estar dado de alta en Configuración → Usuarios (lo valida el servidor). */
function ZonaEditor() {
  const usuario = useQuery(api.auth.usuarioActual);
  if (usuario === undefined) return <PantallaCarga />;
  if (usuario === null) return <Login />;
  if (!usuario.rol) return <SinAcceso email={usuario.email} />;

  return (
    <Routes>
      <Route element={<Shell nombre={usuario.nombre} email={usuario.email} permisos={usuario.permisos} />}>
        <Route index element={<Navigate to="/paginas/inicio" replace />} />
        <Route path="paginas/:pagina" element={<EditorPagina />} />
        <Route path="vacantes" element={<ListaVacantes />} />
        <Route path="vacantes/:id" element={<FormVacante />} />
        <Route path="postulaciones" element={<ListaPostulaciones />} />
        <Route path="puestos" element={<Puestos />} />
        <Route path="ubicaciones" element={<Ubicaciones />} />
        <Route path="imagenes" element={<Biblioteca />} />
        <Route path="mensajes" element={<Bandeja />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="proyectos" element={<ListaProyectos />} />
        <Route path="proyectos/:id" element={<FormProyecto />} />
        <Route path="*" element={<Navigate to="/paginas/inicio" replace />} />
      </Route>
    </Routes>
  );
}
