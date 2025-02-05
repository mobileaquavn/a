import useSWR from "swr";
import { MangadexApi } from "@/api";
import { ExtendChapter } from "@/types/mangadex";
import { Constants } from "@/constants";
import { Utils } from "@/utils";

export const chaptersPerPage = Constants.Mangadex.CHAPTER_LIST_LIMIT;

export default function useChapterList(
  mangaId: string,
  options: MangadexApi.Manga.GetMangaIdFeedRequestOptions,
) {
  // rewrite
  if (!options.translatedLanguage) options.translatedLanguage = ["vi"];
  options.includes = [
    MangadexApi.Static.Includes.SCANLATION_GROUP,
    MangadexApi.Static.Includes.USER,
  ];
  options.order = {
    volume: MangadexApi.Static.Order.DESC,
    chapter: MangadexApi.Static.Order.DESC,
  };
  if (!options.contentRating)
    options.contentRating = [
      MangadexApi.Static.MangaContentRating.EROTICA,
      MangadexApi.Static.MangaContentRating.PORNOGRAPHIC,
      MangadexApi.Static.MangaContentRating.SAFE,
      MangadexApi.Static.MangaContentRating.SUGGESTIVE,
    ];
  options.limit = chaptersPerPage;
  if (options.offset && options.offset > 10000) {
    options.offset = 10000 - options.limit;
  }
  const { data, isLoading, error } = useSWR(
    [mangaId, options],
    () => MangadexApi.Manga.getMangaIdFeed(mangaId, options),
    {
      revalidateOnFocus: false,
      refreshInterval: 0,
    },
  );

  data?.data.data.forEach(
    (c) => Utils.Mangadex.extendRelationship(c) as ExtendChapter,
  );

  return {
    chapters: (data?.data.data || []) as ExtendChapter[],
    data,
    isLoading,
    error,
  };
}
