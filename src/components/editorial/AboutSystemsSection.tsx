"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { useNarrativeCoordinator } from "@/components/narrative/NarrativeCoordinator";
import { useNarrativeChapter } from "@/components/narrative/useNarrativeChapter";

const capabilities = [
  { label: "Branding", detail: "Identity + positioning" },
  { label: "UX/UI", detail: "Journeys + interfaces" },
  { label: "Front End", detail: "Experience layer" },
  { label: "Back End", detail: "Logic + infrastructure" },
  { label: "Automation", detail: "Workflow orchestration" },
  { label: "CRM", detail: "Pipeline architecture" },
  { label: "Analytics", detail: "Signals + insight" },
  { label: "Content", detail: "Narrative systems" },
  { label: "Social", detail: "Visibility + community" },
  { label: "SEO", detail: "Search + discovery" },
  { label: "Lead Generation", detail: "Demand + conversion" },
];

export function AboutSystemsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useNarrativeCoordinator();
  useNarrativeChapter(sectionRef, "about-systems", 36);
  useNarrativeChapter(closingRef, "final-statement", 37);
  const reveal = reducedMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 44, filter: "blur(12px)" },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const },
        },
      };

  return (
    <section
      ref={sectionRef}
      id="about-systems"
      className="about-systems"
      aria-labelledby="about-systems-title"
    >
      <div className="about-systems__field" aria-hidden="true" />

      <motion.header
        className="about-systems__header"
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p className="about-systems__eyebrow">
          <span>About Tommy Pisano</span>
          <span>Modern marketing builder / systems architect</span>
        </p>
        <h2 id="about-systems-title">
          I build the systems
          <strong>behind growth.</strong>
        </h2>
      </motion.header>

      <div className="about-systems__profile">
        <motion.aside
          className="about-systems__experience"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <p className="about-systems__experience-number">20+</p>
          <p className="about-systems__experience-label">
            Years connecting design, technology, marketing, and growth.
          </p>
          <dl>
            <div>
              <dt>Perspective</dt>
              <dd>Whole-system</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>Build + connect</dd>
            </div>
            <div>
              <dt>Standard</dt>
              <dd>Measurable</dd>
            </div>
          </dl>
        </motion.aside>

        <motion.div
          className="about-systems__narrative"
          variants={reveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          <p className="about-systems__lead">
            I am Tommy Pisano, a modern marketing builder, Senior UX/UI Designer,
            creative technologist, and growth systems architect with 20+ years of
            experience across design, branding, digital marketing, content creation,
            CRM, analytics, automation, AI, front-end development, back-end development,
            software engineering, and social media management.
          </p>

          <p>
            I do not see marketing as a collection of random tasks. I see it as a
            system that connects brand, design, technology, content, data, customer
            experience, and execution into something measurable, scalable, and built
            to move.
          </p>

          <p>
            My work lives at the intersection of creativity, technology, and
            infrastructure. I understand how a brand should look, how a digital
            experience should feel, how a user should move through an interface, how
            content should earn attention, how a lead should be tracked, how a workflow
            should be automated, and how performance should be measured.
          </p>

          <blockquote>I build the machine behind growth.</blockquote>

          <p>
            I am strongest when I walk into scattered tools, unclear messaging, weak
            digital presence, inconsistent content, broken follow-up, poor visibility,
            or disconnected systems and turn it into a structured engine built to
            perform.
          </p>

          <p>
            Through Ascend Vanta, I am building around that exact standard: premium
            digital experiences, stronger online presence, AI-enhanced workflows,
            front-end experiences, back-end systems, measurable growth infrastructure,
            social media visibility, and connected systems that help businesses move
            with more clarity and confidence.
          </p>
        </motion.div>
      </div>

      <motion.div
        className="about-system-map"
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
      >
        <header className="about-system-map__header">
          <p>System map / 11 connected disciplines</p>
          <h3>Every layer, connected.</h3>
        </header>

        <ol className="about-system-map__list">
          {capabilities.map((capability, index) => (
            <motion.li
              key={capability.label}
              initial={reducedMotion ? undefined : { opacity: 0, y: 24 }}
              whileInView={reducedMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{
                duration: 0.58,
                delay: (index % 4) * 0.055,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{capability.label}</strong>
              <small>{capability.detail}</small>
            </motion.li>
          ))}
        </ol>
      </motion.div>

      <motion.footer
        ref={closingRef}
        id="final-statement"
        className="about-systems__closing"
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <p>My value is simple:</p>
        <h3>
          I can see the
          <strong>whole machine.</strong>
        </h3>
        <div className="about-systems__closing-line" aria-hidden="true">
          <span />
        </div>
      </motion.footer>
    </section>
  );
}
