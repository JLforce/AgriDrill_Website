"use client";

import Link from "next/link";
import Image from "next/image";

import { useState, type ReactNode } from "react";

import LoginModal from "@/components/LoginModal";
import SignupModal from "@/components/SignupModal";
import "./animations.css";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Technology", href: "#technology" },
  { label: "Safety", href: "#safety" },
  { label: "Developers", href: "#developers" },
];

const featureCards = [
  {
    title: "Live Performance Analytics",
    description:
      "Monitor machine health and field data with millisecond precision through a cloud-synced dashboard accessible anywhere using a stable internet connection.",
    icon: "",
    iconSrc: "/icon-telemetry.png",
    iconAlt: "Real-time telemetry icon",
    imageSrc: "/telemetry-icon.png",
    imageAlt: "Telemetry dashboard and monitoring interface",
  },
  {
    title: "Precision Planting Operations",
    description:
      "High-efficiency algorithms that eliminate bottlenecks in field operations and optimize resource usage.",
    icon: "",
    iconSrc: "/autonomous-navigation.png",
    iconAlt: "Autonomous navigation icon",
    imageSrc: "/field-routing.jpg",
    imageAlt: "Autonomous field routing and navigation path",
  },
  {
    title: "Machine Control",
    description:
      "Remotely control the machine with a live video feed and telemetry data using the website, while the machine operates autonomously in drilling and seedling transplanting in the field.",
    icon: "",
    iconSrc: "/safety-first.png",
    iconAlt: "Safety first icon",
    imageSrc: "/safety-protocol.jpg",
    imageAlt: "Safety protocol indicators and sensor coverage",
  },
];

const safetyCards = [
  {
    title: "Obstacle Detection & Avoidance",
    description:
      " Ultrasonic sensors detect and avoid obstacles in real-time sending a warning to the website interface, allowing operators to intervene and prevent collisions during field operations.",
    iconSrc: "/obstacle-detection.png",
    iconAlt: "Obstacle detection icon",
    imageSrc: "/obstacle-avoidance.jpg",
    imageAlt: "Obstacle detection safety interface",
  },
  {
    title: "Stop / Emergency Stop Layer",
    description:
      "Hardware and software failsafe controls immediately halt drilling and movement when critical thresholds are triggered.",
    iconSrc: "/icon-emergency.png",
    iconAlt: "Emergency stop icon",
    imageSrc: "/emergency-stop.jpg",
    imageAlt: "Emergency safety stop controls",
  },
  {
    title: "Firmware Precision Drilling Depth and Planting Distance",
    description:
      " The firmware ensures that the drill and planting mechanisms operate within safe depth and distance parameters, preventing damage to crops and soil.",
    iconSrc: "/icon-protected.png",
    iconAlt: "Protected zone icon",
    imageSrc: "/protected-planting.jpg",
    imageAlt: "Safe planting zone protection interface",
  },
];

const techStack = [
  { name: "Next.js 14", desc: "Server-side rendering & API routes", icon: "▼" },
  { name: "Supabase", desc: "PostgreSQL + Real-time database", icon: "▼" },
  { name: "Gemini API", desc: "Agent-based AI for autonomous decision-making", icon: "▼" },
  { name: "HiveMQ Cloud Platform", desc: "Real-time Robot Control & Telemetry Data", icon: "▼" },
];

const developers = [
  {
    name: "Celestra, Sybil Mae S.",
    role: "Firmware Engineer",
    photo: "/celestra-firmware.jpg",
    desc: " Develops the embedded firmware for the ESP32 (main microcontroller) and Arduino UNO (sub-microcontroller), handling sensor data acquisition, motor control, and communication protocols for semi-autonomous operation.",
  },
  {
    name: "Flores, Stefanny Jean T.",
    role: "Robotics Engineer",
    photo: "/flores-hardware.jpg",
    desc: " Designs and implements the mechanical and electrical systems of the semi-autonomous farming robot, including the integration of sensors, actuators, and power management for efficient field operations.",
  },
  {
    name: "Salado, Al Francis Daniel P.",
    role: "Robotics Technician",
    photo: "/salado-roboticsTechnician.jpg",
    desc: " Build and maintain the semi-autonomous farming robot, ensuring that all hardware components are functioning correctly and assisting in the testing and calibration of the robot's systems for optimal performance in the field.",
  },
  {
    name: "Ybañez, Jafit Love R.",
    role: "Full-Stack Engineer & Quality Assurance (QA) Engineer",
    photo: "/ybanez-fullStack.jpg",
    desc: " Develops the web application for real-time telemetry monitoring and control of the semi-autonomous farming robot, as well as conducting quality assurance testing to ensure the software meets performance and reliability standards.",
  },
];

/**
 * Horizontally auto-scrolling, seamlessly looping row ("living wallpaper").
 * Items are repeated so a single set is always wider than the container,
 * then the set is duplicated and the track slides by exactly -50%.
 */
function Marquee({
  items,
  duration = 40,
  reverse = false,
  itemClassName = "w-[290px] sm:w-[340px]",
  repeat = 2,
}: {
  items: ReactNode[];
  duration?: number;
  reverse?: boolean;
  itemClassName?: string;
  repeat?: number;
}) {
  const renderSet = (prefix: string) =>
    Array.from({ length: repeat }).flatMap((_, r) =>
      items.map((item, i) => (
        <div
          key={`${prefix}-${r}-${i}`}
          className={`flex shrink-0 pr-5 sm:pr-7 ${itemClassName}`}
        >
          {item}
        </div>
      ))
    );

  return (
    <div className="marquee">
      <div
        className={`marquee-track${reverse ? " marquee-reverse" : ""}`}
        style={{ animationDuration: `${duration}s` }}
      >
        <div className="flex">{renderSet("a")}</div>
        <div className="marquee-dup flex" aria-hidden="true">
          {renderSet("b")}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-clip bg-[#021d1a] font-sans text-[#e8f5ef]">
      <style>{`
        .marquee {
          overflow: hidden;
          padding: 1rem 0;
          -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marquee-left linear infinite;
        }
        .marquee-reverse { animation-name: marquee-right; }
        @keyframes marquee-left {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        @media (hover: hover) {
          .marquee:hover .marquee-track { animation-play-state: paused; }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee {
            overflow-x: auto;
            -webkit-mask-image: none;
            mask-image: none;
          }
          .marquee-track { animation: none; }
          .marquee-dup { display: none; }
        }
      `}</style>

      <div className="bg-[radial-gradient(circle_at_20%_10%,rgba(18,195,148,0.25),transparent_42%),radial-gradient(circle_at_80%_2%,rgba(18,148,195,0.16),transparent_28%),linear-gradient(180deg,#052d27_0%,#04211d_30%,#031916_100%)]">
        {/* ── HEADER ── */}
        <header className="fade-in-up sticky top-0 z-50 border-b border-white/10 bg-[#042520]/80 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/landing" className="group flex items-center gap-2">
              <Image
                src="/agridrill-logo.png"
                alt="AgriDrill Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-base font-bold tracking-[0.08em] text-white transition-colors duration-300 group-hover:text-[#15d8a0] sm:text-lg sm:tracking-[0.18em]">
                AgriDrill
              </span>
            </Link>

            <nav className="hidden items-center gap-6 text-base text-[#b7d7cd] md:flex lg:gap-8">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="font-medium transition duration-200 hover:text-[#15d8a0] md:hover:scale-110"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-[#15d8a0] to-[#47e3b6] px-3 py-1.5 text-sm font-bold text-[#042b23] shadow-[0_0_24px_rgba(22,211,154,0.35)] transition duration-300 hover:brightness-110 active:scale-95 active:shadow-inner sm:px-5 sm:py-2 sm:text-base md:hover:scale-110 md:hover:shadow-[0_0_40px_rgba(22,211,154,0.5)]"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setSignupModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-[#15d8a0] to-[#47e3b6] px-3 py-1.5 text-sm font-bold text-[#042b23] shadow-[0_0_24px_rgba(22,211,154,0.35)] transition duration-300 hover:brightness-110 active:scale-95 active:shadow-inner sm:px-5 sm:py-2 sm:text-base md:hover:scale-110 md:hover:shadow-[0_0_40px_rgba(22,211,154,0.5)]"
              >
                Sign Up
              </button>

              {/* Hamburger (mobile only) */}
              <button
                type="button"
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white md:hidden"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu panel */}
          {menuOpen && (
            <div className="border-t border-white/10 bg-[#042520]/95 px-4 pb-4 md:hidden">
              <nav className="flex flex-col py-2">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="py-3 text-base font-medium text-[#b7d7cd] hover:text-[#15d8a0]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </header>

        {/* ── HERO ── */}
        <section
          id="hero"
          className="fade-in-up mx-auto grid w-full max-w-7xl scroll-mt-24 gap-8 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pb-28"
        >
          <div className="flex flex-col justify-center">
            <span className="fade-in-up inline-flex w-fit items-center rounded-full border border-[#17b68a]/35 bg-[#11a079]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#47e3b6] shadow-sm sm:text-xs sm:tracking-[0.18em]">
              NEXT-GENERATION AUTONOMY
            </span>
            <h1 className="pop-in animation-delay-100 mt-6 text-4xl font-extrabold leading-[1.05] text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
              Semi-Autonomous <span className="text-[#15d8a0]">Precision</span> Farming
            </h1>
            <p className="fade-in-up animation-delay-200 mt-5 max-w-xl text-base font-medium leading-relaxed text-[#a9c6bc] sm:mt-6 sm:text-lg">
              Revolutionizing agriculture through high-tech semi-autonomous systems and real-time telemetry for maximum
              yield efficiency and resource preservation.
            </p>

            <div className="fade-in-up animation-delay-300 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                type="button"
                onClick={() => setSignupModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-[#15d8a0] to-[#47e3b6] px-7 py-3 text-center text-base font-bold text-[#03231c] shadow-[0_0_30px_rgba(21,216,160,0.35)] transition duration-300 hover:brightness-110 active:scale-95 active:shadow-inner md:hover:scale-110 md:hover:shadow-[0_0_40px_rgba(21,216,160,0.5)]"
              >
                Get Started
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 bg-white/5 px-7 py-3 text-base font-semibold text-white transition duration-300 hover:border-white/40 active:scale-95 active:shadow-inner md:hover:scale-110 md:hover:bg-white/20 md:hover:shadow-lg"
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="slide-in-right animation-delay-200 relative">
            <div className="h-full min-h-[260px] overflow-hidden rounded-2xl border border-[#76d888]/35 bg-[linear-gradient(140deg,#8bcf7b_0%,#66a85f_52%,#3f7f44_100%)] shadow-[0_30px_70px_rgba(0,0,0,0.35)] sm:min-h-[380px] lg:min-h-[460px]">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent via-[#0a3d2e]/30 to-[#0a3d2e]/50" />
              <div className="relative h-full min-h-[inherit]">
                <Image
                  src="/farming-tractor.jpg"
                  alt="Autonomous farming tractor in field"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
          <div className="fade-in-up mx-auto max-w-3xl text-center">
            <h2 className="pop-in text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Advanced Farming Solutions
            </h2>
            <div className="pop-in mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#16d39a] to-[#47e3b6]" />
            <p className="fade-in-up mx-auto mt-5 max-w-2xl text-base font-medium text-[#9fc0b5] sm:text-lg">
              Our platform integrates cutting-edge technology to ensure your farm operates at peak performance, day and night.
            </p>
          </div>

          <div className="mt-10 sm:mt-12">
            <Marquee
              duration={50}
              items={featureCards.map((card) => (
                <article
                  key={card.title}
                  className="w-full rounded-2xl border border-[#0f4b3f]/70 bg-[#062a23]/85 p-5 shadow-lg transition-transform duration-300 sm:p-7 md:hover:scale-105 md:hover:shadow-2xl"
                >
                  <div className="inline-flex rounded-md bg-[#09483c] px-3 py-2 text-base font-bold text-[#20d6a4]">
                    {card.iconSrc ? (
                      <Image
                        src={card.iconSrc}
                        alt={card.iconAlt ?? `${card.title} icon`}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-sm object-cover"
                      />
                    ) : (
                      card.icon
                    )}
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">{card.title}</h3>
                  <p className="mt-3 text-base font-medium leading-relaxed text-[#96b8ad]">{card.description}</p>

                  <div className="mt-5 rounded-xl border border-white/10 bg-[linear-gradient(135deg,#0a3d34_0%,#123a36_35%,#182f37_100%)] p-4 sm:p-5">
                    <div className="relative h-28 overflow-hidden rounded-lg border border-white/10 bg-black/15">
                      <Image src={card.imageSrc} alt={card.imageAlt} fill sizes="340px" className="object-cover" />
                    </div>
                  </div>
                </article>
              ))}
            />
          </div>
        </section>

        {/* ── SAFETY ── */}
        <section id="safety" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
          <div className="fade-in-up mx-auto max-w-3xl text-center">
            <h2 className="pop-in text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Safety Systems</h2>
            <div className="pop-in mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#16d39a] to-[#47e3b6]" />
            <p className="fade-in-up mx-auto mt-5 max-w-2xl text-base font-medium text-[#9fc0b5] sm:text-lg">
              Every AgriDrill operation is protected by layered safeguards built for real field conditions and rapid emergency response.
            </p>
          </div>

          <div className="mt-10 sm:mt-12">
            <Marquee
              duration={50}
              reverse
              items={safetyCards.map((card) => (
                <article
                  key={card.title}
                  className="w-full rounded-2xl border border-[#0f4b3f]/70 bg-[#062a23]/85 p-5 shadow-lg transition-transform duration-300 sm:p-7 md:hover:scale-105 md:hover:shadow-2xl"
                >
                  <div className="inline-flex rounded-md bg-[#09483c] px-3 py-2 text-base font-bold text-[#20d6a4]">
                    <Image
                      src={card.iconSrc}
                      alt={card.iconAlt}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-sm object-cover"
                    />
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">{card.title}</h3>
                  <p className="mt-3 text-base font-medium leading-relaxed text-[#96b8ad]">{card.description}</p>

                  <div className="mt-5 rounded-xl border border-white/10 bg-[linear-gradient(135deg,#0a3d34_0%,#123a36_35%,#182f37_100%)] p-4 sm:p-5">
                    <div className="relative h-28 overflow-hidden rounded-lg border border-white/10 bg-black/15">
                      <Image src={card.imageSrc} alt={card.imageAlt} fill sizes="340px" className="object-cover" />
                    </div>
                  </div>
                </article>
              ))}
            />
          </div>
        </section>

        {/* ── TECHNOLOGY ── */}
        <section id="technology" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="fade-in-up mx-auto max-w-3xl text-center">
            <h2 className="fade-in-up pop-in text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Technology Stack
            </h2>
            <div className="pop-in animation-delay-100 mx-auto mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-[#16d39a] to-[#47e3b6]" />
            <p className="fade-in-up animation-delay-200 mx-auto mt-5 max-w-2xl text-base font-medium text-[#9fc0b5] sm:text-lg">
              Built on cutting-edge cloud infrastructure with real-time data synchronization, autonomous algorithms, and industrial-grade safety protocols.
            </p>
          </div>

          <div className="mt-10 sm:mt-12">
            <Marquee
              duration={40}
              itemClassName="w-[240px] sm:w-[280px]"
              items={techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="w-full rounded-xl border border-[#17b68a]/40 bg-[#0a3d36]/60 p-5 shadow-lg backdrop-blur-sm transition-transform duration-300 sm:p-7 md:hover:scale-105 md:hover:shadow-2xl"
                >
                  <div className="text-2xl font-extrabold text-[#16d39a]">{tech.icon}</div>
                  <h3 className="mt-3 text-lg font-extrabold tracking-tight text-white">{tech.name}</h3>
                  <p className="mt-2 text-base font-medium text-[#9fc0b5]">{tech.desc}</p>
                </div>
              ))}
            />
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <section className="border-y border-[#0c453a] bg-[linear-gradient(180deg,#08342e_0%,#072b25_100%)]">
          <div className="fade-in-up mx-auto w-full max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
            <h2 className="pop-in text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Ready to modernize your field?
            </h2>
            <p className="fade-in-up mx-auto mt-5 max-w-2xl text-base font-medium text-[#9cbfb4] sm:text-lg">
              Join hundreds of innovative farmers using AgriDrill to scale their operations and reduce environmental footprint.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
              <button
                type="button"
                onClick={() => setSignupModalOpen(true)}
                className="rounded-lg bg-gradient-to-r from-[#15d8a0] to-[#47e3b6] px-8 py-3 text-base font-bold text-[#03251d] shadow-[0_0_25px_rgba(21,216,160,0.3)] transition duration-300 hover:brightness-110 active:scale-95 active:shadow-inner md:hover:scale-110 md:hover:shadow-[0_0_40px_rgba(21,216,160,0.5)]"
              >
                Get Started Now
              </button>
              <button
                type="button"
                className="rounded-lg border border-white/20 bg-white/5 px-8 py-3 text-base font-semibold text-white transition duration-300 hover:border-white/40 active:scale-95 active:shadow-inner md:hover:scale-110 md:hover:bg-white/20 md:hover:shadow-lg"
              >
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>

        {/* ── DEVELOPERS / TEAM SECTION ── */}
        <section id="developers" className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="fade-in-up mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full border border-[#47e3b6]/20 bg-[#47e3b6]/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#47e3b6]">
              The Team Composition
            </span>
            <h2 className="pop-in text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Meet the Developers</h2>
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-[#15d8a0]" />
            <p className="fade-in-up mx-auto mt-5 max-w-xl text-base font-medium text-[#9fc0b5] sm:text-lg">
              The student engineers and innovators behind AgriDrill&apos;s semi-autonomous farming platform.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {developers.map((member) => (
              <article
                key={member.name}
                className="pop-in rounded-2xl border border-[#15d8a0]/15 bg-[#062a23] p-5 text-center shadow-lg transition-transform duration-300 sm:p-7 md:hover:scale-105 md:hover:border-[#15d8a0]/40"
              >
                <div className="mx-auto mb-5 h-24 w-24 overflow-hidden rounded-full border-2 border-[#15d8a0]/25 bg-[#0a3d34]">
                  <Image
                    src={member.photo}
                    alt={`Photo of ${member.name}`}
                    width={96}
                    height={96}
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <p className="text-base font-bold text-white">{member.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-[#47e3b6]">{member.role}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#7aaa9e]">{member.desc}</p>
                <div className="mt-4 flex justify-center gap-3">
                  <a
                    href="#"
                    aria-label={`${member.name} on GitHub`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#15d8a0]/20 bg-[#0a3d34] text-[#47e3b6] transition hover:bg-[#15d8a0]/15"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    aria-label={`${member.name} on LinkedIn`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#15d8a0]/20 bg-[#0a3d34] text-[#47e3b6] transition hover:bg-[#15d8a0]/15"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                      <rect x="2" y="9" width="4" height="12" />
                      <circle cx="4" cy="4" r="2" />
                    </svg>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="fade-in-up border-t border-[#0f4b3f] bg-[linear-gradient(180deg,#041f1b_0%,#031713_100%)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
            <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">
              <div className="col-span-2 lg:col-span-1">
                <Link href="/landing" className="group inline-flex items-center gap-2">
                  <Image
                    src="/agridrill-logo.png"
                    alt="AgriDrill Logo"
                    width={30}
                    height={30}
                    className="h-[30px] w-[30px]"
                  />
                  <span
                    className="text-lg font-bold tracking-widest text-white transition-colors duration-300 group-hover:text-[#15d8a0]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    AgriDrill
                  </span>
                </Link>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8fb1a6]">
                  Semi-Autonomous precision farming platform focused on safer field operations, real-time telemetry, and
                  smarter crop outcomes.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b2d6c9]">Navigation</h3>
                <div className="mt-4 flex flex-col gap-2 text-sm text-[#8fb1a6]">
                  <a href="#features" className="transition hover:text-white">Features</a>
                  <a href="#technology" className="transition hover:text-white">Technology</a>
                  <a href="#safety" className="transition hover:text-white">Safety</a>
                  <a href="#developers" className="transition hover:text-white">Developers</a>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b2d6c9]">Resources</h3>
                <div className="mt-4 flex flex-col gap-2 text-sm text-[#8fb1a6]">
                  <a href="#" className="transition hover:text-white">Privacy Policy</a>
                  <a href="#" className="transition hover:text-white">Terms of Service</a>
                  <a href="#" className="transition hover:text-white">Cookie Policy</a>
                  <a href="#" className="transition hover:text-white">Documentation</a>
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b2d6c9]">Connect</h3>
                <div className="mt-4 flex flex-col gap-2 text-sm text-[#8fb1a6]">
                  <a href="mailto:hello@agridrill.dev" className="break-all transition hover:text-white">hello@agridrill.dev</a>
                  <a href="#" className="transition hover:text-white">LinkedIn</a>
                  <a href="#" className="transition hover:text-white">GitHub</a>
                  <a href="#" className="transition hover:text-white">Facebook</a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-[#73968b] sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 AgriDrill Inc. Empowering the future of precision agriculture.</p>
              <p>Built for farmers, researchers, and field engineers.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToSignup={() => setSignupModalOpen(true)}
      />

      {/* Signup Modal */}
      <SignupModal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onSwitchToLogin={() => setLoginModalOpen(true)}
      />
    </main>
  );
}
