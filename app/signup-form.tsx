"use client";

import { revalidateLogic, useForm } from "@tanstack/react-form";
import { useRef, useState } from "react";
import { z } from "zod";

const signupSchema = z.object({
  firstName: z.string().trim().min(1, "First Name cannot be empty"),
  lastName: z.string().trim().min(1, "Last Name cannot be empty"),
  email: z.string().trim().min(1, "Email Address cannot be empty").pipe(z.email("Looks like this is not an email")),
  password: z.string().min(1, "Password cannot be empty"),
});

type SignupValues = z.input<typeof signupSchema>;
type FieldName = keyof SignupValues;

const fields: ReadonlyArray<{ name: FieldName; label: string; type: string; autoComplete: string }> = [
  { name: "firstName", label: "First Name", type: "text", autoComplete: "given-name" },
  { name: "lastName", label: "Last Name", type: "text", autoComplete: "family-name" },
  { name: "email", label: "Email Address", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

const emptyValues: SignupValues = { firstName: "", lastName: "", email: "", password: "" };

/** Simulated round trip so the busy state is visible; nothing leaves the browser. */
const DEMO_DELAY_MS = 900;

/** Never runs: onSubmit always prevents the default submit once the page has hydrated. */
function noScriptSafeAction() {}

function errorText(errors: unknown[]): string | undefined {
  const first = errors.find(Boolean);
  if (!first) return undefined;
  if (typeof first === "string") return first;
  return (first as { message?: string }).message;
}

export function SignupForm() {
  const [claimedBy, setClaimedBy] = useState<string | null>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const form = useForm({
    defaultValues: emptyValues,
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: { onDynamic: signupSchema },
    onSubmit: async ({ value, formApi }) => {
      setClaimedBy(null);
      await new Promise(resolve => setTimeout(resolve, DEMO_DELAY_MS));
      setClaimedBy(value.firstName.trim());
      formApi.reset();
      statusRef.current?.focus();
    },
    onSubmitInvalid: ({ value }) => {
      const result = signupSchema.safeParse(value);
      const invalid = new Set(result.error?.issues.map(issue => issue.path[0]));
      const first = fields.find(field => invalid.has(field.name));
      if (first) document.getElementById(first.name)?.focus();
    },
  });

  return (
    <div className="signup-card">
      <form
        // A function action makes React render an inert action, so a no-JavaScript submit sends nothing; onSubmit below handles every hydrated submit.
        action={noScriptSafeAction}
        noValidate
        aria-label="Claim your free trial"
        onSubmit={event => {
          event.preventDefault();
          event.stopPropagation();
          if (form.state.isSubmitting) return;
          void form.handleSubmit();
        }}
      >
        <div className="fields">
          {fields.map(({ name, label, type, autoComplete }) => (
            <form.Field key={name} name={name}>
              {field => {
                const message = errorText(field.state.meta.errors);
                const errorId = `${name}-error`;
                return (
                  <div className="field">
                    <label className="sr-only" htmlFor={name}>{label}</label>
                    <input
                      id={name}
                      name={name}
                      type={type}
                      autoComplete={autoComplete}
                      placeholder={label}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={event => field.handleChange(event.target.value)}
                      aria-invalid={message ? true : undefined}
                      aria-describedby={message ? errorId : undefined}
                    />
                    {message ? <p id={errorId} className="field-error">{message}</p> : null}
                  </div>
                );
              }}
            </form.Field>
          ))}
        </div>
        <div className="submit">
          <form.Subscribe selector={state => state.isSubmitting}>
            {isSubmitting => (
              <>
                <button type="submit" className="claim" aria-busy={isSubmitting || undefined}>
                  {isSubmitting ? <span className="spinner" aria-hidden="true" /> : null}
                  Claim your free trial
                </button>
                <p ref={statusRef} className="form-status" role="status" tabIndex={-1}>
                  {isSubmitting ? "Checking your details…" : claimedBy ? `Thanks, ${claimedBy}! Your trial claim worked in this demo, but nothing was sent.` : ""}
                </p>
              </>
            )}
          </form.Subscribe>
          <p className="terms">By clicking the button, you are agreeing to our <strong>Terms and Services</strong></p>
          <p className="demo-note">Demo only: nothing is sent.</p>
        </div>
      </form>
    </div>
  );
}
