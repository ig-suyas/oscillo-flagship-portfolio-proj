"use client";
import { useId, useRef, useState } from "react";

/**
 * Front-end only waitlist form. Native constraint validation drives the rules; messages are
 * our own and wired with aria-describedby. Nothing is sent anywhere (concept project).
 */
const EDITIONS = ["Carbon", "Signal", "Volt"] as const;
type Errors = Partial<Record<"name" | "email" | "edition" | "consent", string>>;

function validate(f: HTMLFormElement): Errors {
  const e: Errors = {};
  const get = (n: string) => f.elements.namedItem(n) as HTMLInputElement;
  const name = get("name"), email = get("email"), consent = get("consent");
  if (!name.value.trim()) e.name = "Add your name.";
  if (!email.value.trim()) e.email = "Add an email address.";
  else if (email.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) e.email = "That email looks incomplete.";
  if (!new FormData(f).get("edition")) e.edition = "Pick an edition.";
  if (!consent.checked) e.consent = "Tick this so we know you read it.";
  return e;
}

const Req = () => (
  <span className="text-ink" aria-hidden>
    {" "}*
  </span>
);

export function WaitlistForm() {
  const uid = useId();
  const id = (n: string) => `${uid}-${n}`;
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);
  const tried = useRef(false);
  const doneRef = useRef<HTMLDivElement>(null);

  const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    tried.current = true;
    const f = ev.currentTarget;
    const e = validate(f);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      (f.querySelector(`[name="${first}"]`) as HTMLElement | null)?.focus();
      return;
    }
    setDone(String(new FormData(f).get("edition")));
    requestAnimationFrame(() => doneRef.current?.focus());
  };
  const onChange = (ev: React.FormEvent<HTMLFormElement>) => tried.current && setErrors(validate(ev.currentTarget));

  if (done)
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="border-t-2 border-ink pt-6 outline-none">
        <p className="f-mono">Status · on the list</p>
        <p className="f-display mt-3 text-[clamp(2rem,4vw,4rem)] leading-[0.9]">You&apos;re in line.</p>
        <p className="mt-4 max-w-[26rem] text-lead leading-snug">
          {done} edition, noted. Well, noted in this tab only: this is a concept site, so no email is coming. The synth doesn&apos;t exist either. Sorry.
        </p>
        <button type="button" onClick={() => (setDone(null), (tried.current = false))} className="f-mono mt-6 underline underline-offset-4">
          Reset the form
        </button>
      </div>
    );

  const field = "mt-2 w-full border-0 border-b-2 border-ink bg-transparent py-2 text-lead text-ink placeholder:text-ink/45 focus:outline-none focus-visible:border-ink focus-visible:bg-ink/5";
  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={id(k + "-err")} className="f-mono mt-1.5 font-medium">
        <span aria-hidden>! </span>
        {errors[k]}
      </p>
    ) : null;

  return (
    <form noValidate onSubmit={onSubmit} onChange={onChange} aria-describedby={id("req")} className="text-ink">
      <p id={id("req")} className="f-mono mb-4">
        Fields marked <span aria-hidden>*</span>
        <span className="sr-only">with an asterisk</span> are required
      </p>
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <div>
          <label htmlFor={id("name")} className="f-mono">
            Name<Req />
          </label>
          <input id={id("name")} name="name" autoComplete="name" required aria-required aria-invalid={!!errors.name} aria-describedby={errors.name ? id("name-err") : undefined} className={field} placeholder="Your name" />
          {err("name")}
        </div>
        <div>
          <label htmlFor={id("email")} className="f-mono">
            Email<Req />
          </label>
          <input id={id("email")} name="email" type="email" autoComplete="email" inputMode="email" required aria-required aria-invalid={!!errors.email} aria-describedby={errors.email ? id("email-err") : undefined} className={field} placeholder="you@studio.fm" />
          {err("email")}
        </div>
      </div>
      <fieldset className="mt-5" aria-invalid={!!errors.edition} aria-describedby={errors.edition ? id("edition-err") : undefined}>
        <legend className="f-mono">
          Edition<Req />
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {EDITIONS.map((e) => (
            <label key={e} className="relative">
              <input type="radio" name="edition" value={e} required className="peer absolute inset-0 opacity-0" />
              <span className="f-mono block border-2 border-ink px-4 py-2 transition-colors peer-checked:bg-ink peer-checked:text-signal peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink">
                {e}
              </span>
            </label>
          ))}
        </div>
        {err("edition")}
      </fieldset>
      <div className="mt-5">
        <label className="flex items-start gap-3 text-[0.95rem] leading-snug">
          <input name="consent" type="checkbox" required aria-required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? id("consent-err") : undefined} className="mt-0.5 h-5 w-5 shrink-0 accent-ink" />
          <span>
            I understand the OSC-1 is a concept and this list is make-believe.<Req />
          </span>
        </label>
        {err("consent")}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="submit" className="f-display bg-ink px-7 py-4 text-[clamp(1rem,1.3vw,1.3rem)] text-signal transition-transform hover:-translate-y-0.5 focus-visible:outline-ink">
          Join the waitlist
        </button>
        <p className="f-mono max-w-[16rem] font-medium">
          <span aria-hidden>● </span>Concept: nothing is sent
        </p>
      </div>
    </form>
  );
}
