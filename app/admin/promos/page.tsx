"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Trash2,
  Plus,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type Promo = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  badge_text: string | null;
  cta_text: string | null;
  cta_link: string | null;
  background_color: string | null;
  image_url: string | null;
  code: string | null;
  discount_percent: number | null;
  is_active: boolean;
  display_order: number | null;
  created_at: string;
};

const DEFAULT_FORM = {
  type: "PROMO",
  title: "",
  subtitle: "",
  badge_text: "",
  cta_text: "J'achète maintenant →",
  cta_link: "/tournaments",
  background_color: "#E30613",
  image_url: "",
  code: "",
  discount_percent: "",
};

export default function AdminPromosPage() {
  const supabase = createClient();

  const [promos, setPromos] = useState<Promo[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("promos")
        .select("*")
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[ADMIN PROMOS] load:", error);
        throw error;
      }

      setPromos((data || []) as Promo[]);
    } catch (error: any) {
      toast.error(
        error?.message || "Impossible de charger les bannières."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel("admin-promos-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "promos",
        },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
  };

  const handleAdd = async () => {
    if (!form.title.trim()) {
      toast.error("Titre obligatoire.");
      return;
    }

    setSaving(true);

    try {
      const nextOrder =
        promos.length > 0
          ? Math.max(
              ...promos.map((p) => Number(p.display_order) || 0)
            ) + 1
          : 1;

      const payload = {
        type: form.type,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        badge_text: form.badge_text.trim() || null,
        cta_text: form.cta_text.trim() || null,
        cta_link: form.cta_link.trim() || null,
        background_color:
          form.background_color.trim() || "#E30613",
        image_url: form.image_url.trim() || null,
        code: form.code.trim() || null,
        discount_percent: form.discount_percent
          ? Number(form.discount_percent)
          : null,
        is_active: true,
        display_order: nextOrder,
      };

      const { error } = await supabase
        .from("promos")
        .insert(payload);

      if (error) {
        console.error("[ADMIN PROMOS] insert:", error);
        throw error;
      }

      toast.success(
        "Bannière ajoutée et activée sur le site."
      );

      resetForm();
      await load();
    } catch (error: any) {
      toast.error(
        error?.message || "Impossible d'ajouter la bannière."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (
    id: string,
    currentValue: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("promos")
        .update({
          is_active: !currentValue,
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(
        currentValue
          ? "Bannière désactivée."
          : "Bannière activée."
      );

      await load();
    } catch (error: any) {
      toast.error(
        error?.message || "Impossible de modifier la bannière."
      );
    }
  };

  const deletePromo = async (id: string) => {
    if (!window.confirm("Supprimer cette bannière ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("promos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Bannière supprimée.");
      await load();
    } catch (error: any) {
      toast.error(
        error?.message || "Impossible de supprimer la bannière."
      );
    }
  };

  const movePromo = async (
    id: string,
    direction: "up" | "down"
  ) => {
    const ordered = [...promos].sort(
      (a, b) =>
        (Number(a.display_order) || 0) -
        (Number(b.display_order) || 0)
    );

    const index = ordered.findIndex((p) => p.id === id);

    if (index === -1) return;

    const targetIndex =
      direction === "up" ? index - 1 : index + 1;

    if (
      targetIndex < 0 ||
      targetIndex >= ordered.length
    ) {
      return;
    }

    const current = ordered[index];
    const target = ordered[targetIndex];

    try {
      const currentOrder = Number(
        current.display_order || index + 1
      );

      const targetOrder = Number(
        target.display_order || targetIndex + 1
      );

      const { error: error1 } = await supabase
        .from("promos")
        .update({
          display_order: targetOrder,
        })
        .eq("id", current.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("promos")
        .update({
          display_order: currentOrder,
        })
        .eq("id", target.id);

      if (error2) throw error2;

      await load();
    } catch (error: any) {
      toast.error(
        error?.message ||
          "Impossible de modifier l'ordre des bannières."
      );
    }
  };

  const activeCount = promos.filter(
    (p) => p.is_active
  ).length;

  return (
    <div className="max-w-5xl space-y-8">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black">
            Bannières Promo / Événements / Codes
          </h1>

          <p className="mt-1 text-sm text-zinc-400">
            Tu peux créer plusieurs bannières. Les bannières
            actives défilent automatiquement sur le site toutes
            les 4 secondes.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="rounded-xl border border-zinc-800 bg-[#101015] px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-900 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Actualiser
        </button>
      </div>

      {/* FORMULAIRE */}
      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une bannière
        </h2>

        <div className="mt-4 grid md:grid-cols-2 gap-3">
          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value,
              })
            }
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          >
            <option>PROMO</option>
            <option>EVENT</option>
            <option>CODE</option>
            <option>SOLDES</option>
            <option>TOURNOI</option>
            <option>INFO</option>
          </select>

          <input
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            placeholder="Titre ex: On casse les prix"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />

          <input
            value={form.subtitle}
            onChange={(e) =>
              setForm({
                ...form,
                subtitle: e.target.value,
              })
            }
            placeholder="Sous-titre ex: SOLDES DES VACANCES"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />

          <input
            value={form.badge_text}
            onChange={(e) =>
              setForm({
                ...form,
                badge_text: e.target.value,
              })
            }
            placeholder="Badge ex: Jusqu'à 70%"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />

          <input
            value={form.cta_text}
            onChange={(e) =>
              setForm({
                ...form,
                cta_text: e.target.value,
              })
            }
            placeholder="CTA ex: Participer →"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />

          <input
            value={form.cta_link}
            onChange={(e) =>
              setForm({
                ...form,
                cta_link: e.target.value,
              })
            }
            placeholder="Lien ex: /tournaments"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />

          <div className="flex gap-2">
            <input
              type="color"
              value={form.background_color}
              onChange={(e) =>
                setForm({
                  ...form,
                  background_color: e.target.value,
                })
              }
              className="h-10 w-16 rounded-xl bg-[#15151E] border border-zinc-800"
            />

            <input
              value={form.background_color}
              onChange={(e) =>
                setForm({
                  ...form,
                  background_color: e.target.value,
                })
              }
              className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
              placeholder="#E30613"
            />
          </div>

          <input
            value={form.image_url}
            onChange={(e) =>
              setForm({
                ...form,
                image_url: e.target.value,
              })
            }
            placeholder="Image URL (optionnel)"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm md:col-span-2"
          />

          <input
            value={form.code}
            onChange={(e) =>
              setForm({
                ...form,
                code: e.target.value,
              })
            }
            placeholder="Code promo ex: BIENVENUE50"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />

          <input
            value={form.discount_percent}
            onChange={(e) =>
              setForm({
                ...form,
                discount_percent: e.target.value,
              })
            }
            placeholder="% réduction ex: 50"
            inputMode="numeric"
            className="rounded-xl bg-[#15151E] border border-zinc-800 px-3 py-2.5 text-sm"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving}
            className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving
              ? "Ajout..."
              : "Ajouter la bannière"}
          </button>

          <span className="text-[11px] text-zinc-500">
            Les bannières actives défileront automatiquement
            toutes les 4 secondes.
          </span>
        </div>
      </div>

      {/* LISTE */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-sm">
              Bannières ({promos.length})
            </h2>

            <p className="mt-1 text-xs text-zinc-500">
              {activeCount} active
              {activeCount > 1 ? "s" : ""} · défilement 4 secondes
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-[#101015] p-10 text-center">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-violet-400" />
            <p className="mt-3 text-sm text-zinc-500">
              Chargement...
            </p>
          </div>
        ) : promos.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-zinc-800 bg-[#101015] p-10 text-center">
            <p className="text-zinc-500">
              Aucune bannière.
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Crée ta première bannière ci-dessus.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {promos.map((p, index) => (
              <div
                key={p.id}
                className={`rounded-2xl border bg-[#101015] p-4 ${
                  p.is_active
                    ? "border-zinc-800"
                    : "border-zinc-900 opacity-60"
                }`}
                style={{
                  borderLeft: `4px solid ${
                    p.background_color || "#7C3AED"
                  }`,
                }}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-1 text-[10px] font-black text-violet-300">
                        #{index + 1}
                      </span>

                      <span className="rounded-full bg-[#15151E] border border-zinc-800 px-2 py-1 text-[10px] font-black text-zinc-400">
                        {p.type}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-black ${
                          p.is_active
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                            : "bg-zinc-500/10 text-zinc-500 border border-zinc-800"
                        }`}
                      >
                        {p.is_active ? "ACTIVE" : "MASQUÉE"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-black text-white">
                      {p.title}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {p.subtitle || "Sans sous-titre"}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                      {p.badge_text && (
                        <span>
                          Badge: {p.badge_text}
                        </span>
                      )}

                      {p.code && (
                        <span>
                          Code:{" "}
                          <span className="text-white font-bold">
                            {p.code}
                          </span>
                        </span>
                      )}

                      {p.discount_percent !== null &&
                        p.discount_percent !== undefined && (
                          <span>
                            Réduction:{" "}
                            <span className="text-emerald-300 font-bold">
                              -{p.discount_percent}%
                            </span>
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        movePromo(p.id, "up")
                      }
                      disabled={index === 0}
                      title="Monter"
                      className="rounded-xl border border-zinc-800 bg-[#15151E] p-2 text-zinc-300 hover:text-white disabled:opacity-30"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        movePromo(p.id, "down")
                      }
                      disabled={
                        index === promos.length - 1
                      }
                      title="Descendre"
                      className="rounded-xl border border-zinc-800 bg-[#15151E] p-2 text-zinc-300 hover:text-white disabled:opacity-30"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(
                          p.id,
                          p.is_active
                        )
                      }
                      title={
                        p.is_active
                          ? "Masquer"
                          : "Activer"
                      }
                      className="rounded-xl border border-zinc-800 bg-[#15151E] p-2 text-zinc-300 hover:text-white"
                    >
                      {p.is_active ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-zinc-500" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        deletePromo(p.id)
                      }
                      title="Supprimer"
                      className="rounded-xl bg-red-500/10 border border-red-500/20 p-2 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* APERÇU */}
                <div
                  className="mt-4 overflow-hidden rounded-xl border border-white/10 px-4 py-3"
                  style={{
                    background:
                      p.background_color || "#E30613",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {p.badge_text && (
                        <div className="text-[9px] font-black uppercase tracking-widest text-white/70">
                          {p.badge_text}
                        </div>
                      )}

                      <div className="text-sm font-black text-white">
                        {p.title}
                      </div>

                      {p.subtitle && (
                        <div className="text-[11px] text-white/70">
                          {p.subtitle}
                        </div>
                      )}
                    </div>

                    {p.cta_text && (
                      <div className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-black text-black">
                        {p.cta_text}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}