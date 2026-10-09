import { Badge, Card, Flex, Heading, Icon, Link, List, Text } from "@chakra-ui/react";
import { Accessibility } from "lucide-react";
import type { AccessibilityReport } from "../../../accessibility.js";
import { ReviewItemActions } from "../../ReviewAutomation/index.js";

export function ScreenAccessibilityIssue({ issue }: {
  issue: AccessibilityReport["issues"][number];
}) {
  return (
    <Card.Root as="article" size="sm" variant="outline" bg="bg.panel" borderColor="border.emphasized" borderRadius="xl" aria-label={`Accessibility issue: ${issue.help}`}>
      <Card.Header>
        <Flex align="center" gap="2" flexWrap="wrap">
          <Badge colorPalette="purple"><Icon><Accessibility /></Icon>Accessibility</Badge>
          <Badge colorPalette={issue.impact === "critical" || issue.impact === "serious" ? "red" : "orange"}>
            {issue.impact ?? "Unspecified severity"}
          </Badge>
        </Flex>
        <Heading as="h3" size="sm" overflowWrap="anywhere">{issue.help}</Heading>
        <Text fontSize="xs" color="fg.muted">{issue.id} · {issue.count} affected {issue.count === 1 ? "element" : "elements"}</Text>
      </Card.Header>
      <Card.Body gap="2">
        <List.Root ps="4" gap="2">
          {issue.targets.map((target) => (
            <List.Item key={target} fontFamily="mono" fontSize="xs" overflowWrap="anywhere">{target}</List.Item>
          ))}
        </List.Root>
        <Link href={issue.helpUrl} target="_blank" rel="noopener noreferrer" fontSize="sm" color="blue.fg">Read more</Link>
      </Card.Body>
      <Card.Footer borderTopWidth="1px" borderColor="border" bg="bg.subtle">
        <ReviewItemActions target={{ kind: "accessibility", issueId: issue.id }} />
      </Card.Footer>
    </Card.Root>
  );
}
