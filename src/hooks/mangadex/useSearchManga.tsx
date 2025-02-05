"use client";

import useSWR from "swr/immutable";
import { useMemo } from "react";
import { MangadexApi } from "@/api";
import { ExtendManga, MangaList } from "@/types/mangadex";
import { Utils } from "@/utils";

export default function useSearchManga(
  options: MangadexApi.Manga.GetSearchMangaRequestOptions,
  { enable }: { enable: boolean } = { enable: true },
) {
  // avoid invalid vietnamese characters
  if (options.title) {
    options.title = encodeURIComponent(options.title);
  }
  if (!options.includes) {
    options.includes = [MangadexApi.Static.Includes.COVER_ART];
  }
  if (options.offset && options.offset > 10000) {
    options.offset = 10000 - (options.limit || 10);
  }
  const { data, error, isLoading } = useSWR(
    enable ? ["search-manga", options] : null,
    () => MangadexApi.Manga.getSearchManga(options),
    {},
  );
  const successData =
    data && data.data.result === "ok" && (data.data as MangaList);

  const mangaList = useMemo(() => {
    if (successData)
      return successData.data.map(
        (m) => Utils.Mangadex.extendRelationship(m) as ExtendManga,
      );
    return [];
  }, [successData]);

  return { data: successData, error, isLoading, mangaList };
}
