import { useEffect, useRef } from "react";
import { cloud } from "./config";
import type { Note, Photo } from "./data";
import { useStore } from "./store";
import { createElder, getLink, pull, push, remove, type Kind, type Row } from "./sync";

const EVERY = 15_000;
const DEBOUNCE = 800;

type Item = Photo | Note;
const key = (kind: Kind, id: string) => `${kind}:${id}`;

// Keeps this phone and the shared album the same. What was last agreed with the album is
// remembered as JSON per item; anything that differs from it is waiting to be sent.
export function useSync() {
  const { state, dispatch } = useStore();
  const latest = useRef(state);
  latest.current = state;
  const synced = useRef(new Map<string, string>());
  const ords = useRef(new Map<string, number>());
  const busy = useRef(false);
  // A device joining an existing album must take what is there before sending anything,
  // otherwise its sample notes could bring back things the family deleted.
  const first = useRef<"push" | "pull">("pull");

  const role = state.role;
  const items = (kind: Kind): Item[] => (kind === "photos" ? latest.current.photos : latest.current.notes);
  // Caregivers can add drawings and notes, but not change the family's photos (the album enforces this too).
  const mine = (kind: Kind): Item[] =>
    kind === "photos" && role === "caregiver" ? items(kind).filter((p) => (p as Photo).kind === "drawing") : items(kind);

  const pending = (kind: Kind) => {
    const changed = mine(kind).filter((i) => synced.current.get(key(kind, i.id)) !== JSON.stringify(i));
    const present = new Set(items(kind).map((i) => i.id));
    const removed = kind === "photos" && role === "caregiver" ? [] :
      [...synced.current.keys()].filter((k) => k.startsWith(`${kind}:`) && !present.has(k.slice(kind.length + 1))).map((k) => k.slice(kind.length + 1));
    return { changed, removed };
  };
  const hasPending = () => (["photos", "notes"] as Kind[]).some((k) => { const p = pending(k); return p.changed.length || p.removed.length; });

  const flush = async (elderId: string) => {
    for (const kind of ["photos", "notes"] as Kind[]) {
      const { changed, removed } = pending(kind);
      if (changed.length) {
        // New items go in front: give them an order number lower than everything already stored.
        let low = Math.min(0, ...ords.current.values());
        const rows: Row<Item>[] = changed.map((i) => {
          const k = key(kind, i.id);
          if (!ords.current.has(k)) ords.current.set(k, --low);
          return { id: i.id, ord: ords.current.get(k)!, data: i };
        });
        await push(elderId, kind, rows);
        for (const r of rows) synced.current.set(key(kind, r.id), JSON.stringify(r.data));
      }
      if (removed.length) {
        await remove(elderId, kind, removed);
        for (const id of removed) { synced.current.delete(key(kind, id)); ords.current.delete(key(kind, id)); }
      }
    }
  };

  const refresh = async (elderId: string) => {
    const [photos, notes] = await Promise.all([pull<Photo>(elderId, "photos"), pull<Note>(elderId, "notes")]);
    synced.current.clear();
    ords.current.clear();
    const take = <T extends Item>(kind: Kind, rows: Row<T>[]) => rows.map((r) => {
      synced.current.set(key(kind, r.id), JSON.stringify(r.data));
      ords.current.set(key(kind, r.id), r.ord);
      return r.data;
    });
    // A caregiver's own unshared-from-view items never appear here; the family sees everything.
    dispatch({ type: "pulled", photos: take("photos", photos), notes: take("notes", notes) });
  };

  // The family may have paused or resumed sharing on another phone.
  const followLink = async () => {
    const now = await getLink();
    const cur = latest.current.link;
    if (now && cur && (now.paused !== cur.paused || now.elder !== cur.elder)) dispatch({ type: "setLink", link: now });
  };

  const run = async (elderId: string, mode: "sync" | "push") => {
    if (busy.current) return;
    busy.current = true;
    try {
      if (first.current === "pull") { await refresh(elderId); first.current = "push"; return; }
      await flush(elderId);
      // Do not overwrite something that changed while we were sending.
      if (mode === "sync") {
        await followLink();
        if (!hasPending()) await refresh(elderId);
      }
    } catch (e) {
      dispatch({ type: "syncError", text: e instanceof Error ? e.message : "The shared album didn't answer." });
    } finally {
      busy.current = false;
    }
  };

  // 1. Who is this person in the shared album? A family member starts it; a caregiver is asked for the code.
  const uid = state.user?.email;
  useEffect(() => {
    if (!uid || !cloud()) return;
    let dead = false;
    (async () => {
      try {
        let link = await getLink();
        first.current = "pull";
        if (!link && latest.current.role === "family") { link = await createElder("Family album"); first.current = "push"; }
        if (dead) return;
        synced.current.clear();
        ords.current.clear();
        dispatch({ type: "setLink", link });
      } catch (e) {
        if (!dead) { dispatch({ type: "setLink", link: null }); dispatch({ type: "syncError", text: e instanceof Error ? e.message : "The shared album didn't answer." }); }
      }
    })();
    return () => { dead = true; };
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Once linked: send what is new, bring in what others changed, and keep checking.
  const elderId = state.link?.elderId;
  useEffect(() => {
    if (!elderId) return;
    run(elderId, "sync");
    const t = setInterval(() => run(elderId, "sync"), EVERY);
    return () => clearInterval(t);
  }, [elderId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Send changes soon after they are made.
  useEffect(() => {
    if (!elderId) return;
    const t = setTimeout(() => { if (hasPending()) run(elderId, "push"); }, DEBOUNCE);
    return () => clearTimeout(t);
  }, [elderId, state.photos, state.notes]); // eslint-disable-line react-hooks/exhaustive-deps
}
