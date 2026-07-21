"use client";

import Image from "next/image";
import { useRef } from "react";

import MarqueeAlongSvgPath from "@/components/ui/marquee-along-svg-path";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";
import { useNarrativeChapter } from "@/components/narrative/useNarrativeChapter";

const galleryPath =
  "M1.12756 531.57C28.0893 516.8 74.8013 483.241 115.862 435.167M115.862 435.167C142.71 403.734 167.142 366.095 182.056 323.447C229.212 188.604 -65.6747 303.582 53.6794 397.09C73.8056 412.858 94.5052 425.626 115.862 435.167ZM115.862 435.167C221.157 482.211 342.426 450.85 489.709 314.125C517.752 288.093 540.139 265.319 557.876 245.305M557.876 245.305C652.19 138.884 615.024 110.493 597.546 85.1004C576.782 54.9327 401.867 14.2899 417.559 188.351C424.308 263.214 481.985 261.608 557.876 245.305ZM557.876 245.305C646.667 226.232 760.389 187.041 846.65 226.667M846.65 226.667C858.081 231.918 869.031 238.554 879.376 246.804C1034.5 370.518 957.576 540.884 843.253 562.658C768.137 576.964 767.606 395.943 846.65 226.667ZM846.65 226.667C887.908 138.309 950.848 53.1511 1036.18 0.642822";

const imageDescriptions = [
  "Editorial portrait in a black suit with reflective sunglasses",
  "Vivid pop-art portrait in electric color",
  "Cinematic rabbit chase through a forest",
  "Black-and-white portrait fractured by colorful light",
  "Dinosaur pursuit through a rain-soaked city",
  "Fenway Park action scene with a rescued cat",
  "Storm chase selfie beneath a tornado",
  "Cinematic fall through a construction site",
  "Music portrait surrounded by painted sound trails",
  "Hip-hop studio portrait",
  "Monochrome street portrait with an orange halo",
  "Four-panel streetwear portrait study",
  "Cybernetic side-profile concept",
  "Action portrait above a burning city",
  "Post-apocalyptic Boston scene",
  "Floating-city science-fiction concept",
  "Cybernetic survivor portrait",
  "Boston basketball lifestyle portrait",
  "Mechanical human profile study",
  "Portrait holding a field of electric energy",
  "Cinematic driving portrait",
  "Gaming studio lifestyle portrait",
  "Spider pursuit through a forest",
  "Industrial fashion portrait",
  "Mixed-media illustrated profile",
  "City portrait beneath an ocean sky",
  "Human and machine split portrait",
  "Network-light portrait study",
  "Smoke and ember body study",
  "Black-and-orange technical collage portrait",
  "Night-sky portrait above a vintage van",
  "Data-fragmented artificial intelligence portrait",
  "Tiger ambush in the mist",
  "Streetwear portrait beneath storm clouds",
  "Victory portrait in a packed arena",
];

const promptImages = imageDescriptions.map((alt, index) => ({
  alt,
  src: `/assets/images/prompt-gallery/prompt-${String(index + 1).padStart(2, "0")}.webp`,
}));

export function PromptWorldsGallery() {
  const sectionRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useNarrativeCoordinator();
  useNarrativeChapter(sectionRef, "prompt-worlds", 35);

  return (
    <section
      ref={sectionRef}
      id="prompt-worlds"
      className="prompt-worlds-gallery"
      aria-labelledby="prompt-worlds-title"
    >
      <div className="prompt-worlds-gallery__atmosphere" aria-hidden="true" />

      <div className="prompt-worlds-gallery__copy">
        <p className="prompt-worlds-gallery__eyebrow">
          AI creative direction <span aria-hidden="true">/</span> selected worlds
        </p>
        <h2 id="prompt-worlds-title">
          One identity.
          <span>Infinite worlds.</span>
        </h2>
        <p className="prompt-worlds-gallery__deck">
          Character, composition, atmosphere, and story—directed frame by frame.
        </p>
      </div>

      <MarqueeAlongSvgPath
        path={galleryPath}
        viewBox="0 0 1040 570"
        baseVelocity={reducedMotion ? 0 : 0.72}
        slowdownOnHover
        slowDownFactor={0.08}
        draggable={!reducedMotion}
        dragAwareDirection
        dragVelocityDecay={0.975}
        scrollAwareDirection={!reducedMotion}
        useScrollVelocity={!reducedMotion}
        repeat={1}
        enableRollingZIndex
        zIndexBase={2}
        zIndexRange={20}
        dragSensitivity={0.018}
        className="prompt-worlds-gallery__marquee"
        responsive
        grabCursor
      >
        {promptImages.map((image, index) => (
          <figure className="prompt-worlds-card" key={image.src}>
            <Image
              src={image.src}
              alt={image.alt}
              width={720}
              height={1080}
              sizes="(max-width: 767px) 90px, (max-width: 1279px) 150px, 220px"
              loading="lazy"
              unoptimized
              draggable={false}
            />
            <figcaption aria-hidden="true">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>AV / WORLD</span>
            </figcaption>
          </figure>
        ))}
      </MarqueeAlongSvgPath>

      <p className="prompt-worlds-gallery__interaction" aria-hidden="true">
        Drag the worlds <span>•</span> Scroll to change direction
      </p>
    </section>
  );
}
