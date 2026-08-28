"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
Trophy,
Users,
Wallet,
Clock,
Upload,
Image as ImageIcon,
Tag,
Check,
X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
createSafeStoragePath,
validateImageFile,
} from "@/lib/storage/safePath";
import PublicBracket from "@/components/tournaments/PublicBracket";
import { toast } from "sonner";

type PromoData = {
code: string;
discount_type: string;
discount_value: number;
original_price: number;
discount: number;
final_price: number;
};

export default function TournamentDetailPage() {
const params = useParams();
const id =
typeof params?.id === "string"
? params.id
: Array.isArray(params?.id)
? params.id[0]
: "";

const { user } = useAuth() as any;
const supabase = createClient();

const [t, setT] = useState<any>(null);
const [players, setPlayers] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

const [proofFile, setProofFile] =
useState<File | null>(null);
const [proofPreview, setProofPreview] =
useState<string | null>(null);

const [promoCode, setPromoCode] = useState("");
const [promo, setPromo] =
useState<PromoData | null>(null);
const [promoLoading, setPromoLoading] =
useState(false);
const [promoError, setPromoError] =
useState("");

const [registering, setRegistering] =
useState(false);

useEffect(() => {
if (!id) return;

let mounted = true;

const load = async () => {
  setLoading(true);

  try {
    const [
      tournamentResult,
      playersResult,
    ] = await Promise.all([
      supabase
        .from("tournaments")
        .select("*")
        .eq("id", id)
        .single(),

      supabase
        .from("tournament_players")
        .select(
          "*, profiles:player_id(id, username, display_name, avatar_url)"
        )
        .eq("tournament_id", id)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    if (!mounted) return;

    if (tournamentResult.error) {
      console.error(
        "[TOURNAMENT] load tournament:",
        tournamentResult.error
      );
    }

    setT(
      tournamentResult.data || null
    );

    if (playersResult.error) {
      console.error(
        "[TOURNAMENT] load players:",
        playersResult.error
      );
    }

    setPlayers(
      playersResult.data || []
    );
  } catch (error) {
    console.error(
      "[TOURNAMENT] load:",
      error
    );
  } finally {
    if (mounted) {
      setLoading(false);
    }
  }
};

load();

return () => {
  mounted = false;
};

}, [id]);

const price = useMemo(() => {
const original = Number(
t?.entry_fee || 0
);

if (!promo) {
  return {
    original,
    discount: 0,
    final: original,
  };
}

return {
  original:
    Number(promo.original_price) ||
    original,
  discount:
    Number(promo.discount) || 0,
  final:
    Number(promo.final_price) ||
    original,
};

}, [t, promo]);

const handleFile = (
e: React.ChangeEvent<HTMLInputElement>
) => {
const f = e.target.files?.[0];

if (!f) return;

const validation =
  validateImageFile(f);

if (validation) {
  toast.error(validation);
  e.target.value = "";
  return;
}

if (f.size > 5 * 1024 * 1024) {
  toast.error(
    "Image trop lourde. Maximum 5 Mo."
  );
  e.target.value = "";
  return;
}

if (proofPreview?.startsWith("blob:")) {
  URL.revokeObjectURL(proofPreview);
}

setProofFile(f);
setProofPreview(
  URL.createObjectURL(f)
);

};

const applyPromo = async () => {
if (!id || !promoCode.trim()) {
return;
}

setPromoLoading(true);
setPromoError("");
setPromo(null);

try {
  const {
    data,
    error,
  } = await supabase.rpc(
    "validate_promo_code",
    {
      p_code:
        promoCode.trim(),
      p_tournament: id,
    }
  );

  if (error) {
    throw error;
  }

  const result = Array.isArray(data)
    ? data[0]
    : data;

  if (!result?.valid) {
    const messages: Record<
      string,
      string
    > = {
      INVALID:
        "Code promo invalide",
      EXPIRED:
        "Ce code promo a expiré",
      EXHAUSTED:
        "Ce code promo n'est plus disponible",
      TOURNAMENT:
        "Ce code promo n'est pas valable pour ce tournoi",
      INACTIVE:
        "Ce code promo est désactivé",
      NOT_STARTED:
        "Cette promotion n'est pas encore active",
    };

    setPromoError(
      messages[result?.error_code] ||
        "Code promo invalide"
    );

    return;
  }

  const originalPrice =
    Number(t?.entry_fee) || 0;

  const discountType =
    result.discount_type;

  const discountValue =
    Number(
      result.discount_value
    ) || 0;

  let discount = 0;

  if (
    discountType ===
    "percent"
  ) {
    discount = Math.round(
      originalPrice *
        (discountValue / 100)
    );
  } else {
    discount = Math.min(
      discountValue,
      originalPrice
    );
  }

  const finalPrice = Math.max(
    0,
    originalPrice - discount
  );

  setPromo({
    code:
      result.code ||
      promoCode.trim().toUpperCase(),
    discount_type:
      discountType,
    discount_value:
      discountValue,
    original_price:
      originalPrice,
    discount,
    final_price:
      finalPrice,
  });

  toast.success(
    `Code ${result.code || promoCode.trim()} appliqué.`
  );
} catch (error) {
  console.error(
    "[TOURNAMENT] promo:",
    error
  );

  setPromoError(
    "Impossible de vérifier le code promo."
  );
} finally {
  setPromoLoading(false);
}

};

const handleRegister = async () => {
if (!user) {
toast.error(
"Connecte-toi pour t'inscrire."
);
return;
}

if (!t) {
  toast.error(
    "Tournoi introuvable."
  );
  return;
}

if (!proofFile) {
  toast.error(
    "Upload la capture Wave (obligatoire)."
  );
  return;
}

const validation =
  validateImageFile(proofFile);

if (validation) {
  toast.error(validation);
  return;
}

if (
  players.length >=
  Number(t.max_players)
) {
  toast.error(
    "Ce tournoi est complet."
  );
  return;
}

setRegistering(true);

try {
  const safePath =
    createSafeStoragePath(
      "proofs",
      user.id,
      proofFile,
      "payment"
    );

  const {
    error: uploadError,
  } = await supabase.storage
    .from("tournament_proofs")
    .upload(
      safePath,
      proofFile,
      {
        cacheControl: "3600",
        upsert: false,
        contentType:
          proofFile.type,
      }
    );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: registration,
    error,
  } = await supabase.rpc(
    "register_tournament_with_promo",
    {
      p_tournament: id,
      p_player: user.id,
      p_code:
        promo?.code ||
        promoCode.trim() ||
        null,
    }
  );

  if (error) {
    throw error;
  }

  const row = Array.isArray(
    registration
  )
    ? registration[0]
    : registration;

  if (!row) {
    throw new Error(
      "Inscription non retournée par le serveur."
    );
  }

  const registrationId =
    row.registration_id ||
    row.id;

  if (registrationId) {
    const {
      error:
        proofUpdateError,
    } = await supabase
      .from("tournament_players")
      .update({
        payment_proof_path:
          safePath,
        payment_proof_url:
          null,
      })
      .eq(
        "id",
        registrationId
      )
      .eq(
        "player_id",
        user.id
      );

    if (proofUpdateError) {
      throw proofUpdateError;
    }
  }

  toast.success(
    `Inscription enregistrée â€” ${
      Number(
        row.final_price ??
          price.final
      ).toLocaleString(
        "fr-FR"
      )
    } FCFA Ã  payer.`
  );

  setPlayers((prev) => [
    ...prev,
    {
      id:
        registrationId ||
        crypto.randomUUID(),
      player_id:
        user.id,
      is_paid: false,
      status:
        "EN_ATTENTE_PAIEMENT",
      profiles: {
        id: user.id,
        username:
          user.user_metadata
            ?.username ||
          "toi",
        display_name:
          user.user_metadata
            ?.display_name ||
          "Toi",
        avatar_url:
          user.user_metadata
            ?.avatar_url ||
          null,
      },
    },
  ]);

  setProofFile(null);

  if (
    proofPreview?.startsWith(
      "blob:"
    )
  ) {
    URL.revokeObjectURL(
      proofPreview
    );
  }

  setProofPreview(null);
} catch (e: any) {
  console.error(
    "Tournament registration failed",
    e
  );

  const msg = String(
    e?.message || ""
  ).toLowerCase();

  if (
    msg.includes(
      "already_registered"
    ) ||
    msg.includes("duplicate")
  ) {
    toast.error(
      "Tu es déjÃ  inscrit Ã  ce tournoi."
    );
  } else if (
    msg.includes(
      "tournament_full"
    )
  ) {
    toast.error(
      "Ce tournoi est complet."
    );
  } else if (
    msg.includes("promo")
  ) {
    toast.error(
      "Le code promo n'est plus disponible. Vérifie-le puis réessaie."
    );
  } else {
    toast.error(
      e?.message ||
        "Impossible de finaliser l'inscription. Réessaie."
    );
  }
} finally {
  setRegistering(false);
}

};

if (loading) {
return ( <div className="min-h-screen bg-[#08080B] text-white flex items-center justify-center"> <div className="h-8 w-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" /> </div>
);
}

if (!t) {
return ( <div className="min-h-screen bg-[#08080B] text-white p-10">
Tournoi introuvable </div>
);
}

const prizeDistribution =
t.prize_distribution || {};

const firstPrize =
Number(
prizeDistribution["1"]
) || 0;

const secondPrize =
Number(
prizeDistribution["2"]
) || 0;

const thirdPrize =
Number(
prizeDistribution["3"]
) || 0;

return ( <div className="min-h-screen bg-[#08080B] text-white"> <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8"> <Link
       href="/tournaments"
       className="text-sm text-zinc-500 hover:text-white transition"
     >
← Tous les tournois </Link>

    {/* HEADER */}
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#15151E] border border-zinc-800 px-3 py-1 text-[11px] font-bold">
          {t.game}
        </span>

        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-black text-emerald-300">
          {t.status}
        </span>
      </div>

      <h1 className="mt-4 text-3xl lg:text-4xl font-black">
        {t.title}
      </h1>

      <p className="mt-2 text-sm text-zinc-400">
        {players.length}/
        {t.max_players} joueurs
        {" â€¢ "}
        {Number(
          t.entry_fee || 0
        ).toLocaleString(
          "fr-FR"
        )}{" "}
        FCFA
      </p>
    </div>

    {/* INFOS */}
    <div className="mt-6 grid md:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <p className="text-xs text-zinc-500 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Date
        </p>

        <p className="mt-1 font-bold">
          {t.start_date
            ? new Date(
                t.start_date
              ).toLocaleString(
                "fr-FR"
              )
            : "-"}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <p className="text-xs text-zinc-500 flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Frais
        </p>

        <p className="mt-1 font-bold">
          {Number(
            t.entry_fee || 0
          ).toLocaleString(
            "fr-FR"
          )}{" "}
          FCFA
          {" â€¢ "}
          Wave {t.wave_number}
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-5">
        <p className="text-xs text-zinc-500 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Places
        </p>

        <p className="mt-1 font-bold">
          {players.length} /{" "}
          {t.max_players}
        </p>
      </div>
    </div>

    {/* DESCRIPTION */}
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
      <h2 className="text-lg font-black">
        À propos du tournoi
      </h2>

      <p className="mt-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">
        {t.description ||
          "Tournoi e-sport avec bracket Ã  élimination directe."}
      </p>

      <div className="mt-5 rounded-xl bg-[#0E0E14] border border-zinc-800 p-4">
        <p className="text-xs text-zinc-500">
          Règlement
        </p>

        <p className="text-sm mt-1 whitespace-pre-wrap text-zinc-300">
          {t.rules ||
            "Respect, fair-play et décision finale de l'administration."}
        </p>
      </div>
    </div>

    {/* GAINS */}
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            Répartition des gains
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Les montants sont ceux définis par
            l'administration lors de la création du tournoi.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1ER */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
          <div className="text-3xl">
            ðŸ¥‡
          </div>

          <p className="mt-2 text-xs font-black uppercase tracking-wider text-amber-300">
            1er
          </p>

          <p className="mt-1 text-2xl font-black text-white">
            {firstPrize.toLocaleString(
              "fr-FR"
            )}{" "}
            FCFA
          </p>
        </div>

        {/* 2E */}
        <div className="rounded-2xl border border-zinc-700 bg-[#15151E] p-5 text-center">
          <div className="text-3xl">
            ðŸ¥ˆ
          </div>

          <p className="mt-2 text-xs font-black uppercase tracking-wider text-zinc-300">
            2e
          </p>

          <p className="mt-1 text-2xl font-black text-white">
            {secondPrize.toLocaleString(
              "fr-FR"
            )}{" "}
            FCFA
          </p>
        </div>

        {/* 3E */}
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-center">
          <div className="text-3xl">
            ðŸ¥‰
          </div>

          <p className="mt-2 text-xs font-black uppercase tracking-wider text-orange-300">
            3e
          </p>

          <p className="mt-1 text-2xl font-black text-white">
            {thirdPrize.toLocaleString(
              "fr-FR"
            )}{" "}
            FCFA
          </p>
        </div>
      </div>
    </div>

    {/* INSCRIPTION */}
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
      <h3 className="font-bold flex items-center gap-2">
        <Upload className="h-5 w-5" />
        Inscription avec preuve Wave
      </h3>

      {!user ? (
        <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-200">
          Connecte-toi pour participer Ã  ce tournoi.
        </div>
      ) : players.some(
          (p) =>
            p.player_id ===
            user.id
        ) ? (
        <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-300">
          âœ“ Tu es inscrit Ã  ce tournoi.
        </div>
      ) : (
        <>
          <p className="mt-2 text-xs text-zinc-500">
            Prix normal :{" "}
            {Number(
              t.entry_fee || 0
            ).toLocaleString(
              "fr-FR"
            )}{" "}
            FCFA. Le paiement doit correspondre au montant final affiché.
          </p>

          {/* PROMO */}
          <div className="mt-4 rounded-xl border border-zinc-800 bg-[#0E0E14] p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Tag className="h-4 w-4 text-violet-400" />
              Code promo
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(
                    e.target.value.toUpperCase()
                  );
                  setPromoError("");
                }}
                placeholder="Ex : BIENVENUE50"
                className="flex-1 rounded-xl bg-[#15151E] border border-zinc-800 px-4 py-2.5 text-sm uppercase outline-none"
              />

              <button
                type="button"
                onClick={applyPromo}
                disabled={
                  promoLoading ||
                  !promoCode.trim()
                }
                className="rounded-xl bg-white text-black px-5 py-2.5 text-xs font-black disabled:opacity-50"
              >
                {promoLoading
                  ? "Vérification..."
                  : "APPLIQUER"}
              </button>
            </div>

            {promoError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <X className="h-3 w-3" />
                {promoError}
              </p>
            )}

            {promo && (
              <p className="text-xs text-emerald-300 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Code {promo.code} appliqué.
              </p>
            )}

            <div className="border-t border-zinc-800 pt-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Prix initial
                </span>

                <span>
                  {price.original.toLocaleString(
                    "fr-FR"
                  )}{" "}
                  FCFA
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">
                  Réduction
                </span>

                <span className="text-emerald-400">
                  -
                  {price.discount.toLocaleString(
                    "fr-FR"
                  )}{" "}
                  FCFA
                  {promo?.discount_type ===
                    "percent" &&
                    ` (-${promo.discount_value}%)`}
                </span>
              </div>

              <div className="flex justify-between text-base font-black">
                <span>
                  Total Ã  payer
                </span>

                <span>
                  {price.final.toLocaleString(
                    "fr-FR"
                  )}{" "}
                  FCFA
                </span>
              </div>
            </div>
          </div>

          {/* PREUVE */}
          <div className="mt-5">
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-[#0E0E14] p-6 cursor-pointer hover:border-violet-500/50 transition">
              <ImageIcon className="h-8 w-8 text-zinc-500" />

              <span className="mt-2 text-xs text-zinc-400 text-center">
                {proofFile
                  ? proofFile.name
                  : "Clique pour choisir capture Wave (JPG/PNG/WEBP max 5Mo)"}
              </span>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className="hidden"
              />
            </label>

            {proofPreview && (
              <img
                src={proofPreview}
                alt="Aperçu"
                className="mt-4 max-h-64 mx-auto rounded-xl border border-zinc-800"
              />
            )}
          </div>

          <button
            onClick={handleRegister}
            disabled={
              registering ||
              t.status !==
                "OUVERT" ||
              !proofFile
            }
            className="mt-5 rounded-xl bg-white text-black px-8 py-3 text-sm font-black disabled:opacity-50"
          >
            {registering
              ? "Upload en cours..."
              : t.status !==
                "OUVERT"
              ? "Inscriptions fermées"
              : "S'inscrire + Envoyer preuve"}
          </button>
        </>
      )}
    </div>

    {/* BRACKET */}
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
      <h3 className="font-bold">
        Bracket public
      </h3>

      <p className="mt-1 text-xs text-zinc-500">
        Les visiteurs voient les joueurs, scores et vainqueurs.
      </p>

      <div className="mt-5">
        <PublicBracket
          tournamentId={id}
        />
      </div>
    </div>

    {/* JOUEURS */}
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-[#101015] p-6">
      <h3 className="font-bold">
        Joueurs inscrits ({players.length})
      </h3>

      {players.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          Aucun inscrit pour le moment.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {players.map(
            (p: any) => (
              <div
                key={p.id}
                className="rounded-xl bg-[#15151E] border border-zinc-800 p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-xs font-black">
                    {p.profiles?.avatar_url ? (
                      <img
                        src={
                          p.profiles
                            .avatar_url
                        }
                        alt={
                          p.profiles?.username ||
                          ""
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (
                        p.profiles
                          ?.display_name ||
                        p.profiles
                          ?.username ||
                        "?"
                      )[0]?.toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">
                      @
                      {p.profiles
                        ?.username ||
                        "joueur"}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {p.is_paid
                        ? "âœ“ Paiement validé"
                        : "â—· En attente"}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
                    p.is_paid
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                  }`}
                >
                  {p.is_paid
                    ? "VALIDÉ"
                    : "ATTENTE"}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  </div>
</div>

);
}
