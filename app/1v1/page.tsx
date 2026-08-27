"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Swords, Trophy, Loader2, Search, Flame, TrendingDown, UserPlus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  wins: number;
  losses: number;
  draws: number;
  tournaments_played: number;
  tournaments_won: number;
  challenges_played: number;
  challenges_won: number;
  total_earnings: number;
  current_streak: number;
  best_streak: number;
  level: number;
  total_xp: number;
  favorite_game: string | null;
  platform: string | null;
  game_id: string | null;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
};

const PUBLIC_PROFILE_FIELDS = [
  "id",
  "username",
  "display_name",
  "avatar_url",
  "bio",
  "role",
  "wins",
  "losses",
  "draws",
  "tournaments_played",
  "tournaments_won",
  "challenges_played",
  "challenges_won",
  "current_streak",
  "best_streak",
  "level",
  "total_xp",
  "favorite_game",
  "platform",
  "game_id",
  "is_banned",
  "created_at",
  "updated_at",
  "last_seen_at",
].join(", ");

const MATCHED_LIMIT = 500;

function normalize(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-CI")
    .trim();
}

function matchesSearch(profile: Profile, query: string) {
  const q = normalize(query);
  if (!q) return true;

  return [
    profile.username,
    profile.display_name,
    profile.bio,
    profile.favorite_game,
    profile.platform,
    profile.game_id,
  ].some((value) => normalize(value).includes(q));
}

function isNewPlayer(profile: Profile) {
  const totalMatches = (profile.wins || 0) + (profile.losses || 0) + (profile.draws || 0);
  const createdAt = new Date(profile.created_at).getTime();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return totalMatches === 0 || (Number.isFinite(createdAt) && createdAt >= sevenDaysAgo);
}

function sortTop(a: Profile, b: Profile) {
  return (
    (b.tournaments_won || 0) - (a.tournaments_won || 0) ||
    (b.challenges_won || 0) - (a.challenges_won || 0) ||
    (b.wins || 0) - (a.wins || 0) ||
    (b.current_streak || 0) - (a.current_streak || 0) ||
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function sortLosers(a: Profile, b: Profile) {
  return (
    (b.losses || 0) - (a.losses || 0) ||
    (a.wins || 0) - (b.wins || 0) ||
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

function PlayerCard({
  profile,
  currentUserId,
  defying,
  onDefy,
}: {
  profile: Profile;
  currentUserId?: string;
  defying: string | null;
  onDefy: (profile: Profile) => void;
}) {
  const totalMatches = (profile.wins || 0) + (profile.losses || 0) + (profile.draws || 0);
  const isOnline =
    !!profile.last_seen_at &&
    Date.now() - new Date(profile.last_seen_at).getTime() < 5 * 60 * 1000;

  return (
    <div className="rounded-[22px] border border-zinc-800 bg-[#15151E] p-5">
      <div className="flex gap-3">
        <div className="relative h-12 w-12 shrink-0 rounded-full bg-violet-600 flex items-center justify-center font-bold overflow-hidden">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`Avatar de @${profile.username}`}
              className="h-full w-full object-cover"
            />
          ) : (
            (profile.username?.[0] || "?").toUpperCase()
          )}
          {isOnline && (
            <span
              title="Actif récemment"
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#15151E] bg-emerald-400"
            />
          )}
        </div>

        <div className="min-w-0">
          <p className="font-bold truncate">@{profile.username}</p>
          <p className="text-xs text-zinc-500 truncate">{profile.display_name}</p>
          <p className="text-[11px] text-zinc-600">
            {totalMatches} match{totalMatches > 1 ? "s" : ""} • {profile.wins || 0}V •{" "}
            {profile.losses || 0}D
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-zinc-800 bg-[#101015] px-2.5 py-1 text-zinc-400">
          🏆 {profile.tournaments_won || 0} tournoi{profile.tournaments_won > 1 ? "s" : ""} gagné
          {profile.tournaments_won > 1 ? "s" : ""}
        </span>
        <span className="rounded-full border border-zinc-800 bg-[#101015] px-2.5 py-1 text-zinc-400">
          ⚔️ {profile.challenges_won || 0} victoire{profile.challenges_won > 1 ? "s" : ""} 1V1
        </span>
      </div>

      {profile.bio && (
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 line-clamp-2">
          {profile.bio}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Link
          href={`/profile/${profile.username}`}
          className="flex-1 rounded-full border border-zinc-800 bg-[#08080B] py-2 text-xs text-center"
        >
          Profil
        </Link>
        <button
          disabled={profile.id === currentUserId || defying === profile.id || profile.is_banned}
          onClick={() => onDefy(profile)}
          className="flex-1 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {profile.id === currentUserId
            ? "Toi"
            : profile.is_banned
              ? "Indisponible"
              : defying === profile.id
                ? "Envoi..."
                : "Défier"}
        </button>
      </div>
    </div>
  );
}

export default function Page1v1Final() {
  const supabase = useMemo(() => createClient(), []);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [defying, setDefying] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (active) setCurrentUserId(user?.id);

      const { data, error } = await supabase
        .from("profiles")
        .select(PUBLIC_PROFILE_FIELDS)
        .eq("role", "JOUEUR")
        .order("created_at", { ascending: false })
        .limit(MATCHED_LIMIT);

      if (!active) return;

      if (error) {
        console.error("1V1 profiles:", error);
        toast.error("Impossible de charger les joueurs.");
      } else {
        setAllProfiles((data || []) as Profile[]);
      }

      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("profiles-1v1-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const profile = payload.new as Profile;
          if (profile.role !== "JOUEUR") return;

          setAllProfiles((previous) => {
            if (previous.some((item) => item.id === profile.id)) return previous;
            return [profile, ...previous].slice(0, MATCHED_LIMIT);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const profile = payload.new as Profile;
          if (profile.role !== "JOUEUR") return;

          setAllProfiles((previous) => {
            const exists = previous.some((item) => item.id === profile.id);
            if (!exists) return [profile, ...previous].slice(0, MATCHED_LIMIT);
            return previous.map((item) => (item.id === profile.id ? profile : item));
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  const filtered = useMemo(
    () => allProfiles.filter((profile) => matchesSearch(profile, query)),
    [allProfiles, query]
  );

  const sections = useMemo(() => {
    if (query.trim()) {
      return [
        {
          key: "results",
          title: "Résultats",
          subtitle: `${filtered.length} joueur${filtered.length > 1 ? "s" : ""} trouvé${
            filtered.length > 1 ? "s" : ""
          }`,
          icon: Search,
          players: [...filtered].sort(sortTop),
        },
      ];
    }

    const newPlayers = allProfiles.filter(isNewPlayer);
    const remaining = allProfiles.filter((profile) => !newPlayers.some((p) => p.id === profile.id));
    const topPlayers = remaining
      .filter(
        (profile) =>
          (profile.tournaments_won || 0) > 0 ||
          (profile.challenges_won || 0) > 0 ||
          (profile.wins || 0) > 0
      )
      .sort(sortTop);
    const topIds = new Set(topPlayers.map((p) => p.id));

    const losingPlayers = remaining
      .filter((profile) => !topIds.has(profile.id) && (profile.losses || 0) > 0)
      .sort(sortLosers);
    const losingIds = new Set(losingPlayers.map((p) => p.id));

    const otherPlayers = remaining
      .filter((profile) => !topIds.has(profile.id) && !losingIds.has(profile.id))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return [
      {
        key: "new",
        title: "Nouveaux joueurs",
        subtitle: `${newPlayers.length} joueur${newPlayers.length > 1 ? "s" : ""}`,
        icon: UserPlus,
        players: newPlayers,
      },
      {
        key: "top",
        title: "Top du moment",
        subtitle: "Palmarès actuel",
        icon: Flame,
        players: topPlayers,
      },
      {
        key: "losers",
        title: "Perdants du moment",
        subtitle: "Résultats récents",
        icon: TrendingDown,
        players: losingPlayers,
      },
      {
        key: "other",
        title: "Autres joueurs",
        subtitle: "Tous les profils restants",
        icon: Users,
        players: otherPlayers,
      },
    ].filter((section) => section.players.length > 0);
  }, [allProfiles, filtered, query]);

  const handleDefy = async (profile: Profile) => {
    if (!currentUserId) {
      toast.error("Connecte-toi pour défier un joueur.");
      return;
    }

    if (profile.id === currentUserId) {
      toast.error("Tu ne peux pas te défier toi-même.");
      return;
    }

    setDefying(profile.id);

    const { error } = await supabase.from("challenges").insert({
      challenger_id: currentUserId,
      opponent_id: profile.id,
      stake: 500,
      status: "EN_ATTENTE",
      game: "eFootball",
    });

    if (error) {
      console.error("1V1 challenge:", error);
      toast.error(error.message || "Impossible d'envoyer le défi.");
    } else {
      toast.success(`Défi envoyé à @${profile.username}`);
    }

    setDefying(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-black flex items-center gap-3">
          <Swords className="h-7 w-7 text-violet-500" />
          1V1 - Tous les joueurs
          <span className="text-sm font-bold text-zinc-500">({allProfiles.length})</span>
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Recherche publique instantanée et liste actualisée en temps réel.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-[#101015] px-4 py-3">
        <Search className="h-5 w-5 text-zinc-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Rechercher un pseudo, un nom ou une info publique..."
          className="flex-1 bg-transparent text-sm outline-none"
          aria-label="Rechercher un joueur"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="text-xs bg-[#15151E] border border-zinc-800 px-3 py-1 rounded-full"
          >
            Effacer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : allProfiles.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-10 text-center text-zinc-500">
          Aucun joueur inscrit n'est disponible pour le moment.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-[#101015] p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-zinc-600" />
          <p className="mt-3 font-bold">Aucun joueur trouvé</p>
          <p className="mt-1 text-sm text-zinc-500">
            Essaie avec une autre partie du pseudo ou du nom public.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.key}>
                <div className="mb-3 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-xl font-black">
                      <Icon className="h-5 w-5 text-violet-400" />
                      {section.title}
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">{section.subtitle}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.players.map((profile) => (
                    <PlayerCard
                      key={profile.id}
                      profile={profile}
                      currentUserId={currentUserId}
                      defying={defying}
                      onDefy={handleDefy}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-zinc-600">
        <Trophy className="h-4 w-4" />
        Le palmarès affiché provient des statistiques déjà enregistrées sur les profils JOYBOY.
      </div>
    </div>
  );
}
