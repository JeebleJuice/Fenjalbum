import Link from "next/link";
import { cloneElement, isValidElement } from "react";
import { cn } from "@/lib/utils";

export function Button({
  className,
  asChild = false,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger"; asChild?: boolean }) {
  const styles =
    variant === "primary"
      ? "bg-[hsl(var(--fg))] text-[hsl(var(--bg))] hover:opacity-90"
      : variant === "danger"
        ? "bg-[hsl(var(--danger))] text-white hover:opacity-90"
        : "bg-[hsl(var(--card))] text-[hsl(var(--fg))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]";
  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition focus-visible:focus-ring disabled:pointer-events-none disabled:opacity-50",
    styles,
    className
  );
  if (asChild && isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{ className?: string }>;
    return cloneElement(child, {
      className: cn(classes, child.props.className)
    });
  }
  return (
    <button
      className={classes}
      {...props}
    />
  );
}

export function IconButton({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] transition hover:bg-[hsl(var(--muted))] focus-visible:focus-ring",
        className
      )}
      {...props}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:focus-ring dark:placeholder:text-slate-500",
        props.className
      )}
      {...props}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:focus-ring dark:placeholder:text-slate-500",
        props.className
      )}
      {...props}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 text-sm shadow-sm outline-none transition focus-visible:focus-ring",
        props.className
      )}
      {...props}
    />
  );
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--fg))]/80",
        className
      )}
      {...props}
    />
  );
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 shadow-soft",
        className
      )}
      {...props}
    />
  );
}

export function CardLink({ href, className, ...props }: React.ComponentProps<typeof Link>) {
  return <Link href={href} className={cn("block", className)} {...props} />;
}
