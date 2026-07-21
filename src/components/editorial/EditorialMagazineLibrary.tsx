"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useNarrativeChapter } from "@/components/narrative/useNarrativeChapter";

type TurnDirection = "next" | "previous";

interface Publication {
  id: string;
  issue: string;
  category: string;
  title: string;
  deck: string;
  insight: string;
  accent: string;
  secondary: string;
  pages: readonly string[];
}

const PUBLICATIONS: readonly Publication[] = [
  {
    id: "search-survival",
    issue: "01",
    category: "SEARCH INTELLIGENCE",
    title: "Search Didn’t Die. It Learned to Answer.",
    deck: "A field guide to becoming the source AI systems trust, cite, and surface.",
    insight: "SEO → GEO → authority → citations → trust",
    accent: "#ff3535",
    secondary: "#cfff04",
    pages: Array.from(
      { length: 6 },
      (_, index) => `/assets/publications/search-survival/page-${String(index + 1).padStart(2, "0")}.webp`,
    ),
  },
  {
    id: "content-system",
    issue: "02",
    category: "CONTENT SYSTEMS",
    title: "Stop Feeding the Feed. Build the System.",
    deck: "Why more content cannot repair a broken path—and what turns attention into measurable action.",
    insight: "design → message → trust → conversion → tracking",
    accent: "#cfff04",
    secondary: "#7be9ff",
    pages: Array.from(
      { length: 6 },
      (_, index) => `/assets/publications/content-system/page-${String(index + 1).padStart(2, "0")}.webp`,
    ),
  },
  {
    id: "growth-system",
    issue: "03",
    category: "GROWTH OPERATIONS",
    title: "From Marketing Motion to Measurable Momentum.",
    deck: "A connected operating framework for campaigns, content, CRM, analytics, and follow-up.",
    insight: "campaigns → content → CRM → analytics → growth",
    accent: "#d9ff00",
    secondary: "#46e8ff",
    pages: Array.from(
      { length: 5 },
      (_, index) => `/assets/publications/growth-system/page-${String(index + 1).padStart(2, "0")}.webp`,
    ),
  },
] as const;

export function EditorialMagazineLibrary() {
  const sectionRef = useRef<HTMLElement>(null);
  useNarrativeChapter(sectionRef, "editorial-library", 34);
  const [activeIssueIndex, setActiveIssueIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [turn, setTurn] = useState<{ direction: TurnDirection; target: number } | null>(null);
  const activeIssue = PUBLICATIONS[activeIssueIndex];
  const basePage = turn?.target ?? currentPage;
  const canGoPrevious = currentPage > 0 && !turn;
  const canGoNext = currentPage < activeIssue.pages.length - 1 && !turn;

  useEffect(() => {
    const preloadSources = new Set<string>();
    PUBLICATIONS.forEach((publication) => preloadSources.add(publication.pages[0]));
    [-1, 1].forEach((offset) => {
      const source = activeIssue.pages[currentPage + offset];
      if (source) preloadSources.add(source);
    });

    preloadSources.forEach((source) => {
      const image = new window.Image();
      image.decoding = "async";
      image.src = source;
    });
  }, [activeIssue, currentPage]);

  const turnPage = useCallback(
    (direction: TurnDirection) => {
      if (turn) return;
      const target = currentPage + (direction === "next" ? 1 : -1);
      if (target < 0 || target >= activeIssue.pages.length) return;
      setTurn({ direction, target });
    },
    [activeIssue.pages.length, currentPage, turn],
  );

  const selectIssue = (index: number) => {
    if (index === activeIssueIndex) return;
    setTurn(null);
    setCurrentPage(0);
    setActiveIssueIndex(index);
  };

  const handleReaderKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      turnPage("next");
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      turnPage("previous");
    }
  };

  const readerStyle = {
    "--publication-accent": activeIssue.accent,
    "--publication-secondary": activeIssue.secondary,
    "--publication-progress": `${((currentPage + 1) / activeIssue.pages.length) * 100}%`,
  } as CSSProperties;

  return (
    <section
      ref={sectionRef}
      id="editorial-library"
      className="editorial-archive"
      aria-labelledby="editorial-archive-title"
    >
      <div className="editorial-archive__atmosphere" aria-hidden="true">
        <span>FIELD</span>
        <span>NOTES</span>
      </div>

      <header className="editorial-archive__header">
        <div className="editorial-archive__eyebrow">
          <span>ASCEND INTELLIGENCE</span>
          <span>EDITIONS 001—003</span>
        </div>
        <h2 id="editorial-archive-title">
          <span>THE PLAYBOOKS</span>
          <strong>BEHIND THE PRESENCE.</strong>
        </h2>
        <p>
          Three field manuals for turning content, search, and scattered marketing into
          connected systems that earn attention—and prove what happens next.
        </p>
      </header>

      <nav className="publication-index" aria-label="Choose a publication">
        {PUBLICATIONS.map((publication, index) => (
          <button
            key={publication.id}
            type="button"
            className={index === activeIssueIndex ? "is-active" : undefined}
            style={{
              "--publication-accent": publication.accent,
              "--publication-secondary": publication.secondary,
            } as CSSProperties}
            aria-pressed={index === activeIssueIndex}
            onClick={() => selectIssue(index)}
          >
            <span className="publication-index__number">{publication.issue}</span>
            <span className="publication-index__copy">
              <small>{publication.category}</small>
              <strong>{publication.title}</strong>
            </span>
            <span className="publication-index__count">{String(publication.pages.length).padStart(2, "0")} PAGES</span>
            <span className="publication-index__signal" aria-hidden="true" />
          </button>
        ))}
      </nav>

      <article
        className="magazine-reader"
        style={readerStyle}
        tabIndex={0}
        aria-label={`${activeIssue.title}. Use the previous and next controls or arrow keys to turn pages.`}
        onKeyDown={handleReaderKeyDown}
      >
        <div className="magazine-reader__topline" aria-hidden="true">
          <span>ASCEND / EDITORIAL ARCHIVE</span>
          <span>ISSUE {activeIssue.issue}</span>
          <span>READ IN PLACE</span>
        </div>

        <div className="magazine-reader__body">
          <div className="magazine-reader__publication">
            <div className="magazine-page-stage">
              <div className="magazine-page" data-turning={turn?.direction}>
                <Image
                  key={`${activeIssue.id}-base-${basePage}`}
                  className="magazine-page__image"
                  src={activeIssue.pages[basePage]}
                  alt={`${activeIssue.title}, page ${basePage + 1} of ${activeIssue.pages.length}`}
                  fill
                  unoptimized
                  priority={activeIssueIndex === 0 && basePage === 0}
                  sizes="(max-width: 767px) 84vw, (max-width: 1180px) 52vw, 43vw"
                />

                {turn ? (
                  <div
                    key={`${activeIssue.id}-${currentPage}-${turn.target}-${turn.direction}`}
                    className={`magazine-page__leaf magazine-page__leaf--${turn.direction}`}
                    onAnimationEnd={(event) => {
                      if (event.currentTarget !== event.target) return;
                      setCurrentPage(turn.target);
                      setTurn(null);
                    }}
                  >
                    <span className="magazine-page__face magazine-page__face--front">
                      <Image
                        src={activeIssue.pages[currentPage]}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 767px) 84vw, (max-width: 1180px) 52vw, 43vw"
                      />
                    </span>
                    <span className="magazine-page__face magazine-page__face--back">
                      <Image
                        src={activeIssue.pages[turn.target]}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 767px) 84vw, (max-width: 1180px) 52vw, 43vw"
                      />
                    </span>
                  </div>
                ) : null}

                <span className="magazine-page__spine" aria-hidden="true" />
                <span className="magazine-page__sheen" aria-hidden="true" />
              </div>

              <button
                type="button"
                className="magazine-page-hit magazine-page-hit--previous"
                aria-label="Previous page"
                disabled={!canGoPrevious}
                onClick={() => turnPage("previous")}
              >
                <span aria-hidden="true">←</span>
              </button>
              <button
                type="button"
                className="magazine-page-hit magazine-page-hit--next"
                aria-label="Next page"
                disabled={!canGoNext}
                onClick={() => turnPage("next")}
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>

            <div className="magazine-page-rail" aria-label="Publication pages">
              {activeIssue.pages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === currentPage ? "is-active" : undefined}
                  aria-label={`Go to page ${index + 1}`}
                  aria-current={index === currentPage ? "page" : undefined}
                  disabled={Boolean(turn)}
                  onClick={() => {
                    if (index === currentPage) return;
                    setTurn({
                      direction: index > currentPage ? "next" : "previous",
                      target: index,
                    });
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="magazine-reader__copy" data-issue={activeIssue.issue}>
            <p className="magazine-reader__category">{activeIssue.category}</p>
            <h3>{activeIssue.title}</h3>
            <p className="magazine-reader__deck">{activeIssue.deck}</p>
            <p className="magazine-reader__insight">{activeIssue.insight}</p>

            <div className="magazine-reader__navigation">
              <button
                type="button"
                aria-label="Previous page"
                disabled={!canGoPrevious}
                onClick={() => turnPage("previous")}
              >
                <span aria-hidden="true">←</span>
                <small>PREVIOUS</small>
              </button>
              <p aria-live="polite">
                <strong>{String(currentPage + 1).padStart(2, "0")}</strong>
                <span>/ {String(activeIssue.pages.length).padStart(2, "0")}</span>
              </p>
              <button
                type="button"
                aria-label="Next page"
                disabled={!canGoNext}
                onClick={() => turnPage("next")}
              >
                <small>NEXT</small>
                <span aria-hidden="true">→</span>
              </button>
            </div>
            <div className="magazine-reader__progress" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
