import {
  IllustrationCircle,
  IllustrationPath,
} from "./IllustrationShapes.js";

export function NoPersonasIllustration() {
  return (
    <>
      <IllustrationPath
        d="M207 65C210.866 65 214 68.134 214 72C214 75.866 210.866 79 207 79H167C170.866 79 174 82.134 174 86C174 89.866 170.866 93 167 93H189C192.866 93 196 96.134 196 100C196 103.866 192.866 107 189 107H178.826C173.952 107 170 110.134 170 114C170 116.577 172 118.911 176 121C179.866 121 183 124.134 183 128C183 131.866 179.866 135 176 135H93C89.134 135 86 131.866 86 128C86 124.134 89.134 121 93 121H54C50.134 121 47 117.866 47 114C47 110.134 50.134 107 54 107H94C97.866 107 101 103.866 101 100C101 96.134 97.866 93 94 93H69C65.134 93 62 89.866 62 86C62 82.134 65.134 79 69 79H109C105.134 79 102 75.866 102 72C102 68.134 105.134 65 109 65H207ZM207 93C210.866 93 214 96.134 214 100C214 103.866 210.866 107 207 107C203.134 107 200 103.866 200 100C200 96.134 203.134 93 207 93Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="blue.subtle"
      />
      <IllustrationPath
        d="M83 66L143 58C145.2 57.7 147.2 59.3 147.5 61.5L158 140C158.3 142.2 156.7 144.2 154.5 144.5L88.5 153C86.3 153.3 84.3 151.7 84 149.5L74 73C73.7 70.8 75.3 68.8 77.5 68.5L79 68.3"
        fill="bg.panel"
        stroke="blue.fg"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <IllustrationPath
        d="M80 74L144 65L153 140L89 148Z"
        fill="blue.muted"
      />
      <IllustrationPath
        d="M92 50H158C160.2 50 162 51.8 162 54V139C162 141.2 160.2 143 158 143H92C89.8 143 88 141.2 88 139V54C88 51.8 89.8 50 92 50Z"
        fill="bg.panel"
        stroke="blue.fg"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <IllustrationPath
        d="M103 114C103 102.4 112.8 96 125 96C137.2 96 147 102.4 147 114V116H103V114Z"
        fill="blue.muted"
        stroke="blue.fg"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <IllustrationCircle
        cx="125"
        cy="82"
        r="14"
        fill="bg.panel"
        stroke="blue.fg"
        strokeWidth="2.5"
      />
      <IllustrationPath
        d="M114 79C115.4 74.7 119 71.8 123.3 71.2"
        stroke="blue.fg"
        strokeWidth="2.5"
        strokeOpacity={0.55}
        strokeLinecap="round"
      />
      <IllustrationPath
        d="M104 127H146M113 135H137"
        stroke="blue.fg"
        strokeWidth="2.5"
        strokeOpacity={0.55}
        strokeLinecap="round"
      />
    </>
  );
}
