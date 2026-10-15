"use client";

import { PlayIcon } from "@/components/ui/Icons";

function toEmbed(url: string): { kind: "iframe" | "video"; src: string } {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` };
    if (host.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").filter(Boolean).pop();
      return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (host.endsWith("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return { kind: "iframe", src: host.startsWith("player.") ? url : `https://player.vimeo.com/video/${id}` };
    }
  } catch {
    /* noto'g'ri URL */
  }
  return { kind: "video", src: url };
}

/**
 * Platformada saqlangan video: imzolangan vaqtli havola, yuklab olish tugmasi yo'q, o'ng tugma o'chirilgan,
 * talaba nomi suv belgisi sifatida (ekran yozib olinsa kimniki ekani ko'rinadi).
 * Tashqi havola: YouTube/Vimeo embed yoki oddiy mp4.
 */
export function VideoPlayer({ url, title, source, watermark }: { url: string | null; title: string; source?: "PLATFORM" | "EXTERNAL" | null; watermark?: string }) {
  if (!url) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-slate-800 text-slate-400">
        <PlayIcon width={40} height={40} />
        <p className="text-sm">Bu dars uchun video mavjud emas</p>
      </div>
    );
  }
  if (source === "PLATFORM") {
    return (
      <div className="relative select-none" onContextMenu={(e) => e.preventDefault()}>
        <video key={url} src={url} controls controlsList="nodownload noplaybackrate" disablePictureInPicture playsInline
          className="aspect-video w-full bg-black">
          Brauzeringiz videoni qo&apos;llab-quvvatlamaydi.
        </video>
        {watermark && (
          <span className="pointer-events-none absolute top-3 right-4 rounded bg-black/30 px-2 py-0.5 text-[11px] text-white/60">{watermark}</span>
        )}
      </div>
    );
  }
  const embed = toEmbed(url);
  if (embed.kind === "iframe") {
    return <iframe src={embed.src} title={title} className="aspect-video w-full bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }
  return (
    <video key={embed.src} src={embed.src} controls controlsList="nodownload" className="aspect-video w-full bg-black">
      Brauzeringiz videoni qo&apos;llab-quvvatlamaydi.
    </video>
  );
}
