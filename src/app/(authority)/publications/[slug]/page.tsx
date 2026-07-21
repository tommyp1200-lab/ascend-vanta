import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicationPage } from "@/components/authority/PublicationPage";
import { PUBLICATIONS, getPublication } from "@/lib/authorityContent";
import { authorityMetadata } from "@/lib/authorityMetadata";

export function generateStaticParams() { return PUBLICATIONS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const { slug } = await params; const item = getPublication(slug); if (!item) return {}; return authorityMetadata({ title: item.title, description: item.description, path: `/publications/${slug}`, image: `/assets/publications/${item.folder}/page-01.webp`, imageAlt: `${item.title} cover`, imageWidth: 1122, imageHeight: 1402 }); }
export default async function PublicationRoute({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const item = getPublication(slug); if (!item) notFound(); return <PublicationPage publication={item} />; }
