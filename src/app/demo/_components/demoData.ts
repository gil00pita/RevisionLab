export const demoSteps = [
  {
    slug: "finance",
    label: "Finance options",
    title: "Find the right finance plan.",
    description:
      "Choose a vehicle price, deposit and term to explore an example monthly payment.",
  },
  {
    slug: "applicant",
    label: "Applicant details",
    title: "A little about you.",
    description:
      "Use the fictional details below, or edit them to try a different example.",
  },
  {
    slug: "income",
    label: "Income",
    title: "Let’s check affordability.",
    description:
      "Add sample monthly income and spending to see how the payment fits.",
  },
  {
    slug: "review",
    label: "Review",
    title: "Everything look right?",
    description:
      "Review your example and go back to edit any details before confirming.",
  },
  {
    slug: "confirmation",
    label: "Confirmation",
    title: "You’re on your way.",
    description: "You’ve reached the end of this five-page prototype journey.",
  },
] as const;

export const defaultDemoDraft = {
  vehiclePrice: "28500",
  deposit: "4000",
  months: "48",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  income: "3200",
  spending: "1850",
};

export type DemoDraft = typeof defaultDemoDraft;
export type DemoField = keyof DemoDraft;
export type DemoErrors = Partial<Record<DemoField, string>>;

export const fieldSteps: Record<DemoField, number> = {
  vehiclePrice: 0,
  deposit: 0,
  months: 0,
  firstName: 1,
  lastName: 1,
  email: 1,
  income: 2,
  spending: 2,
};

export function validateDemoStep(draft: DemoDraft, step: number): DemoErrors {
  const errors: DemoErrors = {};
  if (step === 0 || step === 3) {
    const price = Number(draft.vehiclePrice);
    const deposit = Number(draft.deposit);
    const months = Number(draft.months);
    if (
      !draft.vehiclePrice ||
      !Number.isFinite(price) ||
      price < 1000 ||
      price > 100000
    )
      errors.vehiclePrice =
        "Enter a vehicle price between £1,000 and £100,000.";
    if (
      !draft.deposit ||
      !Number.isFinite(deposit) ||
      deposit < 0 ||
      deposit >= price
    )
      errors.deposit =
        "Enter a deposit of £0 or more, below the vehicle price.";
    if (
      !draft.months ||
      !Number.isInteger(months) ||
      months < 12 ||
      months > 60
    )
      errors.months = "Enter a whole number of months between 12 and 60.";
  }
  if (step === 1 || step === 3) {
    if (!draft.firstName.trim())
      errors.firstName = "Enter a sample first name.";
    if (!draft.lastName.trim()) errors.lastName = "Enter a sample last name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email))
      errors.email = "Enter a valid sample email address.";
  }
  if (step === 2 || step === 3) {
    for (const field of ["income", "spending"] as const) {
      if (
        !draft[field] ||
        !Number.isFinite(Number(draft[field])) ||
        Number(draft[field]) < 0 ||
        Number(draft[field]) > 100000
      )
        errors[field] =
          `Enter monthly ${field === "income" ? "income" : "spending"} between £0 and £100,000.`;
    }
  }
  return errors;
}

export function monthlyPayment(draft: DemoDraft) {
  if (Object.keys(validateDemoStep(draft, 0)).length) return null;
  const borrowing = Number(draft.vehiclePrice) - Number(draft.deposit);
  // A deterministic illustration, not a finance quote or APR calculation.
  return Math.round(
    (borrowing * (1 + (0.0155 * Number(draft.months)) / 12)) /
      Number(draft.months),
  );
}

export function pounds(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}
