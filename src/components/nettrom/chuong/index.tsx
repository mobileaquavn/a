"use client";

import ChapterPages from "./chapter-pages";
import ChapterControl from "./chapter-control";

export default function ChapterView() {
  return (
    <>
      <div className="container">
        <ChapterControl />
      </div>
      <ChapterPages />
    </>
  );
}
