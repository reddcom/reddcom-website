import { useState, type FormEvent, type ReactNode } from "react";
import { authClient } from "../lib/auth-client";
import { Boton } from "../ui/Boton";
import { CampoTexto } from "../ui/Campo";
import { MensajeError } from "../ui/Estados";

/* Better Auth responde con códigos en inglés; se traducen los habituales. */
const MENSAJES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  INVALID_EMAIL: "El correo no es válido.",
};

function traducir(error: { code?: string; message?: string }): string {
  return (error.code && MENSAJES[error.code]) || error.message || "No se pudo iniciar sesión.";
}

/** Fondo de retícula de 1px, como un plano técnico. */
function Plano({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface bg-[linear-gradient(var(--color-linea)_1px,transparent_1px),linear-gradient(90deg,var(--color-linea)_1px,transparent_1px)] bg-[size:48px_48px] px-4">
      <div className="w-full max-w-sm rounded-sm border border-linea bg-white">
        <div className="border-b border-linea px-6 py-5">
          <p className="text-sm font-bold tracking-[0.3em] text-navy-900">REDDCOM</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-body">Gestor de contenido</p>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** Solo inicio de sesión: las cuentas las crea un super administrador en Configuración → Usuarios. */
export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setOcupado(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) setError(traducir(error));
    setOcupado(false);
  }

  return (
    <Plano>
      <form onSubmit={enviar} className="space-y-4">
        <h1 className="text-lg font-semibold">Iniciar sesión</h1>
        <CampoTexto etiqueta="Correo" tipo="email" valor={email} onChange={setEmail} />
        <CampoTexto etiqueta="Contraseña" tipo="password" valor={password} onChange={setPassword} />
        <MensajeError mensaje={error} />
        <Boton type="submit" variante="primario" className="w-full justify-center" disabled={ocupado}>
          {ocupado ? "Un momento…" : "Entrar"}
        </Boton>
        <p className="text-center text-[11px] leading-4 text-body-soft">
          ¿No tienes cuenta o olvidaste tu contraseña? Pídela a un super administrador.
        </p>
      </form>
    </Plano>
  );
}

export function SinAcceso({ email }: { email: string }) {
  return (
    <Plano>
      <h1 className="text-lg font-semibold">Sin acceso</h1>
      <p className="mt-2 text-sm leading-6 text-body">
        La cuenta <strong className="text-navy-900">{email}</strong> no está autorizada para editar el sitio.
        Pide al equipo que la agregue.
      </p>
      <Boton className="mt-5" onClick={() => authClient.signOut()}>
        Cerrar sesión
      </Boton>
    </Plano>
  );
}

export function PantallaCarga() {
  return <div className="flex min-h-dvh items-center justify-center text-sm text-body-soft">Cargando…</div>;
}
