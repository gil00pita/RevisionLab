import { useId } from "react";
import {
  IllustrationDefs,
  IllustrationMask,
  IllustrationPath,
  IllustrationUse,
} from "./IllustrationShapes.js";

export function NoDocumentsIllustration() {
  const id = useId();
  return (
    <>
      <IllustrationPath
        d="M207 65C210.866 65 214 68.134 214 72C214 75.866 210.866 79 207 79H167C170.866 79 174 82.134 174 86C174 89.866 170.866 93 167 93H189C192.866 93 196 96.134 196 100C196 103.866 192.866 107 189 107H178.826C173.952 107 170 110.134 170 114C170 116.577 172 118.911 176 121C179.866 121 183 124.134 183 128C183 131.866 179.866 135 176 135H93C89.134 135 86 131.866 86 128C86 124.134 89.134 121 93 121H54C50.134 121 47 117.866 47 114C47 110.134 50.134 107 54 107H94C97.866 107 101 103.866 101 100C101 96.134 97.866 93 94 93H69C65.134 93 62 89.866 62 86C62 82.134 65.134 79 69 79H109C105.134 79 102 75.866 102 72C102 68.134 105.134 65 109 65H207ZM207 93C210.866 93 214 96.134 214 100C214 103.866 210.866 107 207 107C203.134 107 200 103.866 200 100C200 96.134 203.134 93 207 93Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="blue.subtle"
      />
      <IllustrationPath
        d="M153.672 64L162.974 131.843L163.809 138.649C164.079 140.842 162.519 142.837 160.327 143.107L101.766 150.297C99.5738 150.566 97.578 149.007 97.3088 146.814L88.2931 73.3868C88.1584 72.2904 88.9381 71.2925 90.0344 71.1579C90.0413 71.1571 90.0483 71.1563 90.0552 71.1555L94.9136 70.6105M98.8421 70.1698L103.429 69.6553L98.8421 70.1698Z"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="bg.panel"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="blue.fg"
      />
      <IllustrationPath
        d="M151.14 68.2692L159.56 129.753L160.317 135.921C160.561 137.908 159.167 139.715 157.203 139.956L104.761 146.395C102.798 146.636 101.008 145.22 100.764 143.233L92.6141 76.8568C92.4795 75.7605 93.2591 74.7626 94.3555 74.628L100.843 73.8314"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="blue.muted"
      />
      <IllustrationUse href={`#${id}-stroke0_0_193`} fill="bg.panel" />
      <IllustrationMask id={`${id}-stroke1_0_193`} fill="fg" maskType="alpha">
        <IllustrationUse href={`#${id}-stroke0_0_193`} />
      </IllustrationMask>
      <IllustrationPath
        d="M110.672 134H169.672C171.881 134 173.672 132.209 173.672 130V67.4349C173.672 66.3736 173.25 65.3558 172.499 64.6056L159.056 51.1707C158.306 50.4211 157.289 50 156.229 50H110.672C108.463 50 106.672 51.7909 106.672 54V130C106.672 132.209 108.463 134 110.672 134Z"
        strokeWidth="5"
        stroke="blue.fg"
        mask={`url(#${id}-stroke1_0_193)`}
      />
      <IllustrationPath
        d="M156.672 52.4028V64C156.672 65.6569 158.015 67 159.672 67H167.605"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="blue.fg"
      />
      <IllustrationPath
        d="M118 118H144M118 67H144H118ZM118 79H161H118ZM118 92H161H118ZM118 105H161H118Z"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="blue.fg"
        strokeOpacity={0.55}
      />
      <IllustrationDefs>
        <IllustrationPath
          id={`${id}-stroke0_0_193`}
          d="M106.672 54C106.672 51.7909 108.463 50 110.672 50H156.229C157.289 50 158.306 50.4211 159.056 51.1707L172.499 64.6056C173.25 65.3558 173.672 66.3736 173.672 67.4349V130C173.672 132.209 171.881 134 169.672 134H110.672C108.463 134 106.672 132.209 106.672 130V54Z"
          fillRule="evenodd"
          clipRule="evenodd"
        />
      </IllustrationDefs>
    </>
  );
}
