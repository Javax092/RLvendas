import type { FormEvent } from "react";
import { LockKeyhole, Mail, Sandwich } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { useAuth } from "../../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("admin@rlburguer.app");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await signIn(email, password);
      navigate("/admin");
    } catch {
      setError("Falha no login");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-pattern px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur"
      >
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand/15 text-brand">
            <Sandwich size={30} />
          </div>
          <h1 className="text-3xl font-black text-white">Painel RL Burger SaaS</h1>
          <p className="text-sm text-slate-400">Acesse o dashboard do restaurante.</p>
        </div>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <Mail size={16} />
            Email
          </span>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>

        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <LockKeyhole size={16} />
            Senha
          </span>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" className="w-full">
          Entrar
        </Button>
      </form>
    </div>
  );
}
