import Link from "next/link";
import NavLink from "./NavLink";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-transparent backdrop-blur-lg py-1 px-6">
      <nav className="flex items-center justify-between flex-wrap">
        <div className="flex items-center flex-no-shrink text-white mr-6">
          <Link href="/">
            <a>
              <svg
                className="h-12 w-12 text-white"
                width="54"
                height="54"
                viewBox="0 0 180 180"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M142.204 39.2737H38.7959C32.0656 39.2737 27.8361 46.5328 31.1551 52.3879L82.6164 143.173C85.9732 149.095 94.4997 149.113 97.8805 143.204L149.827 52.4187C153.178 46.5634 148.95 39.2737 142.204 39.2737Z"
                  fill="black"
                  stroke="black"
                />
                <path
                  d="M63.8723 49.3113L90.2214 95.7358L117.825 49.3113H105.278L90.2214 75.033L75.1648 49.3113H63.8723Z"
                  stroke="black"
                />
                <path
                  d="M90.2214 135.259L40.66 49.3113H51.9525L90.2214 115.811L128.49 49.3113H140.41L90.2214 135.259Z"
                  stroke="black"
                />
              </svg>
            </a>
          </Link>
        </div>
        <div className="grow flex items-center w-auto">
          <div className="text-sm grow">
            <NavLink href="/" activeClassName="font-bold">
              <a className="inline-block mt-0 mr-4 text-gray-900 dark:text-gray-50 transition-all motion-reduce:transition-none">
                Home
              </a>
            </NavLink>
            <NavLink href="/projects" activeClassName="font-bold">
              <a className="inline-block mt-0 mr-4 text-gray-900 dark:text-gray-50 transition-all motion-reduce:transition-none">
                Projects
              </a>
            </NavLink>
          </div>
          <ThemeSwitcher />
        </div>
      </nav>
    </header>
  );
}
