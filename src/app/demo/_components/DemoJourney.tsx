"use client";

import { useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  Icon,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DemoShell } from "./DemoShell";
import { DemoFields } from "./DemoFields";
import { DemoEstimate } from "./DemoEstimate";
import { DemoReview } from "./DemoReview";
import { DemoConfirmation } from "./DemoConfirmation";
import {
  demoSteps,
  fieldSteps,
  validateDemoStep,
  type DemoErrors,
  type DemoField,
} from "./demoData";
import { useDemoDraft } from "./useDemoDraft";

export function DemoJourney({ step }: { step: number }) {
  const { draft, update, reset } = useDemoDraft();
  const [errors, setErrors] = useState<DemoErrors>({});
  const router = useRouter();
  const current = demoSteps[step];
  const firstError = (Object.keys(errors) as DemoField[]).find(
    (field) => errors[field],
  );

  function continueJourney(event: SubmitEvent) {
    event.preventDefault();
    const nextErrors = validateDemoStep(draft, step);
    setErrors(nextErrors);
    const invalidField = Object.keys(nextErrors)[0] as DemoField | undefined;
    if (invalidField) {
      document.getElementById(`demo-${invalidField}`)?.focus();
      return;
    }
    router.push(`/demo/${demoSteps[step + 1].slug}`);
  }

  function changeField(field: DemoField, value: string) {
    update(field, value);
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  function restart() {
    reset();
    router.push("/demo/finance");
  }

  return (
    <DemoShell step={step}>
      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1.6fr) minmax(0, 1fr)" }}
        gap="6"
        alignItems="start"
      >
        <Stack
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          p={{ base: "6", md: "9" }}
          gap="7"
          minW="0"
        >
          <Box>
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="wide"
              fontWeight="semibold"
              color="colorPalette.fg"
            >
              Vehicle finance · {step + 1} of 5
            </Text>
            <Heading
              as="h1"
              size={{ base: "2xl", md: "3xl" }}
              letterSpacing="tight"
              mt="3"
            >
              {current.title}
            </Heading>
            <Text color="fg.muted" mt="3">
              {current.description}
            </Text>
          </Box>
          {step === 4 ? (
            <DemoConfirmation firstName={draft.firstName} onRestart={restart} />
          ) : (
            <Stack
              as="form"
              onSubmit={continueJourney}
              gap="7"
              aria-label={current.label}
            >
              {step < 3 ? (
                <DemoFields
                  step={step}
                  draft={draft}
                  errors={errors}
                  onChange={changeField}
                />
              ) : (
                <DemoReview draft={draft} />
              )}
              {firstError && errors[firstError] && (
                <Box
                  role="alert"
                  bg="bg.error"
                  color="fg.error"
                  p="4"
                  borderRadius="md"
                >
                  <Text>{errors[firstError]}</Text>
                  {step === 3 && (
                    <Link asChild mt="2" minH="11">
                      <NextLink
                        href={`/demo/${demoSteps[fieldSteps[firstError]].slug}`}
                      >
                        Edit these details
                      </NextLink>
                    </Link>
                  )}
                </Box>
              )}
              <Flex gap="3" justify="space-between" align="center" wrap="wrap">
                {step > 0 && (
                  <Link asChild minH="11" color="fg.muted">
                    <NextLink href={`/demo/${demoSteps[step - 1].slug}`}>
                      <Icon size="sm">
                        <ArrowLeft />
                      </Icon>
                      Back
                    </NextLink>
                  </Link>
                )}
                <Button
                  type="submit"
                  formNoValidate
                  colorPalette="teal"
                  bg="colorPalette.fg"
                  color="bg.panel"
                  focusRingColor="colorPalette.fg"
                  _hover={{ bg: "colorPalette.fg/90" }}
                  size="lg"
                  minH="12"
                  ms="auto"
                >
                  {step === 3 ? "Confirm example" : "Continue"}
                  <Icon size="sm">
                    <ArrowRight />
                  </Icon>
                </Button>
              </Flex>
            </Stack>
          )}
        </Stack>
        <DemoEstimate draft={draft} showAffordability={step >= 2} />
      </Grid>
    </DemoShell>
  );
}
