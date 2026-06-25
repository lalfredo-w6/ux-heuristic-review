export const NN_HEURISTICS = [
  {
    number: 1,
    name: 'Visibility of System Status',
    definition: 'The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time.',
    questions: [
      'Does the design clearly communicate its state?',
      'Is feedback presented quickly after user actions?'
    ]
  },
  {
    number: 2,
    name: 'Match Between System and the Real World',
    definition: "The design should speak the users' language. Use words, phrases, and concepts familiar to the user, rather than internal jargon. Follow real-world conventions, making information appear in a natural and logical order.",
    questions: [
      'Will users be familiar with the terminology used in the design?',
      "Do the design's controls follow real-world conventions?"
    ]
  },
  {
    number: 3,
    name: 'User Control and Freedom',
    definition: 'Users often perform actions by mistake. They need a clearly marked "emergency exit" to leave the unwanted action without having to go through an extended process.',
    questions: [
      'Does the design allow users to go back a step in the process?',
      'Are exit links easily discoverable?',
      'Can users easily cancel an action?',
      'Is Undo and Redo supported?'
    ]
  },
  {
    number: 4,
    name: 'Consistency and Standards',
    definition: 'Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform and industry conventions.',
    questions: [
      'Does the design follow industry conventions?',
      'Are visual treatments used consistently throughout the design?'
    ]
  },
  {
    number: 5,
    name: 'Error Prevention',
    definition: 'Good error messages are important, but the best designs carefully prevent problems from occurring in the first place. Either eliminate error-prone conditions, or check for them and present users with a confirmation option before they commit to the action.',
    questions: [
      'Does the design prevent slips by using helpful constraints?',
      'Does the design warn users before they perform risky actions?'
    ]
  },
  {
    number: 6,
    name: 'Recognition Rather Than Recall',
    definition: "Minimize the user's memory load by making elements, actions, and options visible. The user should not have to remember information from one part of the interface to another.",
    questions: [
      'Does the design keep important information visible, so that users do not have to memorize it?',
      'Does the design offer help in-context?'
    ]
  },
  {
    number: 7,
    name: 'Flexibility and Efficiency of Use',
    definition: 'Shortcuts — hidden from novice users — may speed up the interaction for the expert user. Allow users to tailor frequent actions.',
    questions: [
      'Does the design provide accelerators like keyboard shortcuts and touch gestures?',
      'Is content and functionality personalized or customized for individual users?'
    ]
  },
  {
    number: 8,
    name: 'Aesthetic and Minimalist Design',
    definition: 'Interfaces should not contain information that is irrelevant or rarely needed. Every extra unit of information competes with the relevant units and diminishes their relative visibility.',
    questions: [
      'Is the visual design and content focused on the essentials?',
      'Have all distracting, unnecessary elements been removed?'
    ]
  },
  {
    number: 9,
    name: 'Help Users Recognize, Diagnose, and Recover from Errors',
    definition: 'Error messages should be expressed in plain language (no error codes), precisely indicate the problem, and constructively suggest a solution.',
    questions: [
      'Does the design use traditional error message visuals, like bold, red text?',
      'Does the design offer a solution that solves the error immediately?'
    ]
  },
  {
    number: 10,
    name: 'Help and Documentation',
    definition: "It's best if the system doesn't need any additional explanation. However, it may be necessary to provide documentation to help users understand how to complete their tasks.",
    questions: [
      'Is help documentation easy to search?',
      'Is help provided in context right at the moment when the user requires it?'
    ]
  }
]
