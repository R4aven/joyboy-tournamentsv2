
import { Banknote, Settings, Shield, Phone } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-3xl font-black flex items-center gap-3"><Settings className="h-7 w-7" /> Parametres</h1>
      <div className="grid gap-6">
        <div className="card-premium rounded-2xl p-6">
          <h3 className="font-bold flex items-center gap-2"><Banknote className="h-5 w-5 text-emerald-400" /> Paiements</h3>
          <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-4">
              <p className="text-xs uppercase font-bold text-zinc-500">Wave Money</p>
              <p className="mt-1 font-mono font-bold text-lg">01 51 42 99 18</p>
              <p className="text-xs text-zinc-500 mt-1">Unique methode de paiement acceptee. Pas de ELO, pas de Prize Pool, c'est direct.</p>
            </div>
            <div className="rounded-xl bg-[#0E0E14] border border-joy-border p-4">
              <p className="text-xs uppercase font-bold text-zinc-500 flex items-center gap-1"><Phone className="h-3 w-3" /> WhatsApp Support</p>
              <p className="mt-1 font-mono font-bold text-lg">07 48 23 52 26</p>
              <p className="text-xs text-zinc-500 mt-1">Assistance, litiges, verification capture.</p>
            </div>
          </div>
        </div>

        <div className="card-premium rounded-2xl p-6">
          <h3 className="font-bold flex items-center gap-2"><Shield className="h-5 w-5 text-joy-violet" /> Securite</h3>
          <p className="text-sm text-zinc-400 mt-2">Acces admin reserve aux roles ADMIN. Verifie bien les captures Wave avant de valider. Chaque action loggue une notification auto.</p>
        </div>
      </div>
    </div>
  );
}
