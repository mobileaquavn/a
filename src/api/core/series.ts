import { axios } from "./axios";

export const followOrUnfollow = async (seriesId: string) => {
  const { data } = await axios({
    method: "POST",
    url: "/api/series/follow",
    data: {
      series_uuid: seriesId,
    },
  });
  return data;
};

export const checkInfo = async (seriesId: string) => {
  const { data } = await axios<{
    followed: boolean | null;
    comment_count: number;
  }>({
    method: "POST",
    url: "/api/series/check-info",
    data: {
      series_uuid: seriesId,
    },
  });
  return data;
};
