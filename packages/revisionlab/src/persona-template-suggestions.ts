// Built-in examples are illustrative starting points, never verified research.
export const builtInPersonaSuggestions = [
  {
    "id": "first-time-novice",
    "category": "Onboarding",
    "icon": "sparkles",
    "name": "First-time or novice user",
    "description": "Unfamiliar with the product, needs clear guidance, onboarding and forgiving interactions.",
    "goals": [
      "Understand the product's purpose.",
      "Complete an initial task successfully.",
      "Learn how to navigate the interface.",
      "Understand the available functionality.",
      "Gain confidence using the product."
    ],
    "motivations": [
      "Solve an immediate problem.",
      "Discover whether the product meets their needs.",
      "Learn without feeling overwhelmed.",
      "Achieve an early success."
    ],
    "painPoints": [
      "Unfamiliar terminology.",
      "Complex navigation.",
      "Too many options presented at once.",
      "Unclear next steps.",
      "Lack of helpful feedback."
    ],
    "behaviours": [
      "Explores basic functionality.",
      "May rely on onboarding instructions.",
      "Looks for clear navigation labels.",
      "May avoid unfamiliar advanced options.",
      "May revisit instructions."
    ],
    "needs": [
      "Clear onboarding.",
      "Plain language.",
      "Contextual help.",
      "Predictable navigation.",
      "Forgiving interactions.",
      "Clear error recovery."
    ],
    "scenarios": [
      "Creating an account for the first time.",
      "Completing an initial workflow.",
      "Discovering a feature.",
      "Recovering from an input error."
    ],
    "characteristics": [
      {
        "label": "Product Familiarity",
        "value": "Low"
      },
      {
        "label": "Need for Guidance",
        "value": "High"
      },
      {
        "label": "Familiarity with Workflows",
        "value": "Low"
      }
    ],
    "quote": "I want to understand what to do without having to read a manual."
  },
  {
    "id": "regular-user",
    "category": "Usage",
    "icon": "repeat",
    "name": "Regular user",
    "description": "Uses the product repeatedly and values predictability, speed and continuity.",
    "goals": [
      "Complete recurring tasks efficiently.",
      "Maintain a consistent workflow.",
      "Access frequently used features quickly.",
      "Track progress across sessions.",
      "Minimise unnecessary repetition."
    ],
    "motivations": [
      "Productivity.",
      "Reliability.",
      "Familiarity.",
      "Consistent performance."
    ],
    "painPoints": [
      "Unexpected interface changes.",
      "Repetitive manual tasks.",
      "Slow navigation.",
      "Inconsistent interactions.",
      "Loss of previous progress."
    ],
    "behaviours": [
      "Follows established workflows.",
      "Uses familiar navigation patterns.",
      "Returns to frequently used areas.",
      "Develops product habits.",
      "Notices changes to established functionality."
    ],
    "needs": [
      "Consistency.",
      "Reliable performance.",
      "Persistent settings.",
      "Quick access to common actions.",
      "Continuity between sessions."
    ],
    "scenarios": [
      "Completing a daily workflow.",
      "Returning to an unfinished task.",
      "Reviewing previously created content.",
      "Repeating a frequently used process."
    ],
    "characteristics": [
      {
        "label": "Product Familiarity",
        "value": "High"
      },
      {
        "label": "Workflow Familiarity",
        "value": "High"
      },
      {
        "label": "Need for Guidance",
        "value": "Low to Medium"
      }
    ],
    "quote": "I use this regularly, so I want everything to work the way I expect."
  },
  {
    "id": "expert-power-user",
    "category": "Usage",
    "icon": "zap",
    "name": "Expert or power user",
    "description": "Uses advanced features, shortcuts, bulk actions and customisation.",
    "goals": [
      "Complete complex tasks efficiently.",
      "Automate repetitive processes.",
      "Use advanced capabilities.",
      "Optimise existing workflows.",
      "Reduce unnecessary interactions."
    ],
    "motivations": [
      "Efficiency.",
      "Control.",
      "Productivity.",
      "Flexibility.",
      "Advanced functionality."
    ],
    "painPoints": [
      "Limited customisation.",
      "Too many confirmation steps.",
      "Missing keyboard shortcuts.",
      "Restricted bulk operations.",
      "Inefficient advanced workflows."
    ],
    "behaviours": [
      "Uses shortcuts and advanced features.",
      "Customises settings.",
      "Works with complex data.",
      "May automate repetitive tasks.",
      "Experiments with advanced functionality."
    ],
    "needs": [
      "Advanced controls.",
      "Keyboard shortcuts.",
      "Bulk operations.",
      "Configurable workflows.",
      "Powerful filtering and searching.",
      "Reliable undo or recovery mechanisms."
    ],
    "scenarios": [
      "Editing multiple records.",
      "Configuring advanced settings.",
      "Creating automated workflows.",
      "Managing complex datasets."
    ],
    "characteristics": [
      {
        "label": "Product Familiarity",
        "value": "Very High"
      },
      {
        "label": "Advanced Feature Usage",
        "value": "High"
      },
      {
        "label": "Need for Basic Guidance",
        "value": "Low"
      }
    ],
    "quote": "Give me the tools and flexibility to work the way I want."
  },
  {
    "id": "occasional-returning-user",
    "category": "Usage",
    "icon": "rotate-ccw",
    "name": "Occasional or returning user",
    "description": "Uses the product infrequently and may need reminders or contextual help.",
    "goals": [
      "Complete an infrequent task.",
      "Quickly remember how the product works.",
      "Find the required functionality.",
      "Resume previous activities.",
      "Avoid unnecessary relearning."
    ],
    "motivations": [
      "Convenience.",
      "Task completion.",
      "Minimal effort.",
      "Familiarity."
    ],
    "painPoints": [
      "Forgotten navigation patterns.",
      "Changes since the last visit.",
      "Difficulty remembering settings.",
      "Unclear terminology.",
      "Having to repeat setup steps."
    ],
    "behaviours": [
      "Uses the product intermittently.",
      "Revisits familiar features.",
      "May need contextual reminders.",
      "Searches for previously used actions.",
      "May depend on recognition over recall."
    ],
    "needs": [
      "Clear navigation.",
      "Contextual guidance.",
      "Consistent terminology.",
      "Easy task resumption.",
      "Visible recent activity."
    ],
    "scenarios": [
      "Returning after several months.",
      "Updating account information.",
      "Completing an annual task.",
      "Resuming an unfinished workflow."
    ],
    "characteristics": [
      {
        "label": "Usage Frequency",
        "value": "Low"
      },
      {
        "label": "Familiarity Retention",
        "value": "Variable"
      },
      {
        "label": "Need for Contextual Guidance",
        "value": "Medium to High"
      }
    ],
    "quote": "I don't use this often, so help me remember where everything is."
  },
  {
    "id": "guest-unauthenticated-user",
    "category": "Access",
    "icon": "user-round",
    "name": "Guest or unauthenticated user",
    "description": "Has limited access and may be evaluating the product before registering.",
    "goals": [
      "Explore the product.",
      "Understand the value proposition.",
      "Access publicly available features.",
      "Evaluate functionality before committing.",
      "Decide whether to register."
    ],
    "motivations": [
      "Curiosity.",
      "Product evaluation.",
      "Convenience.",
      "Low commitment.",
      "Immediate access."
    ],
    "painPoints": [
      "Mandatory registration too early.",
      "Unclear feature restrictions.",
      "Hidden functionality.",
      "Excessive information requests.",
      "Unexpected interruptions."
    ],
    "behaviours": [
      "Explores available functionality.",
      "Evaluates value before registering.",
      "May abandon lengthy onboarding.",
      "Compares the experience with alternatives.",
      "May return later."
    ],
    "needs": [
      "Clear feature explanations.",
      "Transparent access restrictions.",
      "Easy navigation.",
      "Low-friction exploration.",
      "Simple registration when needed."
    ],
    "scenarios": [
      "Visiting the product for the first time.",
      "Exploring a public demo.",
      "Viewing shared content.",
      "Attempting a restricted action.",
      "Deciding whether to create an account."
    ],
    "characteristics": [
      {
        "label": "Product Familiarity",
        "value": "Variable"
      },
      {
        "label": "Account Access",
        "value": "Limited"
      },
      {
        "label": "Commitment Level",
        "value": "Undetermined"
      }
    ],
    "quote": "Let me understand what this offers before asking me to sign up."
  },
  {
    "id": "administrator-operator",
    "category": "Operations",
    "icon": "settings",
    "name": "Administrator or operator",
    "description": "Configures the system, manages users, permissions, settings and data.",
    "goals": [
      "Maintain system reliability.",
      "Manage users and permissions.",
      "Configure organisational settings.",
      "Protect sensitive data.",
      "Resolve operational issues.",
      "Maintain governance and compliance."
    ],
    "motivations": [
      "Security.",
      "Reliability.",
      "Control.",
      "Operational efficiency.",
      "Accountability."
    ],
    "painPoints": [
      "Unclear permissions.",
      "Complex configuration.",
      "Limited audit visibility.",
      "Difficult user management.",
      "Poor error reporting.",
      "Risk of accidental changes."
    ],
    "behaviours": [
      "Reviews settings and permissions.",
      "Manages users and access.",
      "Investigates operational problems.",
      "Performs administrative tasks.",
      "Monitors system activity."
    ],
    "needs": [
      "Clear permission management.",
      "Audit trails.",
      "Bulk administrative actions.",
      "Action confirmation for destructive operations.",
      "Detailed system feedback.",
      "Secure configuration."
    ],
    "scenarios": [
      "Adding new users.",
      "Changing permissions.",
      "Reviewing access rights.",
      "Investigating system issues.",
      "Managing organisational settings."
    ],
    "characteristics": [
      {
        "label": "Responsibility Level",
        "value": "High"
      },
      {
        "label": "Administrative Access",
        "value": "High"
      },
      {
        "label": "Need for Auditability",
        "value": "High"
      }
    ],
    "quote": "I need control and visibility without risking the stability or security of the system."
  },
  {
    "id": "buyer-decision-maker",
    "category": "Decision",
    "icon": "briefcase-business",
    "name": "Buyer or decision-maker",
    "description": "Selects or purchases the product but may not use it day to day.",
    "goals": [
      "Evaluate potential solutions.",
      "Understand business value.",
      "Compare products and services.",
      "Assess costs and risks.",
      "Make informed purchasing decisions."
    ],
    "motivations": [
      "Return on investment.",
      "Cost efficiency.",
      "Risk reduction.",
      "Business value.",
      "Organisational improvement."
    ],
    "painPoints": [
      "Unclear pricing.",
      "Difficult product comparisons.",
      "Limited evidence of benefits.",
      "Complex purchasing processes.",
      "Missing security or compliance information."
    ],
    "behaviours": [
      "Reviews product information.",
      "Compares alternatives.",
      "Consults stakeholders.",
      "Evaluates business requirements.",
      "Seeks evidence supporting purchasing decisions."
    ],
    "needs": [
      "Transparent pricing.",
      "Clear feature comparisons.",
      "Product demonstrations.",
      "Business value explanations.",
      "Relevant case studies.",
      "Security and compliance information."
    ],
    "scenarios": [
      "Evaluating a new product.",
      "Comparing vendors.",
      "Reviewing a proposal.",
      "Approving a purchase.",
      "Presenting recommendations to stakeholders."
    ],
    "characteristics": [
      {
        "label": "Purchasing Influence",
        "value": "High"
      },
      {
        "label": "Daily Product Usage",
        "value": "Variable"
      },
      {
        "label": "Need for Business Evidence",
        "value": "High"
      }
    ],
    "quote": "Show me how this solves a real business problem and why it's worth the investment."
  },
  {
    "id": "support-service-agent",
    "category": "Support",
    "icon": "life-buoy",
    "name": "Support or service agent",
    "description": "Resolves user problems, investigates records and may act on another user's behalf.",
    "goals": [
      "Resolve user issues efficiently.",
      "Access relevant information.",
      "Maintain service quality.",
      "Reduce resolution time.",
      "Provide consistent support."
    ],
    "motivations": [
      "Customer satisfaction.",
      "Efficiency.",
      "Accuracy.",
      "Problem resolution.",
      "Service quality."
    ],
    "painPoints": [
      "Fragmented customer information.",
      "Slow information retrieval.",
      "Repetitive administrative tasks.",
      "Unclear issue histories.",
      "Insufficient permissions.",
      "Poor handover between teams."
    ],
    "behaviours": [
      "Searches for customer information.",
      "Investigates reported issues.",
      "Reviews interaction histories.",
      "Updates records.",
      "Escalates complex problems.",
      "Works across multiple systems."
    ],
    "needs": [
      "Fast information retrieval.",
      "Clear case histories.",
      "Accurate user records.",
      "Efficient search and filtering.",
      "Contextual user information.",
      "Secure role-based access."
    ],
    "scenarios": [
      "Investigating a reported issue.",
      "Updating a support ticket.",
      "Reviewing previous interactions.",
      "Escalating a complex case.",
      "Resolving an account problem."
    ],
    "characteristics": [
      {
        "label": "Task Switching",
        "value": "High"
      },
      {
        "label": "Need for Information Access",
        "value": "High"
      },
      {
        "label": "Workflow Complexity",
        "value": "Medium to High"
      }
    ],
    "quote": "I need the right information quickly so I can help the user effectively."
  },
  {
    "id": "accessibility-focused-user",
    "category": "Accessibility",
    "icon": "accessibility",
    "name": "Accessibility-focused user",
    "description": "Encounters visual, auditory, motor or cognitive barriers, including permanent, temporary and situational limitations.",
    "goals": [
      "Complete tasks independently.",
      "Access information in usable formats.",
      "Navigate without unnecessary barriers.",
      "Understand content and interactions.",
      "Use preferred interaction methods."
    ],
    "motivations": [
      "Independence.",
      "Accessibility.",
      "Efficiency.",
      "Reliability.",
      "Equal access."
    ],
    "painPoints": [
      "Inaccessible interface components.",
      "Poor keyboard navigation.",
      "Missing text alternatives.",
      "Insufficient contrast.",
      "Unclear focus indicators.",
      "Time-limited interactions.",
      "Complex or ambiguous instructions."
    ],
    "behaviours": [
      "May use assistive technology.",
      "May customise accessibility settings.",
      "May prefer alternative interaction methods.",
      "May navigate using keyboard controls.",
      "May adjust text size or display settings."
    ],
    "needs": [
      "Keyboard accessibility.",
      "Screen reader compatibility.",
      "Appropriate contrast.",
      "Resizable text.",
      "Clear focus indicators.",
      "Accessible error messages.",
      "Flexible interaction methods.",
      "WCAG-aligned experiences."
    ],
    "scenarios": [
      "Completing a form using a keyboard.",
      "Navigating with a screen reader.",
      "Using a product at increased zoom.",
      "Completing tasks with reduced motor precision.",
      "Accessing content in a noisy environment."
    ],
    "characteristics": [
      {
        "label": "Assistive Technology Usage",
        "value": "Research-dependent"
      },
      {
        "label": "Preferred Interaction Method",
        "value": "Research-dependent"
      },
      {
        "label": "Accessibility Barriers",
        "value": "Context-dependent"
      }
    ],
    "quote": "I want to complete the same tasks without unnecessary barriers.",
    "additionalFields": [
      "Assistive Technology",
      "Preferred Input Method",
      "Accessibility Barriers",
      "Content Presentation Preferences",
      "Interaction Preferences"
    ]
  },
  {
    "id": "misuse-anti-persona",
    "category": "Risk",
    "icon": "shield-alert",
    "name": "Misuse or anti-persona",
    "description": "Represents accidental or deliberate misuse that could harm users, the service or the business.",
    "goals": [
      "Identify possible misuse scenarios.",
      "Understand how functionality might be misused.",
      "Explore accidental user errors.",
      "Identify system vulnerabilities.",
      "Define appropriate safeguards."
    ],
    "motivations": [
      "Accidental misuse.",
      "Misunderstanding of functionality.",
      "Circumvention of intended workflows.",
      "Unauthorised advantage.",
      "Intentional exploitation."
    ],
    "painPoints": [
      "Unclear restrictions.",
      "Ambiguous permissions.",
      "Poorly communicated consequences.",
      "Inadequate error prevention.",
      "Insufficient misuse safeguards."
    ],
    "behaviours": [
      "Attempts unsupported workflows.",
      "May misunderstand system boundaries.",
      "May perform unintended actions.",
      "May attempt prohibited actions.",
      "May exploit poorly controlled functionality."
    ],
    "needs": [
      "Clear boundaries.",
      "Appropriate guardrails.",
      "Safe error recovery.",
      "Permission enforcement.",
      "Abuse prevention mechanisms.",
      "Monitoring and auditability."
    ],
    "scenarios": [
      "Attempting an unauthorised operation.",
      "Repeated accidental data modification.",
      "Attempting to bypass permissions.",
      "Misusing shared access.",
      "Attempting prohibited bulk operations."
    ],
    "characteristics": [
      {
        "label": "Misuse Type",
        "value": "Accidental / Intentional"
      },
      {
        "label": "Potential Impact",
        "value": "Configurable"
      },
      {
        "label": "Likelihood",
        "value": "Research-dependent"
      },
      {
        "label": "Detection Difficulty",
        "value": "Research-dependent"
      }
    ],
    "quote": "What happens if someone uses this feature in a way it wasn't intended?",
    "additionalFields": [
      "Misuse Scenario",
      "Potential Impact",
      "Likelihood",
      "Existing Safeguards",
      "Recommended Mitigation",
      "Detection Method"
    ]
  }
] as const;
