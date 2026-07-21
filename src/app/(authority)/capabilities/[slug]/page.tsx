import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CapabilityPage } from "@/components/authority/CapabilityPage";
import { CAPABILITIES, getCapability } from "@/lib/authorityContent";
import { authorityMetadata } from "@/lib/authorityMetadata";

export function generateStaticParams() { return CAPABILITIES.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = getCapability(slug); if (!item) return {}; return authorityMetadata({ title: item.title, description: item.description, path: `/capabilities/${slug}`, image: item.image, imageAlt: item.imageAlt, imageWidth: 1672, imageHeight: 941 }); }
export default async function CapabilityRoute({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = getCapability(slug); if (!item) notFound(); return <CapabilityPage capability={item} />; }
