import Link from "next/link";

export type Breadcrumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: readonly Breadcrumb[] }) {
  return (
    <nav className="authority-breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
