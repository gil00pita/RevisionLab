"use client";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Icon,
  Input,
  List,
  SegmentGroup,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Check, Copy, FileText } from "lucide-react";
import { Eyebrow } from "./shared";
import { evidence } from "./evidence";

export function TicketDraft({ sources }: { sources: number[] | null }) {
  const [title, setTitle] = useState("Improve affordability step clarity");
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState(
    "Review the relationship between the repayment estimate and affordability questions using the selected evidence.",
  );
  const [criteria, setCriteria] = useState(
    sources?.map((i) => evidence[i].criterion).join("\n") ?? "",
  );
  const [status, setStatus] = useState(
    sources ? "Example draft prepared. Review and edit the proposed work." : "",
  );
  const titleRef = useRef<HTMLInputElement>(null);

  async function copy() {
    const content = `${title}\n\nPriority: ${priority}\n\n${description}\n\nSupporting evidence\n${sources?.map((i) => `- ${evidence[i].type}: ${evidence[i].text} (${evidence[i].source})`).join("\n")}\n\nAcceptance criteria\n${criteria
      .split("\n")
      .map((item) => `- [ ] ${item}`)
      .join("\n")}`;
    try {
      await navigator.clipboard.writeText(content);
      setStatus(
        "Draft copied for manual Jira handoff. No Jira ticket was created.",
      );
    } catch {
      setStatus(
        "Clipboard unavailable. Select and copy the editable draft manually.",
      );
    }
  }

  useEffect(() => {
    if (!sources) return;
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [sources]);

  return (
    <Box
      bg="gray.900"
      borderWidth="1px"
      borderColor="gray.700"
      borderRadius="lg"
      p={{ base: "5", md: "7" }}
    >
      <Flex align="center" gap="2" justify="space-between">
        <Eyebrow light>
          {sources ? "DRAFT_01 / Editable" : "Evidence → work"}
        </Eyebrow>
        <Icon color="blue.300">
          <FileText />
        </Icon>
      </Flex>
      <Heading
        as="h3"
        fontFamily="Manrope, sans-serif"
        fontSize="24px"
        fontWeight="500"
        letterSpacing="-0.035em"
        mt="5"
      >
        Turn evidence into work without losing the why.
      </Heading>
      {sources ? (
        <Box mt="6">
          <Field.Root mb="5">
            <Field.Label fontSize="xs" color="gray.300">
              Ticket title
            </Field.Label>
            <Input
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              bg="gray.800"
              borderColor="gray.600"
              color="gray.100"
              minH="44px"
            />
          </Field.Root>
          <Text id="ticket-priority" fontSize="xs" color="gray.300" mb="2">
            Suggested priority · editable
          </Text>
          <SegmentGroup.Root
            value={priority}
            onValueChange={(event) => setPriority(event.value ?? "Medium")}
            aria-labelledby="ticket-priority"
            bg="gray.800"
            color="gray.300"
            size="sm"
          >
            <SegmentGroup.Indicator bg="gray.600" />
            {["Low", "Medium", "High"].map((value) => (
              <SegmentGroup.Item key={value} value={value} minH="44px">
                <SegmentGroup.ItemText color="gray.100">
                  {value}
                </SegmentGroup.ItemText>
                <SegmentGroup.ItemHiddenInput />
              </SegmentGroup.Item>
            ))}
          </SegmentGroup.Root>
          <Field.Root mt="5">
            <Field.Label fontSize="xs" color="gray.300">
              Description
            </Field.Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              bg="gray.800"
              borderColor="gray.600"
              color="gray.100"
              rows={3}
            />
          </Field.Root>
          <Text mt="5" fontSize="xs" color="gray.300">
            Supporting evidence
          </Text>
          <List.Root gap="2" ps="4" mt="2" fontSize="11px" color="gray.300">
            {sources.map((i) => (
              <List.Item key={i}>
                {evidence[i].type} · {evidence[i].id} · Version 3
              </List.Item>
            ))}
          </List.Root>
          <Field.Root mt="5">
            <Field.Label fontSize="xs" color="gray.300">
              Acceptance criteria · one per line
            </Field.Label>
            <Textarea
              value={criteria}
              onChange={(event) => setCriteria(event.target.value)}
              bg="gray.800"
              borderColor="gray.600"
              color="gray.100"
              rows={4}
            />
          </Field.Root>
          <Flex
            mt="5"
            align="center"
            gap="3"
            justify="space-between"
            wrap="wrap"
          >
            <Text fontFamily="mono" fontSize="10px" color="blue.300">
              {sources.length} source {sources.length === 1 ? "item" : "items"}{" "}
              retained
            </Text>
            <Button
              variant="outline"
              minH="44px"
              color="gray.100"
              borderColor="gray.500"
              onClick={copy}
            >
              <Icon size="sm">
                <Copy />
              </Icon>
              Copy for Jira
            </Button>
          </Flex>
        </Box>
      ) : (
        <Box
          mt="8"
          py="12"
          textAlign="center"
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="gray.600"
          rounded="md"
        >
          <Icon color="blue.300" size="lg">
            <Check />
          </Icon>
          <Text fontSize="sm" color="gray.300" mt="4">
            Select evidence to prepare a draft.
          </Text>
          <Text fontSize="xs" color="gray.400" mt="2">
            Source context stays attached.
          </Text>
        </Box>
      )}
      <Text
        role="status"
        color="blue.200"
        fontSize="xs"
        mt={status ? "4" : "0"}
      >
        {status}
      </Text>
    </Box>
  );
}
