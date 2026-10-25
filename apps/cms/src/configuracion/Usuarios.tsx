import { api } from "@reddcom/convex/api";
import type { Doc } from "@reddcom/convex/modelo";
import { roles, type Rol } from "@reddcom/convex/roles";
import { useAction, useMutation, useQuery } from "convex/react";
import { KeyRound, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { fechaLegible } from "../lib/formato";
import { useAccion } from "../lib/useAccion";
import { Boton } from "../ui/Boton";
import { CampoSelect, CampoTexto } from "../ui/Campo";
import { ConfirmarEliminar } from "../ui/ConfirmarEliminar";
import { Cargando, EncabezadoVista, MensajeError, Vacio } from "../ui/Estados";

const opcionesRol = Object.entries(roles).map(([valor, rol]) => ({ valor: valor as Rol, etiqueta: rol.nombre }));

/** Configuración → Usuarios: cuentas del CMS, su rol y su contraseña. */
export function Usuarios() {
  const usuarios = useQuery(api.usuarios.listar);
  const sesion = useQuery(api.auth.usuarioActual);

  return (
    <div className="space-y-6">
      <EncabezadoVista
        grupo="Configuración"
        titulo="Usuarios"
        detalle="Crea la cuenta con correo, contraseña y rol, y comparte las credenciales con la persona. Nadie puede registrarse por su cuenta."
      />

      <FormAgregar />

      {usuarios === undefined ? (
        <Cargando />
      ) : usuarios.length === 0 ? (
        <Vacio titulo="Aún no hay usuarios" />
      ) : (
        <ul className="divide-y divide-linea rounded-sm border border-linea bg-white">
          {usuarios.map((usuario) => (
            <li key={usuario._id}>
              <FilaUsuario usuario={usuario} esSesion={usuario.correo === sesion?.email.toLowerCase()} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FormAgregar() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState<Rol>("superAdmin");
  const agregar = useAccion(useAction(api.usuarios.agregar));
  const [creado, setCreado] = useState<string | null>(null);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setCreado(null);
    const correoCreado = await agregar.ejecutar({ correo, nombre, contrasena, rol });
    if (correoCreado === undefined) return;
    setCreado(correoCreado);
    setNombre("");
    setCorreo("");
    setContrasena("");
  }

  return (
    <form onSubmit={enviar} className="space-y-4 rounded-sm border border-linea bg-white p-4">
      <p className="text-sm font-semibold">Nueva cuenta</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto etiqueta="Nombre" valor={nombre} onChange={setNombre} />
        <CampoTexto etiqueta="Correo" tipo="email" placeholder="nombre@empresa.com" valor={correo} onChange={setCorreo} />
        <CampoTexto
          etiqueta="Contraseña"
          tipo="password"
          ayuda="Mínimo 8 caracteres. Compártela por un canal privado."
          valor={contrasena}
          onChange={setContrasena}
        />
        <CampoSelect etiqueta="Rol" valor={rol} opciones={opcionesRol} onChange={setRol} />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="mr-auto min-w-0">
          <MensajeError mensaje={agregar.error} />
          {creado && (
            <p role="status" className="text-xs text-primary-700">
              Cuenta creada para {creado}.
            </p>
          )}
        </div>
        <Boton type="submit" variante="primario" disabled={!correo.trim() || !contrasena || agregar.ocupado}>
          <UserPlus className="size-3.5" /> {agregar.ocupado ? "Creando…" : "Crear cuenta"}
        </Boton>
      </div>
    </form>
  );
}

function FilaUsuario({ usuario, esSesion }: { usuario: Doc<"usuarios">; esSesion: boolean }) {
  const cambiarRol = useAccion(useMutation(api.usuarios.cambiarRol));
  const quitar = useAccion(useAction(api.usuarios.quitar));
  const restablecer = useAccion(useAction(api.usuarios.restablecer));
  const [nuevaContrasena, setNuevaContrasena] = useState<string | null>(null);
  const [restablecida, setRestablecida] = useState(false);

  async function guardarContrasena(evento: FormEvent) {
    evento.preventDefault();
    if (!nuevaContrasena) return;
    setRestablecida(false);
    if (await restablecer.ejecutar({ id: usuario._id, contrasena: nuevaContrasena })) {
      setNuevaContrasena(null);
      setRestablecida(true);
    }
  }

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {usuario.correo}
            {esSesion && <span className="ml-2 text-[11px] font-normal text-body-soft">(tú)</span>}
          </p>
          <p className="text-xs text-body">
            Desde {fechaLegible(usuario.fechaAlta)}
            {usuario.agregadoPor && ` · creada por ${usuario.agregadoPor}`}
          </p>
        </div>
        <label className="w-52">
          <span className="sr-only">Rol de {usuario.correo}</span>
          <select
            className="h-9 w-full rounded-sm border border-linea bg-white px-2 text-sm disabled:text-body-soft"
            value={usuario.rol}
            disabled={esSesion || cambiarRol.ocupado}
            onChange={(e) => cambiarRol.ejecutar({ id: usuario._id, rol: e.target.value as Rol })}
          >
            {opcionesRol.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <Boton
          tamano="sm"
          onClick={() => {
            setRestablecida(false);
            setNuevaContrasena(nuevaContrasena === null ? "" : null);
          }}
        >
          <KeyRound className="size-3.5" /> Contraseña
        </Boton>
        {!esSesion && (
          <ConfirmarEliminar
            soloIcono
            etiqueta={`Quitar acceso y borrar la cuenta de ${usuario.correo}`}
            deshabilitado={quitar.ocupado}
            onConfirmar={() => quitar.ejecutar({ id: usuario._id })}
          />
        )}
      </div>

      {nuevaContrasena !== null && (
        <form onSubmit={guardarContrasena} className="flex flex-wrap items-end gap-3 rounded-sm bg-surface p-3">
          <div className="min-w-56 flex-1">
            <CampoTexto
              etiqueta="Nueva contraseña"
              tipo="password"
              ayuda="Cierra sus sesiones abiertas."
              valor={nuevaContrasena}
              onChange={setNuevaContrasena}
            />
          </div>
          <Boton type="submit" variante="primario" disabled={!nuevaContrasena || restablecer.ocupado}>
            {restablecer.ocupado ? "Guardando…" : "Guardar contraseña"}
          </Boton>
        </form>
      )}

      {restablecida && (
        <p role="status" className="text-xs text-primary-700">
          Contraseña actualizada.
        </p>
      )}
      <MensajeError mensaje={cambiarRol.error ?? quitar.error ?? restablecer.error} />
    </div>
  );
}
